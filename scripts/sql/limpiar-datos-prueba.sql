-- Latidos App - Beats, Fase 1 (T009)
-- Limpieza de datos de prueba: marcas, QR y sus escaneos.
--
-- Desde la Fase 1 de Beats, una marca o un QR con escaneos no se puede borrar
-- (spec §9 regla 6): se desactiva. Este script es la excepcion explicita, para
-- quitar lo que se creo solo para probar, o todo antes del lanzamiento publico.
--
-- COMO USARLO
--   1. Edita la lista de abajo (bloque "EDITAR AQUI"):
--        - `marcas`: se borran esas marcas, todos sus QR y todos sus escaneos.
--        - `qrs`: se borran esos QR y sus escaneos (la marca se queda).
--        - `todo`: true borra TODAS las marcas, QR y escaneos. Solo antes del
--          lanzamiento publico.
--   2. Pega el archivo completo en el SQL Editor de Supabase y ejecutalo.
--   3. El ultimo resultado es la reconciliacion: debe salir vacia.
--
-- QUE HACE, en una sola transaccion
--   - Borra, en este orden, los movimientos de escaneo, los escaneos, los QR y
--     las marcas indicadas. El orden importa: cada uno esta protegido por el
--     siguiente con borrado restringido.
--   - Recalcula el saldo de cada cuenta desde su libro. Las bienvenidas, los
--     ajustes y los regalos se conservan.
--   - Comprueba la reconciliacion antes de confirmar: si algo no cuadra, se
--     deshace todo y no queda nada a medias.

begin;

-- ============================ EDITAR AQUI ===================================
create temp table limpieza_config on commit drop as
select
  false                    as todo,
  array[
    -- 'a1000000-0000-4000-8000-000000000002'
  ]::uuid[]                as marcas,
  array[
    -- 'b2000000-0000-4000-8000-000000000003'
  ]::uuid[]                as qrs;
-- ============================================================================

-- Los QR a borrar: los listados, los de las marcas listadas, o todos.
create temp table limpieza_qr on commit drop as
select q.id
  from public.qr_marca q, limpieza_config c
 where c.todo
    or q.id = any (c.qrs)
    or q.marca_id = any (c.marcas);

create temp table limpieza_escaneos on commit drop as
select e.id
  from public.escaneos e
 where e.qr_marca_id in (select id from limpieza_qr);

-- 1. Movimientos de esos escaneos. Borrar del libro no toca el saldo (el
--    disparador solo corre al insertar); el recalculo de abajo lo pone al dia.
delete from public.movimientos_beats
 where escaneo_id in (select id from limpieza_escaneos);

-- 2. Los escaneos.
delete from public.escaneos
 where id in (select id from limpieza_escaneos);

-- 3. Los QR.
delete from public.qr_marca
 where id in (select id from limpieza_qr);

-- 4. Las marcas. Si una marca listada todavia tuviera algo encima, el borrado
--    restringido lo frena aqui y la transaccion entera se revierte.
delete from public.marcas m
 using limpieza_config c
 where c.todo or m.id = any (c.marcas);

-- 5. Saldos recalculados desde el libro, con la misma marca que usa el
--    disparador: sin ella el candado rechaza el cambio.
select set_config('latidos.desde_libro', 'si', true);

update public.usuarios u
   set beats_balance = l.suma
  from (
    select u2.id,
           coalesce((select sum(m.beats) from public.movimientos_beats m
                      where m.usuario_id = u2.id), 0)::integer as suma
      from public.usuarios u2
  ) l
 where l.id = u.id
   and u.beats_balance <> l.suma;

select set_config('latidos.desde_libro', '', true);

-- 6. Antes de confirmar: si algun saldo no cuadra con su libro, se aborta.
do $$
begin
  if exists (
    select 1
      from public.usuarios u
      left join (
        select usuario_id, sum(beats) as suma
          from public.movimientos_beats group by usuario_id
      ) l on l.usuario_id = u.id
     where u.beats_balance <> coalesce(l.suma, 0)
  ) then
    raise exception 'la limpieza deja saldos descuadrados; no se aplico nada';
  end if;
end;
$$;

commit;

-- Reconciliacion (la misma de scripts/sql/reconciliacion-saldos.sql).
-- DEBE SALIR VACIA.
select u.id as usuario_id, u.correo, 'saldo_descuadrado' as problema,
       format('saldo %s, suma del libro %s', u.beats_balance, coalesce(m.suma, 0)) as detalle
  from public.usuarios u
  left join (
    select usuario_id, sum(beats) as suma
      from public.movimientos_beats
     group by usuario_id
  ) m on m.usuario_id = u.id
 where u.beats_balance <> coalesce(m.suma, 0)
union all
select e.usuario_id, u.correo, 'escaneo_sin_movimiento',
       format('escaneo %s del %s', e.id, e.dia_local)
  from public.escaneos e
  join public.usuarios u on u.id = e.usuario_id
 where not exists (select 1 from public.movimientos_beats m where m.escaneo_id = e.id)
union all
select u.id, u.correo, 'sin_bienvenida', 'la cuenta no tiene movimiento de bienvenida'
  from public.usuarios u
 where not exists (
   select 1 from public.movimientos_beats m
    where m.usuario_id = u.id and m.tipo = 'bienvenida'
 )
order by 2, 3;
