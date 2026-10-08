-- Foto de perfil (constitution §2, v2.12.0): la ruta del archivo en el bucket
-- privado `avatares` de Supabase Storage. Null = sin foto (se ven las
-- iniciales).
--
-- La ruta siempre empieza por el id de la persona y una barra
-- ("<uuid>/avatar-1700000000000.webp"): es la carpeta que las politicas de
-- storage.objects le dejan tocar (supabase/storage/avatares.sql).
--
-- Idempotente: se puede correr dos veces sin error. El bucket y sus politicas
-- NO van aqui: el CI aplica estas migraciones sobre un Postgres sin el esquema
-- `storage`. Van en supabase/storage/avatares.sql, que se corre a mano en el
-- SQL Editor de Supabase.

alter table public.usuarios
  add column if not exists avatar_path text null;

alter table public.usuarios
  drop constraint if exists usuarios_avatar_path_propio;

alter table public.usuarios
  add constraint usuarios_avatar_path_propio
  check (avatar_path is null or starts_with(avatar_path, id::text || '/'));
