-- Latidos App - Fase 5
-- Configuracion de la app (modo evento) y canje atomico de un QR de marca.
-- Escrita para poder pegarse en el SQL Editor mas de una vez.

-- --------------------------------------------------------- Configuracion ----

create table if not exists public.configuracion_app (
  id uuid primary key default gen_random_uuid(),
  -- Toggle global que decide el copy de cierre de un canje (spec §9 regla 12).
  modo_evento_activo boolean not null default false,
  updated_at timestamptz not null default now(),

  -- Singleton: una sola fila, garantizado por la base y no por convencion
  -- (plan, Decision Tecnica 1).
  fila_unica boolean not null default true,
  constraint configuracion_app_singleton unique (fila_unica),
  constraint configuracion_app_fila_unica check (fila_unica)
);

drop trigger if exists configuracion_app_updated_at on public.configuracion_app;
create trigger configuracion_app_updated_at
  before update on public.configuracion_app
  for each row
  execute function public.tocar_updated_at();

alter table public.configuracion_app enable row level security;

-- Cualquiera con cuenta la lee; cambiarla es cosa del admin desde backoffice
-- (spec §9 regla 13), y por eso no hay policy de escritura.
drop policy if exists "configuracion_select_autenticado" on public.configuracion_app;
create policy "configuracion_select_autenticado"
  on public.configuracion_app for select
  to authenticated
  using (true);

-- ------------------------------------------------- Dia local del escaneo ----

-- El dia calendario en la zona del programa, guardado explicito. Sirve para
-- que "una vez al dia por persona" lo garantice un indice unico y no solo la
-- comprobacion previa: dos confirmaciones simultaneas no pueden colarse.
-- No se usa una expresion sobre confirmado_en porque `at time zone` no es
-- inmutable y Postgres no la deja indexar.
alter table public.escaneos
  add column if not exists dia_local date;

update public.escaneos set dia_local = confirmado_en::date where dia_local is null;

alter table public.escaneos alter column dia_local set not null;

create unique index if not exists escaneos_uno_por_dia_idx
  on public.escaneos (usuario_id, qr_marca_id, dia_local);

-- ------------------------------------------------- Proteccion del balance ---

/*
 * El balance de Beats no lo puede escribir el cliente (constitution §9).
 *
 * La version anterior miraba el claim `role` del JWT, pero ese claim sigue
 * diciendo `authenticated` tambien dentro de una funcion SECURITY DEFINER: el
 * canje legitimo quedaba bloqueado por su propio guardia.
 *
 * Ahora mira `current_user`, que si distingue los dos casos, y el trigger deja
 * de ser SECURITY DEFINER a proposito: si lo fuera, `current_user` seria
 * siempre el dueño de la funcion y el guardia no bloquearia nada. No necesita
 * privilegios elevados para comparar dos valores.
 */
create or replace function public.proteger_beats_balance()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.beats_balance is distinct from old.beats_balance
     and current_user in ('authenticated', 'anon') then
    raise exception 'beats_balance solo se modifica del lado del servidor';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------- Canje de un QR --------

/*
 * Confirma el canje de un QR y otorga los Beats, todo en una transaccion.
 *
 * Revalida las condiciones en vez de confiar en la validacion previa (plan,
 * Decision Tecnica 3): entre que la persona vio la pantalla de confirmacion y
 * toco el boton, otro pudo agotar el codigo o el admin pudo apagarlo.
 *
 * El cupo se reserva con un UPDATE condicional. Ese UPDATE bloquea la fila, asi
 * que dos confirmaciones simultaneas se ordenan: la segunda ve el contador ya
 * movido, su condicion falla y se va por limite_alcanzado. Contar primero y
 * actualizar despues dejaria pasar a las dos.
 *
 * Los Beats se copian al registro de Escaneo (plan, Decision Tecnica 4): si el
 * admin los cambia mañana, este registro sigue diciendo lo que la persona gano.
 *
 * El corte del dia llega como parametro y no se calcula aqui, para que la regla
 * de medianoche viva en un solo lugar (src/lib/fecha/limite-diario.ts).
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

  -- Reserva del cupo. El RETURNING solo trae fila si el QR existe, esta activo
  -- y todavia tiene usos disponibles.
  update public.qr_marca
     set escaneos_totales_contador = escaneos_totales_contador + 1
   where id = p_qr_marca_id
     and estado = 'activo'
     and (limite_total_escaneos is null
          or escaneos_totales_contador < limite_total_escaneos)
  returning beats_otorgados into v_beats;

  if v_beats is null then
    select exists (
      select 1 from public.qr_marca where id = p_qr_marca_id and estado = 'activo'
    ) into v_existe_activo;

    -- Existe y esta activo pero no entro: se quedo sin cupo. Si no existe o
    -- esta apagado, se responde lo mismo que a un codigo cualquiera.
    return jsonb_build_object(
      'ok', false,
      'motivo', case when v_existe_activo then 'limite_alcanzado' else 'qr_invalido' end
    );
  end if;

  insert into public.escaneos
    (usuario_id, qr_marca_id, beats_otorgados, confirmado_en, dia_local)
  values
    (v_usuario, p_qr_marca_id, v_beats, now(), p_dia_local);

  update public.usuarios
     set beats_balance = beats_balance + v_beats
   where id = v_usuario
  returning beats_balance into v_balance;

  return jsonb_build_object(
    'ok', true,
    'beats_otorgados', v_beats,
    'beats_balance_actualizado', v_balance
  );

exception
  -- El indice unico es la ultima linea de defensa del limite diario, para el
  -- caso en que dos confirmaciones pasen la comprobacion de arriba a la vez.
  -- Al saltar aqui se deshace todo lo hecho en el bloque, incluida la reserva
  -- del cupo.
  when unique_violation then
    return jsonb_build_object('ok', false, 'motivo', 'ya_escaneado_hoy');
end;
$$;

revoke all on function public.confirmar_canje_qr(uuid, timestamptz, date) from public;
grant execute on function public.confirmar_canje_qr(uuid, timestamptz, date) to authenticated;
