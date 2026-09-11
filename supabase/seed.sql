-- Latidos App - datos semilla de Fase 4 (T038)
--
-- Todavia no existe la pantalla de admin para generar QR, asi que estas marcas
-- y codigos se cargan a mano para poder probar el escaneo. Los ids estan
-- fijados: son lo que va dentro del QR, y tenerlos escritos permite generar la
-- imagen del codigo sin volver a consultar la base.
--
-- Correr en el SQL Editor de Supabase. Es idempotente: se puede repetir.

-- ---------------------------------------------------------------- Marcas ----

insert into public.marcas (id, nombre, logo_url) values
  ('a1000000-0000-4000-8000-000000000001', 'KFC', null),
  ('a1000000-0000-4000-8000-000000000002', 'Pepsi', null),
  ('a1000000-0000-4000-8000-000000000003', 'Movistar', null)
on conflict (id) do update
  set nombre = excluded.nombre,
      logo_url = excluded.logo_url;

-- ------------------------------------------------------------ QR de marca ---

insert into public.qr_marca
  (id, marca_id, beats_otorgados, limite_total_escaneos, escaneos_totales_contador, estado)
values
  -- Sin limite de usos: el caso normal para probar el camino feliz.
  ('b2000000-0000-4000-8000-000000000001',
   'a1000000-0000-4000-8000-000000000001', 10, null, 0, 'activo'),

  -- Limite bajo a proposito: con 3 canjes se agota y se puede probar el
  -- mensaje de "limite alcanzado" sin esperar a un evento real.
  ('b2000000-0000-4000-8000-000000000002',
   'a1000000-0000-4000-8000-000000000002', 5, 3, 0, 'activo'),

  -- Ya agotado desde el arranque: permite ver el mensaje de limite alcanzado
  -- de inmediato, sin gastar los 3 usos del anterior.
  ('b2000000-0000-4000-8000-000000000003',
   'a1000000-0000-4000-8000-000000000002', 5, 2, 2, 'activo'),

  -- Desactivado por el admin: se lee igual que uno inexistente.
  ('b2000000-0000-4000-8000-000000000004',
   'a1000000-0000-4000-8000-000000000003', 20, null, 0, 'inactivo')
on conflict (id) do update
  set marca_id = excluded.marca_id,
      beats_otorgados = excluded.beats_otorgados,
      limite_total_escaneos = excluded.limite_total_escaneos,
      escaneos_totales_contador = excluded.escaneos_totales_contador,
      estado = excluded.estado;
