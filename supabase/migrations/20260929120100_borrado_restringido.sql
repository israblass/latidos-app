-- Latidos App - Beats, Fase 1 (T003)
-- Borrado restringido en QR y marcas.
-- Escrita para poder pegarse en el SQL Editor mas de una vez.

/*
 * Hasta ahora borrar una marca se llevaba en cascada sus QR, y borrar un QR se
 * llevaba sus escaneos. Con el libro eso ya no puede pasar: un escaneo borrado
 * dejaria Beats en el saldo sin su movimiento de origen, o un movimiento
 * apuntando a nada (spec §9 regla 6, plan §4 decision 6).
 *
 * Ahora lo que tiene historia no se borra: se desactiva. Para limpiar datos de
 * prueba existe scripts/sql/limpiar-datos-prueba.sql, que borra en orden y
 * recalcula los saldos.
 *
 * Se usa `restrict` y no el default (no action) porque aqui no hay ningun
 * borrado en cascada legitimo que tenga que pasar por encima: el error sale
 * en el acto, con el nombre de la FK que lo impide.
 */

alter table public.escaneos
  drop constraint if exists escaneos_qr_marca_id_fkey;
alter table public.escaneos
  add constraint escaneos_qr_marca_id_fkey
  foreign key (qr_marca_id) references public.qr_marca (id) on delete restrict;

alter table public.qr_marca
  drop constraint if exists qr_marca_marca_id_fkey;
alter table public.qr_marca
  add constraint qr_marca_marca_id_fkey
  foreign key (marca_id) references public.marcas (id) on delete restrict;
