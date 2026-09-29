-- Latidos App - Beats, Fase 1 (T005)
-- El canje de un QR pasa por el libro de movimientos.
-- Escrita para poder pegarse en el SQL Editor mas de una vez.

/*
 * Misma firma, mismas revalidaciones y mismos motivos de error que la version
 * de la Fase 5 (20260911180000_canje.sql). Lo unico que cambia es como llegan
 * los Beats al saldo: antes era un update directo de `usuarios.beats_balance`,
 * que el candado nuevo ya no permite; ahora se inserta el escaneo y despues su
 * movimiento de tipo escaneo, y el disparador del libro suma (plan §3).
 *
 * El movimiento lleva la marca del QR (para que el historial la muestre aunque
 * el QR se desactive), el id del escaneo, y la misma fecha y dia del escaneo:
 * asi el dia del historial y el del limite diario no pueden diferir.
 *
 * El saldo que se devuelve se lee de `usuarios` despues del disparador, que es
 * el valor autoritativo. El contrato de POST /api/qr/confirmar-canje no cambia.
 */
create or replace function public.confirmar_canje_qr(
  p_qr_marca_id uuid,
  p_inicio_del_dia timestamptz,
  p_dia_local date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_beats integer;
  v_marca uuid;
  v_escaneo uuid;
  v_confirmado_en timestamptz;
  v_balance integer;
  v_existe_activo boolean;
begin
  if v_usuario is null then
    return jsonb_build_object('ok', false, 'motivo', 'sesion_invalida');
  end if;

  if exists (
    select 1 from public.escaneos
     where usuario_id = v_usuario
       and qr_marca_id = p_qr_marca_id
       and confirmado_en >= p_inicio_del_dia
  ) then
    return jsonb_build_object('ok', false, 'motivo', 'ya_escaneado_hoy');
  end if;

  -- Reserva del cupo con un UPDATE condicional, que bloquea la fila y ordena
  -- dos confirmaciones simultaneas (ver la version de la Fase 5).
  update public.qr_marca
     set escaneos_totales_contador = escaneos_totales_contador + 1
   where id = p_qr_marca_id
     and estado = 'activo'
     and (limite_total_escaneos is null
          or escaneos_totales_contador < limite_total_escaneos)
  returning beats_otorgados, marca_id into v_beats, v_marca;

  if v_beats is null then
    select exists (
      select 1 from public.qr_marca where id = p_qr_marca_id and estado = 'activo'
    ) into v_existe_activo;

    return jsonb_build_object(
      'ok', false,
      'motivo', case when v_existe_activo then 'limite_alcanzado' else 'qr_invalido' end
    );
  end if;

  -- Los Beats se copian al escaneo y al movimiento: si el admin cambia el valor
  -- del QR mañana, lo ganado hoy no cambia (spec §9 regla 5).
  insert into public.escaneos
    (usuario_id, qr_marca_id, beats_otorgados, confirmado_en, dia_local)
  values
    (v_usuario, p_qr_marca_id, v_beats, now(), p_dia_local)
  returning id, confirmado_en into v_escaneo, v_confirmado_en;

  insert into public.movimientos_beats
    (usuario_id, tipo, beats, ocurrido_en, dia_local, marca_id, escaneo_id)
  values
    (v_usuario, 'escaneo', v_beats, v_confirmado_en, p_dia_local, v_marca, v_escaneo);

  select beats_balance into v_balance from public.usuarios where id = v_usuario;

  return jsonb_build_object(
    'ok', true,
    'beats_otorgados', v_beats,
    'beats_balance_actualizado', v_balance
  );

exception
  -- El indice unico por dia sigue siendo la ultima defensa del limite diario.
  -- Al saltar aqui se deshace todo el bloque: la reserva del cupo, el escaneo
  -- y el movimiento con su efecto en el saldo.
  when unique_violation then
    return jsonb_build_object('ok', false, 'motivo', 'ya_escaneado_hoy');
end;
$$;

revoke all on function public.confirmar_canje_qr(uuid, timestamptz, date) from public, anon;
grant execute on function public.confirmar_canje_qr(uuid, timestamptz, date) to authenticated;
