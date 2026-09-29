-- Latidos App - Beats, Fase 1 (T008)
-- Carga retroactiva del libro de movimientos.
-- Escrita para poder pegarse en el SQL Editor mas de una vez: la segunda vez
-- no encuentra nada que cargar y el recalculo no cambia ningun saldo.
--
-- ANTES de aplicarla, correr scripts/sql/reporte-saldos-previo.sql: esta
-- migracion reemplaza los saldos actuales por los que salen del libro.

/*
 * Pasa al libro todo lo que existia antes de el (plan §4, decision 4):
 *
 *   1. Un movimiento de tipo escaneo por cada escaneo que todavia no lo tenga,
 *      con su fecha real. El dia se recalcula en hora de Caracas desde
 *      confirmado_en: los escaneos anteriores a la Fase 5 recibieron un
 *      dia_local en UTC al crearse esa columna, y el historial tiene que
 *      agruparlos en el dia en que de verdad ocurrieron.
 *   2. La bienvenida a cada cuenta que no la tenga, con fecha de hoy (el dia
 *      de la migracion).
 *   3. El saldo de cada cuenta, recalculado como la suma de su libro.
 *
 * Los pasos 1 y 2 pasan por el disparador del libro, que suma sobre el saldo
 * viejo; el paso 3 lo corrige. Se descarto crear un "Ajuste Latidos" por la
 * diferencia: solo preservaria numeros de prueba y ensuciaria esos historiales
 * para siempre.
 *
 * Todo va en un unico bloque para que sea una sola sentencia: o se aplica
 * entero o no se aplica nada, aunque el editor SQL no abra una transaccion.
 */
do $$
begin
  insert into public.movimientos_beats
    (usuario_id, tipo, beats, ocurrido_en, dia_local, marca_id, escaneo_id)
  select e.usuario_id, 'escaneo', e.beats_otorgados, e.confirmado_en,
         public.dia_local_latidos(e.confirmado_en), q.marca_id, e.id
    from public.escaneos e
    join public.qr_marca q on q.id = e.qr_marca_id
   where e.beats_otorgados <> 0
     and not exists (
       select 1 from public.movimientos_beats m where m.escaneo_id = e.id
     );

  perform interno.otorgar_bienvenida(u.id)
     from public.usuarios u
    where not exists (
      select 1 from public.movimientos_beats m
       where m.usuario_id = u.id and m.tipo = 'bienvenida'
    );

  -- La unica actualizacion directa del saldo fuera del disparador, y por eso
  -- lleva la misma marca que el: es el recalculo desde el libro, no una
  -- edicion a mano.
  perform set_config('latidos.desde_libro', 'si', true);

  update public.usuarios u
     set beats_balance = l.suma
    from (
      select usuario_id, sum(beats)::integer as suma
        from public.movimientos_beats
       group by usuario_id
    ) l
   where l.usuario_id = u.id
     and u.beats_balance <> l.suma;

  perform set_config('latidos.desde_libro', '', true);
end;
$$;
