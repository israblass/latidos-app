-- Lo minimo de Supabase que las migraciones dan por hecho, para poder correr
-- las pruebas de base de datos contra un Postgres pelado.
--
-- No forma parte del esquema de produccion: en Supabase estas piezas ya
-- existen. Si esto se desincroniza de lo que Supabase provee, las pruebas de
-- RLS dejarian de ser representativas.

create schema if not exists auth;

create table if not exists auth.users (
  id    uuid primary key,
  email text
);

do $$ begin create role authenticated; exception when duplicate_object then null; end; $$;
do $$ begin create role anon;          exception when duplicate_object then null; end; $$;
do $$ begin create role service_role;  exception when duplicate_object then null; end; $$;

-- En Supabase auth.uid() lee el claim "sub" del JWT. Aqui se lee del ajuste de
-- sesion, que es como PostgREST lo inyecta.
create or replace function auth.uid() returns uuid language sql stable as
  $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;

-- Supabase concede acceso de tabla a anon y authenticated por defecto, y deja
-- que RLS sea lo unico que decide. Sin esto las pruebas fallarian por permisos
-- de tabla antes de llegar a evaluar una sola politica, y no probarian nada.
grant usage on schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- auth.users la crea el shim antes de este punto, asi que va explicita.
grant select on auth.users to anon, authenticated, service_role;
