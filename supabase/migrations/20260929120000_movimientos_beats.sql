-- Latidos App - Beats, Fase 1 (T001, T002)
-- Libro de movimientos de Beats y candado del saldo.
-- Escrita para poder pegarse en el SQL Editor mas de una vez.

-- ------------------------------------------------------ Tipo de movimiento ---

-- Incluye desde ya los tipos futuros (donacion, voluntariado, prediccion,
-- canje) para que la pantalla de Beats no cambie de estructura cuando lleguen
-- (spec §9 regla 16). Agregar un valor a un enum despues es facil; lo que se
-- busca es que el historial no tenga que aprender formas nuevas de fila.
do $$
begin
  create type public.tipo_movimiento_beats as enum (
    'escaneo', 'bienvenida', 'ajuste', 'regalo',
    'donacion', 'voluntariado', 'prediccion', 'canje'
  );
exception
  when duplicate_object then null;
end;
$$;

-- ------------------------------------------------------------- El libro -----

/*
 * Libro unico de todo lo que suma o resta Beats (plan §4, decision 1). Es la
 * fuente de verdad del historial y del saldo: `usuarios.beats_balance` pasa a
 * ser una copia que solo mueve el disparador de esta tabla.
 *
 * Las filas son inmutables para la app: no hay policies de escritura. Solo
 * insertan las funciones del servidor, y solo el script de limpieza borra.
 */
create table if not exists public.movimientos_beats (
  id uuid primary key default gen_random_uuid(),
  -- Si algun dia se borra la cuenta, su historial se va con ella.
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  tipo public.tipo_movimiento_beats not null,
  -- Con signo: los canjes y ajustes a la baja restan.
  beats integer not null,
  -- Momento real del movimiento. En un escaneo es su `confirmado_en`.
  ocurrido_en timestamptz not null default now(),
  -- Dia calendario en hora de Caracas, calculado con el mismo helper del
  -- limite diario para que "hoy" corte a la misma medianoche (decision 8).
  dia_local date not null,
  -- Se guarda la marca y no solo el QR: las policies de qr_marca ocultan los QR
  -- inactivos y el historial se quedaria sin nombre (decision 7).
  -- Sin `on delete`: el default (no action) ya impide borrar una marca o un
  -- escaneo con movimientos. No se usa `restrict` porque ese se evalua en el
  -- acto y romperia el borrado en cascada de una cuenta, que se lleva a la vez
  -- sus escaneos y sus movimientos en la misma sentencia.
  marca_id uuid references public.marcas (id),
  escaneo_id uuid references public.escaneos (id),
  created_at timestamptz not null default now(),

  constraint movimientos_beats_distinto_de_cero check (beats <> 0),

  -- Un escaneo siempre dice de que marca y de que escaneo viene. Los tipos de
  -- Latidos (bienvenida, ajuste, regalo) no llevan ninguna de las dos. Los
  -- tipos futuros quedan libres hasta que su propia fase fije sus reglas.
  constraint movimientos_beats_referencias_coherentes check (
    case tipo
      when 'escaneo' then marca_id is not null and escaneo_id is not null
      when 'bienvenida' then marca_id is null and escaneo_id is null
      when 'ajuste' then marca_id is null and escaneo_id is null
      when 'regalo' then marca_id is null and escaneo_id is null
      else true
    end
  ),

  -- Un escaneo genera un solo movimiento.
  constraint movimientos_beats_escaneo_unico unique (escaneo_id)
);

-- Una sola bienvenida por persona, garantizada por la base y no por el codigo
-- que la otorga: aunque el perfil se intente crear dos veces, no hay dos bonos.
create unique index if not exists movimientos_beats_una_bienvenida_idx
  on public.movimientos_beats (usuario_id)
  where tipo = 'bienvenida';

-- El historial se lee por persona, del dia mas reciente al mas antiguo.
create index if not exists movimientos_beats_historial_idx
  on public.movimientos_beats (usuario_id, dia_local desc, ocurrido_en desc);

-- Para saber rapido si la persona ya escaneo alguna vez (estado inicial).
create index if not exists movimientos_beats_usuario_tipo_idx
  on public.movimientos_beats (usuario_id, tipo);

-- Las FKs sin indice hacen lento cualquier intento de borrar la marca: Postgres
-- tiene que recorrer el libro entero para saber si esta en uso.
create index if not exists movimientos_beats_marca_idx
  on public.movimientos_beats (marca_id);

-- ------------------------------------------------------------------ RLS -----

alter table public.movimientos_beats enable row level security;

-- Cada persona lee solo lo suyo (spec §9 regla 9). No hay policies de insert,
-- update ni delete: el dispositivo nunca escribe en el libro (regla 3).
drop policy if exists "movimientos_beats_select_propio" on public.movimientos_beats;
create policy "movimientos_beats_select_propio"
  on public.movimientos_beats for select
  to authenticated
  using (auth.uid() = usuario_id);

-- --------------------------------------------------------- Tiempo real ------

-- La pantalla de Beats se suscribe a las inserciones del libro (plan §3). La
-- publicacion la crea Supabase; si no existe (un Postgres pelado) no se hace
-- nada, y si la tabla ya esta dentro tampoco.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'movimientos_beats'
     ) then
    alter publication supabase_realtime add table public.movimientos_beats;
  end if;
end;
$$;

-- ------------------------------------------------ Disparador del libro ------

/*
 * Cada movimiento nuevo se suma al saldo de su dueño (plan §3, "Registrar
 * movimiento"). Antes de tocar el saldo marca la transaccion como "viene del
 * libro", que es lo unico que el candado de abajo acepta, y despues la
 * desmarca para que nada mas en la misma transaccion se cuele detras.
 *
 * Si el saldo quedaria negativo, el check de `usuarios` hace fallar el update
 * y con el se revierte toda la transaccion, movimiento incluido (regla 4).
 *
 * No es security definer, igual que el candado: el rol que escribe en el libro
 * ya es siempre una funcion del servidor o el dueño de la base, porque el
 * cliente no tiene permiso de insertar aqui.
 */
create or replace function public.aplicar_movimiento_beats()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform set_config('latidos.desde_libro', 'si', true);

  update public.usuarios
     set beats_balance = beats_balance + new.beats
   where id = new.usuario_id;

  perform set_config('latidos.desde_libro', '', true);
  return new;
end;
$$;

drop trigger if exists movimientos_beats_aplicar on public.movimientos_beats;
create trigger movimientos_beats_aplicar
  after insert on public.movimientos_beats
  for each row
  execute function public.aplicar_movimiento_beats();

-- ------------------------------------------------ Candado del saldo ---------

/*
 * El saldo solo lo mueve el disparador del libro (plan §4, decisiones 2 y 3).
 *
 * La version anterior solo bloqueaba a `authenticated` y `anon`, asi que una
 * edicion a mano desde el editor SQL pasaba y rompia la regla saldo = historial
 * (spec §9 reglas 1 y 2). Ahora no mira el rol: sin la marca del libro, nadie
 * cambia el saldo. Para dar o quitar Beats a mano existe
 * `registrar_movimiento_latidos`, que deja el movimiento con su nombre.
 *
 * Tambien cubre el insert: un perfil nace con saldo 0 y la bienvenida llega
 * despues como movimiento. Sin esto el cliente podria crear su fila con el
 * saldo que quisiera, porque la policy de insert solo mira el id.
 *
 * La marca sola no basta: `set_config` lo puede llamar cualquier rol, asi que
 * una sesion `authenticated` o `anon` que la pusiera a mano se saltaria el
 * candado. Por eso la marca solo cuenta si quien escribe no es un rol de la
 * app. El disparador del libro nunca corre con esos roles: el cliente no puede
 * insertar en el libro, y todo lo que si inserta (canje, bienvenida, ajustes)
 * es security definer y corre como dueño de la base.
 *
 * Sigue sin ser security definer, por lo mismo que en la Fase 5 (ver el barrido
 * estructural de tests/integracion/rls.test.ts): si lo fuera, `current_user`
 * seria siempre el dueño y la comprobacion de arriba no serviria.
 */
create or replace function public.proteger_beats_balance()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('latidos.desde_libro', true), '') = 'si'
     and current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.beats_balance <> 0 then
      raise exception 'beats_balance solo cambia con un movimiento del libro (un perfil nuevo empieza en 0)';
    end if;
  elsif new.beats_balance is distinct from old.beats_balance then
    raise exception 'beats_balance solo cambia con un movimiento del libro; usa registrar_movimiento_latidos';
  end if;

  return new;
end;
$$;

drop trigger if exists usuarios_proteger_beats_balance on public.usuarios;
create trigger usuarios_proteger_beats_balance
  before insert or update on public.usuarios
  for each row
  execute function public.proteger_beats_balance();
