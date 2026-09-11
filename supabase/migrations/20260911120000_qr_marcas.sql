-- Latidos App - Fase 4
-- Marcas, QR de marca y escaneos (T034-T036), segun el modelo de datos del
-- plan §2. Escrita para poder pegarse en el SQL Editor mas de una vez.

-- ---------------------------------------------------------------- Marcas ----

create table if not exists public.marcas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- QR de marca --

do $$
begin
  create type public.estado_qr as enum ('activo', 'inactivo');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.qr_marca (
  -- Este id es lo que viaja en el QR fisico.
  id uuid primary key default gen_random_uuid(),
  marca_id uuid not null references public.marcas (id) on delete cascade,

  -- El admin lo puede cambiar en cualquier momento sin reimprimir el codigo:
  -- el valor se resuelve del lado del servidor al escanear (constitution §6).
  beats_otorgados integer not null check (beats_otorgados > 0),

  -- null = sin limite de usos.
  limite_total_escaneos integer check (limite_total_escaneos > 0),
  escaneos_totales_contador integer not null default 0 check (escaneos_totales_contador >= 0),

  estado public.estado_qr not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- El contador nunca pasa del limite (plan §2, validaciones de QRMarca).
  constraint qr_marca_contador_dentro_del_limite
    check (limite_total_escaneos is null
           or escaneos_totales_contador <= limite_total_escaneos)
);

create index if not exists qr_marca_marca_id_idx on public.qr_marca (marca_id);

drop trigger if exists qr_marca_updated_at on public.qr_marca;
create trigger qr_marca_updated_at
  before update on public.qr_marca
  for each row
  execute function public.tocar_updated_at();

-- -------------------------------------------------------------- Escaneos ----

create table if not exists public.escaneos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  qr_marca_id uuid not null references public.qr_marca (id) on delete cascade,

  -- Copia del valor del QR al momento del canje: si el admin lo cambia
  -- despues, este registro conserva lo que la persona gano de verdad
  -- (plan, Decision Tecnica 4).
  beats_otorgados integer not null check (beats_otorgados > 0),

  -- Momento en que la persona confirmo, no en que se leyo el codigo.
  confirmado_en timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists escaneos_usuario_qr_idx
  on public.escaneos (usuario_id, qr_marca_id, confirmado_en desc);

-- ------------------------------------------------------------------- RLS ----

alter table public.marcas enable row level security;
alter table public.qr_marca enable row level security;
alter table public.escaneos enable row level security;

-- Las marcas son publicas para quien tiene cuenta: hay que poder mostrar el
-- nombre y el logo al validar un QR.
drop policy if exists "marcas_select_autenticado" on public.marcas;
create policy "marcas_select_autenticado"
  on public.marcas for select
  to authenticated
  using (true);

-- Solo se pueden leer los QR activos. Los inactivos no existen para la app.
drop policy if exists "qr_marca_select_activos" on public.qr_marca;
create policy "qr_marca_select_activos"
  on public.qr_marca for select
  to authenticated
  using (estado = 'activo');

-- Cada quien ve solo sus escaneos.
drop policy if exists "escaneos_select_propios" on public.escaneos;
create policy "escaneos_select_propios"
  on public.escaneos for select
  to authenticated
  using (auth.uid() = usuario_id);

-- No hay policies de insert, update ni delete a proposito: crear un escaneo y
-- mover el contador del QR son transacciones de Beats, y la constitution §9
-- exige que se validen del lado del servidor. Llegan en la Fase 5.
