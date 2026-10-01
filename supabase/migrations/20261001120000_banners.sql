create table if not exists public.banners (id uuid primary key default gen_random_uuid(), titulo text not null, imagen_url text, enlace_url text, orden integer not null default 0, activo boolean not null default true, creado_en timestamptz not null default now());
alter table public.banners enable row level security;
drop policy if exists banners_select_activos on public.banners;
create policy banners_select_activos on public.banners for select to authenticated using (activo = true);
revoke all on table public.banners from anon;
revoke all on table public.banners from public;
revoke all on table public.banners from authenticated;
grant select on table public.banners to authenticated;
insert into public.banners (titulo, imagen_url, enlace_url, orden, activo) select v.titulo, v.imagen_url, v.enlace_url, v.orden, v.activo from (values ('Tu marca aquí', '/banners/tu-marca-aqui-corazon.webp', null::text, 0, true), ('Tu marca aquí', '/banners/tu-marca-aqui-donaciones.webp', null::text, 1, true), ('Tu marca aquí', '/banners/tu-marca-aqui-ecg.webp', null::text, 2, true)) as v (titulo, imagen_url, enlace_url, orden, activo) where not exists (select 1 from public.banners b where b.imagen_url = v.imagen_url);
