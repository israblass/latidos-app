-- Latidos App - Beats, Fase 1 (T007)
-- Reconciliacion del saldo con el libro de movimientos.
--
-- Se corre en el SQL Editor de Supabase despues de aplicar las migraciones, y
-- cada vez que haga falta comprobar que todo cuadra. Es de solo lectura.
--
-- DEBE DEVOLVER VACIO. Cada fila es un problema:
--   - saldo_descuadrado: beats_balance no es la suma de los movimientos de la
--     cuenta (spec §9 regla 1).
--   - escaneo_sin_movimiento: un escaneo que no paso al libro, asi que su
--     marca no aparece en el historial.
--   - sin_bienvenida: una cuenta que no recibio el bono.

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
 where not exists (
   select 1 from public.movimientos_beats m where m.escaneo_id = e.id
 )

union all

select u.id, u.correo, 'sin_bienvenida', 'la cuenta no tiene movimiento de bienvenida'
  from public.usuarios u
 where not exists (
   select 1 from public.movimientos_beats m
    where m.usuario_id = u.id and m.tipo = 'bienvenida'
 )

order by 2, 3;
