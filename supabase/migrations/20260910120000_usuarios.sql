-- Latidos App - Fase 1
-- Tabla de perfil de usuario final (T003) y politicas RLS basicas (T004).

-- Escrita para poder pegarse tal cual en el SQL Editor del panel de Supabase
-- mas de una vez sin romperse.

-- Tipo de usuario autodeclarado. Exactamente tres valores (spec §9 regla 3).
do $$
begin
  create type public.tipo_usuario as enum ('estudiante_ucv', 'egresado', 'externo');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Datos autodeclarados: en esta fase no se validan contra ningun padron
  -- (spec §9 regla 2). La cedula queda como texto libre y SIN constraint
  -- unique a proposito (plan, Decision Tecnica 6): mientras no exista
  -- verificacion real (OTP, post-beta) un unique bloquearia registros
  -- legitimos por errores de tipeo y no aportaria integridad real.
  cedula text not null,
  nombre text not null,
  apellido text not null,
  telefono text not null,
  correo text not null,
  tipo_usuario public.tipo_usuario not null,

  -- El onboarding se muestra una unica vez por cuenta (spec §9 regla 5).
  onboarding_visto boolean not null default false,
  notificaciones_habilitadas boolean not null default false,

  -- Balance de Beats. Solo se modifica desde el servidor; el cliente
  -- nunca puede escribirlo (constitution §9, seguridad).
  beats_balance integer not null default 0 check (beats_balance >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.usuarios.cedula is
  'Autodeclarada, sin validacion contra padron y sin unique en Fase 1.';

create index if not exists usuarios_cedula_idx on public.usuarios (cedula);

-- updated_at automatico
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists usuarios_updated_at on public.usuarios;
create trigger usuarios_updated_at
  before update on public.usuarios
  for each row
  execute function public.tocar_updated_at();

-- El balance de Beats es server-side: cualquier update que llegue con el
-- rol del usuario (authenticated) y pretenda cambiarlo se rechaza.
create or replace function public.proteger_beats_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.beats_balance is distinct from old.beats_balance
     and current_setting('request.jwt.claim.role', true) = 'authenticated' then
    raise exception 'beats_balance solo se modifica del lado del servidor';
  end if;
  return new;
end;
$$;

drop trigger if exists usuarios_proteger_beats_balance on public.usuarios;
create trigger usuarios_proteger_beats_balance
  before update on public.usuarios
  for each row
  execute function public.proteger_beats_balance();

-- RLS: cada usuario solo ve y toca su propia fila (constitution §9).
alter table public.usuarios enable row level security;

drop policy if exists "usuarios_select_propio" on public.usuarios;
create policy "usuarios_select_propio"
  on public.usuarios for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "usuarios_insert_propio" on public.usuarios;
create policy "usuarios_insert_propio"
  on public.usuarios for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "usuarios_update_propio" on public.usuarios;
create policy "usuarios_update_propio"
  on public.usuarios for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No se define policy de delete: borrar la cuenta no es parte de esta fase.
