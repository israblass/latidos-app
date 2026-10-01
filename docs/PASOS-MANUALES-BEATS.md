# Pasos manuales — Beats: balance e historial (Fases 2 a 6)

Rama de trabajo: `claude/beats-fases-2-6`. Parte del último commit de
`claude/beats-fase1-libro-movimientos`, así que **también contiene todo el
código de la Fase 1**.

Nada de esto se aplicó en Supabase de producción ni se desplegó en Vercel: esos
pasos quedan para ti y están en la sección 2.

---

## 1. Estado

### Tareas

| Fase | Tareas | Estado |
|------|--------|--------|
| 1. Libro de movimientos, bono y carga retroactiva | T001 a T015 | Hecha. Migraciones aplicadas y verificadas en producción. **Falta desplegar su código** (ver sección 2). |
| 2. Pantalla de Beats con historial | T016 a T026 | Hecha |
| 3. Cómo ganar y estado inicial | T027 a T033 | Hecha |
| 4. Actualización en vivo | T034 a T038 | Hecha |
| 5. Sin conexión y errores | T039 a T045 | Hecha |
| 6. Polish y QA | T046 a T051 | Hecha |
| 6. Deploy y recorrido en teléfono real | T052 | **No hecha, a propósito**: es tuya (secciones 2 y 3) |

Cada tarea quedó marcada `[X]` en `docs/tasks-latidos-app-beats-balance-historial.md`.
Las casillas de verificación (V011 a V033) no se marcaron: varias solo se
confirman en producción o en un teléfono real.

### Pruebas

Se corrió la suite completa al cerrar cada fase:

| Al cerrar | Resultado |
|-----------|-----------|
| Fase 2 | 159 pasan, 3 omitidas (rendimiento, que solo corre con `PROBAR_RENDIMIENTO=1`) |
| Fase 3 | Todas las de las Fases 1 a 3 pasan (170, 3 omitidas). En esa corrida se colaron por error las pruebas de la Fase 4, que todavía no estaban construidas; sus 7 fallos son de ese archivo y no cuentan para la Fase 3 |
| Fase 4 | 181 pasan, 3 omitidas |
| Fase 5 | 190 pasan, 3 omitidas |
| Final (Fase 6), **incluidas las de rendimiento** | **246 pasan, 0 fallan, 0 omitidas** |

Qué cubre la suite, por archivo nuevo:

- `lectura-beats.test.ts` (Postgres real): `resumen_beats` e `historial_beats` agrupan, paginan de a 7 días completos, muestran la marca en su valor actual y respetan la RLS.
- `beats-historial.test.ts`: acceso por tab y por card, guardia, acordeón, etiquetas, totales, filas, marca renombrada, hora de Caracas con el navegador en otra zona, paginación de 20 días.
- `beats-como-ganar.test.ts`: estado inicial, hoja (apertura, cierre al tocar fuera, con Cerrar, con Escape y arrastrando, foco atrapado), "Pronto" no interactivo, mismo contenido que el onboarding.
- `beats-en-vivo.test.ts`: escaneo desde otra sesión, regalo, ajuste que resta, día nuevo arriba y abierto, movimiento reducido, caída del canal, movimientos de otra cuenta.
- `beats-sin-conexion.test.ts`: copia sin red con el aviso y la hora, variante "ayer", recarga sola al volver la red, pantalla completa sin conexión, falla con "Reintentar", otra cuenta en el mismo navegador, service worker v4 con registro y escaneo.
- `criterios-beats.test.ts`: los criterios 1 a 33 de la spec de Beats y 12 a 12d de la de registro, uno por prueba.
- `libro-concurrencia.test.ts` (Postgres real): dos canjes simultáneos, ajuste contra canje, dos ajustes que juntos no caben.
- Ampliados: `rls.test.ts` (libro de movimientos), `accesibilidad.test.ts` (pantalla de Beats, hoja, avisos), `rendimiento.test.ts` (Beats con 60 días), `onboarding.test.ts` y `criterios-aceptacion.test.ts`.

---

## 2. Pasos en producción

Van en este orden. Todo lo de Supabase se hace en el panel, en **SQL Editor →
New query**: pegas el archivo completo y le das **Run**.

### Paso 1. Aplicar la única migración nueva

Archivo: `supabase/migrations/20260929130000_lectura_beats.sql`

1. Abre el archivo en GitHub, en la rama `claude/beats-fases-2-6`, y copia todo su contenido.
2. Pégalo en el SQL Editor y dale **Run**. Debe terminar con `Success. No rows returned`.
3. Se puede pegar más de una vez sin problema.

**Cómo verificarla.** Pega esto y dale Run:

```sql
select p.proname as funcion,
       has_function_privilege('authenticated', p.oid, 'execute') as app_con_sesion,
       has_function_privilege('anon', p.oid, 'execute') as app_sin_sesion
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('resumen_beats', 'historial_beats')
 order by 1;
```

Deben salir dos filas, `historial_beats` y `resumen_beats`, con
`app_con_sesion = true` y `app_sin_sesion = false`.

**Comprobación de tiempo real (importante para la Fase 4).** La migración de
la Fase 1 agrega la tabla del libro a la publicación de tiempo real solo si esa
publicación ya existía. Comprueba que quedó adentro:

```sql
select tablename from pg_publication_tables
 where pubname = 'supabase_realtime' and tablename = 'movimientos_beats';
```

- Si sale una fila con `movimientos_beats`, todo bien.
- Si sale vacío, ve a **Database → Publications**, entra en `supabase_realtime` y
  activa la tabla `movimientos_beats`. O pega:
  `alter publication supabase_realtime add table public.movimientos_beats;`

No hay más cambios en la base: las Fases 3 a 6 son solo de la app.

### Paso 2. Desplegar (Fase 1 y Fases 2 a 6 juntas)

El código de la Fase 1 sigue sin desplegar. Como `claude/beats-fases-2-6`
ya lo contiene, **basta con un solo despliegue, de esta rama, después del paso
1**. La pantalla de Beats llama a las funciones de la migración nueva: si
despliegas antes de aplicarla, la pantalla muestra "No pudimos actualizar".

Si prefieres desplegar la Fase 1 sola primero, el orden es:

1. Despliega `claude/beats-fase1-libro-movimientos`.
2. Comprueba Inicio con 5 Beats en una cuenta nueva.
3. Aplica el paso 1.
4. Despliega `claude/beats-fases-2-6`.

Cómo desplegar sin terminal (no pude ver tu configuración de Vercel, así que
asumo que despliega a producción la rama `claude/latidos-fase1-setup-registro-7merlz`):

1. En GitHub, abre un **Pull request** de `claude/beats-fases-2-6` hacia la rama de producción.
2. Revisa que no tenga conflictos y dale **Merge**.
3. Vercel despliega solo. En el panel de Vercel, **Deployments**: espera a que el último quede en **Ready**.

Si tu Vercel usa otra rama de producción, cambia el destino del pull request.

### Paso 3. Qué comprobar después del despliegue

1. En el SQL Editor corre `scripts/sql/reconciliacion-saldos.sql`. **Debe salir vacío.**
2. Abre la app en el teléfono. La primera vez carga el service worker nuevo (v4). Ciérrala por completo y ábrela otra vez para que tome el control.
3. Haz el recorrido de la sección 3.

---

## 3. Recorrido en teléfono real (T052 / V033)

Usa una cuenta de prueba nueva. Marca cada punto a medida que lo ves.

**Registro y bienvenida**

- [ ] Te registras y confirmas el correo desde el teléfono.
- [ ] En la pantalla 2 del onboarding, "Escanea QR de marcas" dice "Cada marca da distinto." y no muestra "+5". Donar, voluntariado, actividades, concierto, merch y cursos dicen **PRONTO** y no reaccionan al tocarlos.
- [ ] Llegas a Inicio con **5** en el contador. No aparece la ilustración de "sin Beats" ni el texto "Escanea un QR de marca para empezar a sumar".

**Entrar a Beats**

- [ ] En Inicio, tocas la card del número y abre **BEATS**.
- [ ] Vuelves y tocas el tab **Beats** (el rayo) en la barra: abre la misma pantalla y el tab queda en azul.
- [ ] Arriba ves el título BEATS y, a la derecha, "¿Cómo gano Beats?" en azul.
- [ ] El número aparece directo en 5, sin animarse al entrar. La card, la barra amarilla y el halo que late son iguales a los de Inicio.
- [ ] Debajo dice "Pronto podrás cambiarlos por entradas al concierto, merch y cursos."
- [ ] El historial muestra **HOY +5**, abierto, con la fila "Bienvenida a Latidos", el ícono de Latidos, "+5" y la hora en formato 12 h (por ejemplo "3:45 pm").
- [ ] Debajo del historial aparece "CÓMO LOS GANAS" desplegado, "Escanea tu primer QR para sumar." y el botón amarillo **Escanear**.
- [ ] La pantalla no se mueve de lado al deslizar el dedo horizontalmente.

**La hoja**

- [ ] Tocas "¿Cómo gano Beats?": sube una hoja blanca con un asa arriba, "Cómo los ganas" y "En qué los cambias". Es el mismo contenido del onboarding.
- [ ] Se cierra tocando fuera de ella, con "Cerrar" y arrastrándola hacia abajo.

**Primer escaneo**

- [ ] Tocas **Escanear** y se abre el escáner.
- [ ] Escaneas un QR de prueba y confirmas. La pantalla de éxito ("Sumaste 10 Beats de …") **no** tiene ningún enlace a Beats.
- [ ] Vuelves a Beats: HOY dice "+15 · 1 escaneo", aparece la fila de la marca (con su logo, o un círculo con su inicial) y ya no está la explicación desplegada.

**En vivo** (necesitas la computadora con el SQL Editor)

- [ ] Con la pantalla de Beats abierta en el teléfono, registra un regalo desde el SQL Editor (el SQL exacto está en la sección 4). En segundos el número sube con la animación del contador y aparece la fila "Regalo Latidos" arriba en HOY.

**Modo avión**

- [ ] Con la pantalla de Beats ya cargada una vez con señal, activa el modo avión y ciérrala por completo.
- [ ] Ábrela de nuevo: ves tus Beats y tu historial, con un aviso arriba de borde amarillo: "Sin conexión. Así estaban tus Beats a las [hora]." Los íconos se ven bien, no rotos.
- [ ] Quita el modo avión: en unos segundos el aviso desaparece y la pantalla se actualiza sola.

---

## 4. Cómo probar cada fase a mano

### Simular sin conexión

- **En el teléfono**: modo avión. Es la prueba que vale, porque incluye el service worker de verdad.
- **En Chrome de computadora**: F12 → pestaña **Application** → **Service workers** → marca **Offline**. La casilla "Offline" de la pestaña Network no siempre corta al service worker; la de Application sí.
- Para que haya copia, abre `/beats` con señal **dos veces** después de instalar la versión nueva. La primera instala el service worker y la segunda guarda la copia.

### Provocar un movimiento en vivo

Con la pantalla de Beats abierta, en el SQL Editor (cambia el correo):

```sql
-- Regalo de 20 Beats
select * from public.registrar_movimiento_latidos(
  (select id from public.usuarios where correo = 'tu-correo-de-prueba@ejemplo.com'),
  'regalo',
  20
);

-- Ajuste de -3 (el anuncio dirá "Se descontaron 3 Beats")
select * from public.registrar_movimiento_latidos(
  (select id from public.usuarios where correo = 'tu-correo-de-prueba@ejemplo.com'),
  'ajuste',
  -3
);
```

Devuelve `movimiento_id` y `saldo_resultante`. Estos movimientos quedan en el
historial de esa cuenta para siempre: úsalo con cuentas de prueba.

### Crear 20 o 60 días de historial (paginación y rendimiento)

Usa una **cuenta de prueba** y el QR de prueba de KFC. Crea escaneos en días
pasados y después pásalos al libro pegando de nuevo la carga retroactiva, que es
segura de repetir.

1. Pega esto con tu correo (cambia `19` por `59` para tener 60 días; el día de hoy lo pone la bienvenida):

```sql
insert into public.escaneos (usuario_id, qr_marca_id, beats_otorgados, confirmado_en, dia_local)
select u.id,
       'b2000000-0000-4000-8000-000000000001',
       10,
       now() - make_interval(days => g),
       public.dia_local_latidos(now() - make_interval(days => g))
  from public.usuarios u, generate_series(1, 19) as g
 where u.correo = 'tu-correo-de-prueba@ejemplo.com'
on conflict do nothing;
```

2. Pega completo `supabase/migrations/20260929120500_carga_retroactiva.sql` y dale Run.
3. Corre `scripts/sql/reconciliacion-saldos.sql`: debe salir vacío.
4. En la app: al entrar ves 7 días; al bajar se cargan 7 más, y así hasta el primero.

Para deshacerlo después en esa cuenta (borra solo esos escaneos de prueba y
recalcula el saldo como lo hace el script de limpieza):

```sql
begin;
create temp table borrar on commit drop as
  select e.id from public.escaneos e
    join public.usuarios u on u.id = e.usuario_id
   where u.correo = 'tu-correo-de-prueba@ejemplo.com'
     and e.qr_marca_id = 'b2000000-0000-4000-8000-000000000001'
     and e.dia_local < public.dia_local_latidos(now());
delete from public.movimientos_beats where escaneo_id in (select id from borrar);
delete from public.escaneos where id in (select id from borrar);
select set_config('latidos.desde_libro', 'si', true);
update public.usuarios u
   set beats_balance = coalesce((select sum(beats) from public.movimientos_beats m where m.usuario_id = u.id), 0)
 where u.correo = 'tu-correo-de-prueba@ejemplo.com';
commit;
```

Termina corriendo la reconciliación (debe salir vacía).

### Qué mirar en cada fase

- **Fase 2**: acceso por tab y por card; HOY abierto y los demás cerrados; varios días abiertos a la vez; horas en 12 h; una marca sin logo muestra su inicial. Si le cambias el nombre a una marca en la tabla `marcas`, las filas viejas muestran el nombre nuevo con los mismos Beats.
- **Fase 3**: una cuenta nueva ve la explicación desplegada, que desaparece con el primer escaneo; la hoja y el onboarding dicen lo mismo.
- **Fase 4**: con la pantalla abierta, un regalo o un escaneo desde otro teléfono con la misma cuenta aparece en el momento. Con "Reducir movimiento" activo en el teléfono, el número cambia sin animarse.
- **Fase 5**: modo avión con copia (aviso con la hora), sin copia (pantalla completa con la ilustración de sin conexión) y reconexión. "No pudimos actualizar" es difícil de provocar a mano en producción; está cubierto por las pruebas.

---

## 5. Decisiones tomadas que no estaban en el plan

**Datos y base**

1. Las funciones de lectura usan parámetros con prefijo `p_` (`p_antes_de`, `p_cantidad_dias`), como `confirmar_canje_qr`, y acotan el lote entre 1 y 31 días.
2. `resumen_beats` e `historial_beats` corren con los permisos de quien llama (no son `security definer`): la RLS sigue decidiendo qué se ve. Se revocan a `anon`.
3. El shim de pruebas (`tests/servidor-mock/supabase-shim.sql`) ahora concede `usage` sobre el esquema `auth`, como Supabase. Sin eso, una función SQL que llama a `auth.uid()` fallaba solo en las pruebas. No afecta a producción.

**Pantalla**

4. Los textos nuevos llevan tildes ("Cómo", "podrás", "Sin conexión"), como la spec. Los textos viejos de otras pantallas no se tocaron (ver sección 7).
5. La hoja tiene un título visible "¿Cómo gano Beats?" y un botón "Cerrar". El wireframe no los trae, pero sin el botón un lector de pantalla en el teléfono no tiene cómo cerrarla (Escape y arrastrar no le sirven).
6. La card del contador de Inicio se anuncia como "Ver mis Beats. Tienes N Beats", para no perder el número en el lector de pantalla.
7. La carga de días anteriores ocurre al llegar al final de la lista, sin margen de anticipación. Con margen, el segundo lote se pedía al abrir sin bajar, contra la spec ("al bajar"). Si la lista no llena la pantalla, se piden solos para que nunca quede historial inalcanzable.
8. La letra del círculo de una marca sin logo va en navy y no en azul: en azul quedaba en 4,48:1, bajo el AA.
9. Nombres provisionales para tipos futuros en el historial: "Donación", "Voluntariado", "Predicción", "Canje". Sus historias fijarán los definitivos.
10. El anuncio en vivo usa singular con 1: "Sumaste 1 Beat".
11. Aviso sin conexión: hoy "a las 3:40 pm", ayer "ayer, 9:10 pm", antes "el 28 sept, 9:10 pm".
12. Sin red no se piden días anteriores ni se abre el canal en vivo (spec §8.2): solo se muestra lo guardado.
13. La pantalla completa sin conexión conserva el título BEATS y la barra de tabs, como el wireframe.

**Onboarding**

14. La pantalla 2 del onboarding usa el mismo componente de lista que la hoja, para que el contenido sea literalmente el mismo. Se quitó la nota "Los Beats de cada acción pueden variar…" (queda cubierta por "Cada marca da distinto."). En merch, el detalle pasó a "Bolsos, gorras y más." (sin "También puedes donarlo", que no aplica mientras el canje no exista). Se borró `src/components/onboarding/bloque.tsx`, que quedó sin uso.

**Service worker y copia local**

15. La copia del HTML de `/beats` se guarda "limpia": solo el cuerpo y el `content-type`, sin ninguna otra cabecera (nada de cookies de sesión).
16. El service worker ahora también guarda las variantes de `next/image` (`/_next/image?…`). Sin eso, sin red se veían rotos los íconos de la barra y de las filas. La ilustración de sin conexión, que solo aparece sin red, se guarda junto con la copia de `/beats`.
17. La copia de datos vive en `localStorage` con la clave `latidos:beats:<id de usuario>`, con número de versión para descartar copias de un formato viejo.

**Arreglos fuera del plan**

18. **Halo del contador (Inicio y Beats)**: la animación de latido pisaba el centrado, así que el halo quedaba corrido a la derecha y hacía que la pantalla se pudiera desplazar de lado. Ahora el centrado y el latido van en capas separadas. Lo cubre una prueba.
19. **Criterio 13 (permiso de cámara)**: la prueba fallaba de vez en cuando porque revisaba la llamada a la cámara en cuanto aparecía el video, que se pinta antes de esa llamada. Ahora espera. Era una carrera en la prueba, no en la app.

**Pruebas**

20. El mock de Supabase ganó CORS (hasta ahora nadie leía Supabase desde el navegador), sus propias versiones de `resumen_beats` e `historial_beats`, y un Realtime propio (`tests/servidor-mock/tiempo-real.js`) que habla el protocolo de `realtime-js` sobre un WebSocket hecho a mano, sin dependencias nuevas.
21. `setOffline` de Playwright no corta las peticiones del service worker. Las pruebas sin red usan además `context.route` con la bandera experimental `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS` (en `playwright.config.ts`). Sin eso, las pruebas "sin red" recibían la página del servidor y no probaban las copias.

---

## 6. Riesgos y cosas que no se pudieron verificar aquí

Todo se probó contra un Postgres local con las migraciones reales y contra el
mock de Supabase. Lo siguiente solo se comprueba con Supabase, PostgREST y
teléfonos reales:

1. **Tiempo real en Supabase.** El mock habla el mismo protocolo, pero no puede demostrar:
   - que la tabla esté en la publicación (paso 1 de la sección 2);
   - que Supabase aplique la RLS a los eventos, entregando a cada quien solo sus filas;
   - que el canal se reconecte bien tras una caída larga o al renovar el token de sesión.
2. **PostgREST real.** No se probó una llamada HTTP de verdad. En particular, que un usuario sin sesión reciba el código que la pantalla trata como "sin sesión" (401, 42501 o PGRST301): si Supabase respondiera otro, la pantalla mostraría "No pudimos actualizar" en vez de redirigir a la bienvenida.
3. **Service worker v4 en teléfonos reales**, sobre todo Safari de iOS. Se probó en Chromium con la bandera experimental de Playwright. En iOS:
   - el service worker solo funciona bien con la app instalada o abierta en Safari;
   - Safari puede borrar el almacenamiento de un sitio que no se usa en varios días, y con él la copia sin conexión: la próxima vez sin red se vería la pantalla completa de sin conexión.
4. **Cierre de sesión.** La copia se borra al detectar el evento `SIGNED_OUT` de Auth, pero hoy no existe un botón de cerrar sesión, así que no hay cómo probarlo de punta a punta. Sí está probado lo otro: al entrar otra cuenta en el mismo navegador, la copia anterior se descarta y se borra.
5. **Rendimiento.** Los números (Beats con 60 días en ~1 s con 4G simulada) salen de esta máquina con el servidor local. En Vercel y en un teléfono de gama media pueden ser distintos.
6. **Zona horaria en SQL.** `dia_local_latidos` tiene fija `America/Caracas`. Si algún día cambia `ZONA_HORARIA` en Vercel, hay que cambiarla también en la base (ver sección 7).
7. **La bandera experimental de Playwright** podría desaparecer en una versión futura. Si pasa, las pruebas sin red de Beats lo van a delatar al fallar.

---

## 7. Sugerencias para la Fase 1 y cabos sueltos

No se editó ninguna migración de la Fase 1. Esto es lo que sugiero revisar:

1. **Comentario desactualizado** en `20260929120000_movimientos_beats.sql`: el bloque del candado dice "Ahora no mira el rol", y un párrafo más abajo explica que sí lo mira (la corrección del commit `a3ac89e`). El código está bien; solo el comentario se contradice. Si se quiere corregir, que sea en una migración nueva que recree la función con el comentario arreglado.
2. **Zona horaria en un solo lugar**: `dia_local_latidos` y `ZONA_HORARIA` de la app tienen que coincidir a mano. Se podría guardar la zona en `configuracion_app` y leerla en la función.
3. **`dia_local_latidos` ejecutable por `anon`**: es inofensiva (solo convierte una fecha), pero si se quiere la superficie mínima se puede revocar en una migración nueva. La prueba de superficie RPC (`rls.test.ts`) tendría que actualizarse a la par.
4. **Copy de Inicio**: corregido en la tarea de banners ("Sigue participando para sumar más.").
5. **Constitution**: sigue diciendo `#6B7280` para el texto secundario, mientras la app usa `#565E6D` por contraste (anotado en el README desde antes).

---

## 8. Banners de Inicio, refresco y cierre de sesión local

1. **Migración `20261001120000_banners.sql`**: crea `public.banners` (RLS, solo lectura para `authenticated`) y siembra los tres banners "Tu marca aquí". No se aplicó en ninguna base: hay que pegarla una sola vez en el SQL Editor de producción. No es idempotente (sin `if not exists`): correrla dos veces falla en el `create table`, y eso evita duplicar la semilla.
2. **Imágenes**: los banners se sirven desde `public/banners/` y las ilustraciones desde `public/ilustraciones/` (generadas desde `recursos/ilustraciones/hd/`, que no se publica). Para cambiar un banner basta con editar su fila (`imagen_url`, `enlace_url`, `orden`, `activo`).
3. **Service worker v5**: precachea la ilustración de sin conexión y error. Al publicar, los teléfonos cambian de versión solos y borran la caché v4.
4. **Cerrar sesión** ahora usa `scope: "local"`: cierra solo el dispositivo donde se toca. No hace falta cambiar nada en Supabase.
