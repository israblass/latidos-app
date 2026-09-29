-- Latidos App - Beats, Fase 1 (T007)
-- Reporte previo a la migracion del libro de movimientos.
--
-- Se corre en el SQL Editor de Supabase ANTES de aplicar las migraciones
-- 20260929120000 a 20260929120500. Es de solo lectura: no cambia nada.
--
-- Para cada cuenta muestra el saldo que tiene hoy, el que va a tener despues de
-- la carga retroactiva (suma de sus escaneos + la bienvenida) y la diferencia.
-- La carga retroactiva recalcula el saldo desde el libro (plan §4, decision 4),
-- asi que cualquier diferencia distinta de 5 viene de Beats que se cargaron a
-- mano o de pruebas, y va a desaparecer: este reporte es la ultima foto de esos
-- numeros.
--
-- La bienvenida se cuenta como 5, que es el valor por defecto de
-- configuracion_app.beats_bienvenida; la columna todavia no existe cuando se
-- corre este reporte.

select
  u.correo,
  u.nombre || ' ' || u.apellido            as nombre,
  u.created_at::date                        as creada,
  u.beats_balance                           as saldo_actual,
  coalesce(e.escaneos, 0)                   as escaneos,
  coalesce(e.beats_escaneos, 0)             as beats_escaneos,
  5                                         as bienvenida,
  coalesce(e.beats_escaneos, 0) + 5         as saldo_recalculado,
  coalesce(e.beats_escaneos, 0) + 5 - u.beats_balance as diferencia
from public.usuarios u
left join (
  select usuario_id,
         count(*)             as escaneos,
         sum(beats_otorgados) as beats_escaneos
    from public.escaneos
   group by usuario_id
) e on e.usuario_id = u.id
order by abs(coalesce(e.beats_escaneos, 0) + 5 - u.beats_balance) desc, u.correo;
