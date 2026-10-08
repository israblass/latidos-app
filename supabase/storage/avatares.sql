-- Bucket privado `avatares` y sus politicas (constitution §2, v2.12.0).
--
-- NO es una migracion: el CI aplica supabase/migrations sobre un Postgres sin
-- el esquema `storage` de Supabase, y este archivo fallaria ahi. Se corre a
-- mano en el SQL Editor del proyecto de Supabase, DESPUES de la migracion
-- 20261008120000_avatar_path.sql. Es idempotente: se puede correr dos veces.
--
-- Cada persona solo ve, sube, cambia y borra lo que esta dentro de su carpeta
-- (`<su uuid>/...`). Nadie mas ve su foto: el bucket es privado y la app la
-- muestra con URLs firmadas de una hora.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', false, 1048576, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatares_select_propios" on storage.objects;
create policy "avatares_select_propios"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatares_insert_propios" on storage.objects;
create policy "avatares_insert_propios"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatares_update_propios" on storage.objects;
create policy "avatares_update_propios"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatares_delete_propios" on storage.objects;
create policy "avatares_delete_propios"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);
