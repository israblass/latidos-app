create table public.banners (id uuid primary key default gen_random_uuid(), titulo text not null, imagen_url text, enlace_url text, orden integer not null default 0, activo boolean not null default true, creado_en timestamptz not null default now());
alter table public.banners enable row level security;
create policy banners_select_activos on public.banners for select to authenticated using (activo = true);
revoke all on table public.banners from anon;
revoke all on table public.banners from public;
revoke all on table public.banners from authenticated;
grant select on table public.banners to authenticated;
insert into public.banners (titulo, imagen_url, enlace_url, orden, activo) values ('Tu marca aquí', '/banners/tu-marca-aqui-corazon.webp', null, 0, true), ('Tu marca aquí', '/banners/tu-marca-aqui-donaciones.webp', null, 1, true), ('Tu marca aquí', '/banners/tu-marca-aqui-ecg.webp', null, 2, true);
