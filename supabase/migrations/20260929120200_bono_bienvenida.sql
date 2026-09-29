-- Latidos App - Beats, Fase 1 (T004)
-- Bono de bienvenida al crear el perfil.
-- Escrita para poder pegarse en el SQL Editor mas de una vez.

-- --------------------------------------------------- Monto configurable -----

-- Lo cambia el admin (hoy, el equipo tecnico desde el editor SQL). Mayor que 0:
-- una "bienvenida" de 0 Beats seria una fila vacia en el historial, y el libro
-- tampoco la aceptaria.
alter table public.configuracion_app
  add column if not exists beats_bienvenida integer not null default 5;

alter table public.configuracion_app
  drop constraint if exists configuracion_app_beats_bienvenida_positivo;
alter table public.configuracion_app
  add constraint configuracion_app_beats_bienvenida_positivo check (beats_bienvenida > 0);

-- -------------------------------------------------- Dia local en la base ----

/*
 * Dia calendario en hora de Caracas para los movimientos que nacen en la base
 * (bienvenida, ajustes, regalos, carga retroactiva). El canje no la usa: recibe
 * el dia ya calculado por src/lib/fecha/limite-diario.ts.
 *
 * La zona tiene que ser la misma que ZONA_HORARIA en la app; si algun dia se
 * cambia alla, se cambia aqui. No es inmutable (depende de la tabla de zonas),
 * por eso es `stable` y nunca se usa dentro de un indice.
 */
create or replace function public.dia_local_latidos(p_instante timestamptz)
returns date
language sql
stable
set search_path = public
as $$
  select (p_instante at time zone 'America/Caracas')::date;
$$;

-- ------------------------------------------------ Otorgar la bienvenida -----

-- Esquema que PostgREST no expone: lo que vive aqui no se puede llamar desde
-- la API aunque el rol tenga permiso de ejecutarlo.
create schema if not exists interno;
revoke all on schema interno from public;
grant usage on schema interno to authenticated, service_role;

/*
 * Inserta la bienvenida de una persona, una sola vez (spec de registro §9.16).
 *
 * Es security definer porque quien crea el perfil es la propia persona con su
 * sesion (src/lib/usuario/asegurar-perfil.ts), y ese rol no puede escribir en
 * el libro. Por eso tambien vive en `interno` y no en `public`: el disparador
 * la necesita ejecutable por `authenticated`, pero nadie debe poder invocarla
 * como RPC.
 *
 * Idempotente por el indice unico parcial de la bienvenida: un segundo intento
 * no hace nada. Sin fila de configuracion, usa 5.
 */
create or replace function interno.otorgar_bienvenida(p_usuario_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_beats integer;
  v_ahora timestamptz := now();
begin
  -- Con sesion, solo la propia persona. Sin sesion (editor SQL, carga
  -- retroactiva) no hay a quien comparar.
  if auth.uid() is not null and auth.uid() <> p_usuario_id then
    raise exception 'la bienvenida solo se otorga a la propia cuenta';
  end if;

  select beats_bienvenida into v_beats from public.configuracion_app limit 1;

  insert into public.movimientos_beats (usuario_id, tipo, beats, ocurrido_en, dia_local)
  values (p_usuario_id, 'bienvenida', coalesce(v_beats, 5), v_ahora,
          public.dia_local_latidos(v_ahora))
  on conflict (usuario_id) where tipo = 'bienvenida' do nothing;
end;
$$;

revoke all on function interno.otorgar_bienvenida(uuid) from public, anon;
grant execute on function interno.otorgar_bienvenida(uuid) to authenticated, service_role;

/*
 * Disparador al crear el perfil (plan §4, decision 5): cubre cualquier via de
 * creacion, con confirmacion de correo activada o no, y hasta un insert a mano.
 *
 * No es security definer (barrido estructural de rls.test.ts); los privilegios
 * los pone la funcion de arriba.
 */
create or replace function public.bienvenida_al_crear_perfil()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform interno.otorgar_bienvenida(new.id);
  return new;
end;
$$;

drop trigger if exists usuarios_bienvenida on public.usuarios;
create trigger usuarios_bienvenida
  after insert on public.usuarios
  for each row
  execute function public.bienvenida_al_crear_perfil();
