-- Latidos App - Beats, Fase 1 (T006)
-- Ajustes y regalos de Latidos, la unica via manual para mover Beats.
-- Escrita para poder pegarse en el SQL Editor mas de una vez.

/*
 * Uso desde el editor SQL de Supabase (hoy lo usa el equipo tecnico; mañana,
 * el backoffice):
 *
 *   -- Regalo de 20 Beats a una cuenta:
 *   select * from public.registrar_movimiento_latidos(
 *     (select id from public.usuarios where correo = 'persona@ejemplo.com'),
 *     'regalo',
 *     20
 *   );
 *
 *   -- Ajuste de -10 (por ejemplo, para corregir un error):
 *   select * from public.registrar_movimiento_latidos(
 *     '00000000-0000-0000-0000-000000000000', 'ajuste', -10
 *   );
 *
 * Devuelve una fila con movimiento_id y saldo_resultante. Si algo no cuadra
 * (tipo invalido, 0 Beats, regalo negativo, cuenta inexistente o saldo que
 * quedaria negativo) falla con un mensaje y no crea nada.
 *
 * Existe porque el saldo ya no se edita a mano (spec §9 regla 2): cada cambio
 * deja un movimiento con nombre ("Ajuste Latidos" o "Regalo Latidos") en el
 * historial de la persona.
 */
create or replace function public.registrar_movimiento_latidos(
  p_usuario_id uuid,
  p_tipo public.tipo_movimiento_beats,
  p_beats integer
)
returns table (movimiento_id uuid, saldo_resultante integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ahora timestamptz := now();
  v_movimiento uuid;
  v_saldo integer;
begin
  if p_tipo is null or p_tipo not in ('ajuste', 'regalo') then
    raise exception 'tipo invalido: solo se aceptan ajuste o regalo'
      using errcode = '22023';
  end if;

  if p_beats is null or p_beats = 0 then
    raise exception 'beats no puede ser 0' using errcode = '22023';
  end if;

  -- Un regalo que resta no es un regalo: para quitar Beats esta el ajuste.
  if p_tipo = 'regalo' and p_beats < 0 then
    raise exception 'un regalo no puede ser negativo; usa ajuste' using errcode = '22023';
  end if;

  -- `for update` bloquea la fila de la persona: un canje simultaneo espera, y
  -- la cuenta de abajo no se hace sobre un saldo que ya cambio.
  select beats_balance into v_saldo
    from public.usuarios where id = p_usuario_id
     for update;

  if not found then
    raise exception 'no existe el usuario %', p_usuario_id using errcode = 'P0002';
  end if;

  -- El check de usuarios tambien lo impediria (y es la garantia de fondo),
  -- pero asi el mensaje dice que paso en vez de nombrar una restriccion.
  if v_saldo + p_beats < 0 then
    raise exception 'el saldo quedaria negativo (saldo actual %, movimiento %)', v_saldo, p_beats
      using errcode = '23514';
  end if;

  insert into public.movimientos_beats (usuario_id, tipo, beats, ocurrido_en, dia_local)
  values (p_usuario_id, p_tipo, p_beats, v_ahora, public.dia_local_latidos(v_ahora))
  returning id into v_movimiento;

  select beats_balance into v_saldo from public.usuarios where id = p_usuario_id;

  movimiento_id := v_movimiento;
  saldo_resultante := v_saldo;
  return next;
end;
$$;

-- Nadie desde la app: ni anon ni authenticated. Queda el dueño de la base (el
-- editor SQL) y el rol de servicio, que es lo que usara el backoffice.
revoke all on function public.registrar_movimiento_latidos(uuid, public.tipo_movimiento_beats, integer)
  from public, anon, authenticated;
grant execute on function public.registrar_movimiento_latidos(uuid, public.tipo_movimiento_beats, integer)
  to service_role;
