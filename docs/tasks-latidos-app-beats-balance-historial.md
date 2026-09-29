---
tipo: tasks
producto: Latidos App
slug: latidos-app
plan-origen: plan-latidos-app-beats-balance-historial.md
spec-origen: spec-latidos-app-beats-balance-historial.md
spec-complementaria: spec-latidos-app-registro-primer-escaneo.md (ajuste 2026-09-29)
pipeline: task-builder
tags: [tasks, latidos-app, beats, implementacion-pendiente]
relacionados:
  - "[[plan latidos-app - beats balance e historial]]"
  - "[[spec latidos-app - beats balance e historial]]"
  - "[[spec latidos-app - registro y primer escaneo]]"
  - "[[constitution latidos-app]]"
---

# Tareas de Implementacion: Latidos App - Beats: balance e historial

## Resumen

- **Total de tareas**: 52
- **Fases**: 6
- **Tareas paralelizables**: 29
- **Scope MVP**: Fases 1 a 3 (33 tareas). Incluye la Fase 3 para que el onboarding deje de decir "+5" al mismo tiempo que existe el bono de bienvenida.

## Convenciones

- `[ ]` = pendiente, `[X]` = completada.
- `[P]` = paralelizable: puede ejecutarse a la vez que otras [P] de la misma fase, una vez completadas las tareas secuenciales anteriores.
- `[US-N]` = vinculada a una historia de la spec:
  - **US-1** Acceso y saldo: spec §7 pasos 1 a 4, §8.12.
  - **US-2** Historial por dias: spec §7 pasos 5 a 9, §8.7, §8.8, §8.10.
  - **US-3** Como ganar y estado inicial: spec §7 paso 10, §8.1, y el criterio 12d de la spec de registro.
  - **US-4** Actualizacion en vivo: spec §7 paso 11, §8.5, §8.6.
  - **US-5** Sin conexion y errores: spec §8.2, §8.3, §8.4, §8.11.
- Cada tarea indica la ruta del archivo que se crea o modifica.
- Las migraciones siguen la convencion del repo: idempotentes, pegables en el editor SQL de Supabase mas de una vez, con comentarios en español que explican el porque.
- Los tests usan la infraestructura existente: Playwright, `tests/ayudantes/*` y el servidor mock en `tests/servidor-mock/`.

---

## Fase 1: Libro de movimientos, bono y carga retroactiva

Objetivo: toda variacion de Beats pasa por el libro, existe el bono de bienvenida, las cuentas actuales quedan migradas y cuadradas, e Inicio deja de tener estado en cero.
Depende de: ninguna

- [ ] T001 Crear la migracion del libro en `supabase/migrations/20260929120000_movimientos_beats.sql`. Incluye:
  - enum `tipo_movimiento_beats` (escaneo, bienvenida, ajuste, regalo, donacion, voluntariado, prediccion, canje);
  - tabla `movimientos_beats` con los campos del plan §2: id, usuario_id, tipo, beats, ocurrido_en, dia_local, marca_id, escaneo_id, created_at;
  - checks de beats distinto de cero y de coherencia entre tipo y referencias;
  - unicidad de escaneo_id y unicidad parcial de bienvenida por usuario;
  - indices (usuario_id, dia_local desc, ocurrido_en desc) y (usuario_id, tipo);
  - RLS con solo `select` propio y sin policies de escritura;
  - alta de la tabla en la publicacion de tiempo real.
- [ ] T002 En la misma migracion `supabase/migrations/20260929120000_movimientos_beats.sql`:
  - crear el disparador del libro, que al insertar marca la transaccion como "viene del libro", suma `beats` a `usuarios.beats_balance` y desmarca;
  - reemplazar la funcion `proteger_beats_balance` por el candado nuevo, que rechaza cualquier cambio de saldo sin esa marca, para todos los roles (plan §4, decisiones 2 y 3).
- [ ] T003 [P] Crear `supabase/migrations/20260929120100_borrado_restringido.sql`, que cambia a borrado restringido las FKs `escaneos.qr_marca_id` y `qr_marca.marca_id` (plan §4, decision 6).
- [ ] T004 [P] Crear `supabase/migrations/20260929120200_bono_bienvenida.sql`, que:
  - agrega `beats_bienvenida` (entero mayor que 0, por defecto 5) a `configuracion_app`;
  - crea el disparador que, al insertar en `usuarios`, inserta un movimiento de tipo bienvenida con el monto configurado (5 si no hay configuracion), de forma idempotente.
- [ ] T005 [P] Crear `supabase/migrations/20260929120300_canje_con_libro.sql`, que recrea `confirmar_canje_qr`:
  - conserva la firma, las revalidaciones y los motivos de error;
  - reemplaza el update directo del saldo por la insercion del escaneo seguida de un movimiento de tipo escaneo (marca_id, escaneo_id, ocurrido_en = confirmado_en, dia_local);
  - devuelve el saldo leido de `usuarios` despues del disparador.
- [ ] T006 [P] Crear `supabase/migrations/20260929120400_ajustes_latidos.sql` con la funcion `registrar_movimiento_latidos(usuario_id, tipo, beats)`:
  - solo acepta ajuste o regalo, rechaza beats = 0 y regalos negativos;
  - devuelve movimiento_id y saldo_resultante;
  - revoca la ejecucion a `anon` y `authenticated`;
  - lleva en la cabecera un comentario con el ejemplo de uso desde el editor SQL.
- [ ] T007 [P] Crear los scripts de verificacion:
  - `scripts/sql/reporte-saldos-previo.sql`: por usuario, saldo actual, saldo recalculado (escaneos + bienvenida) y diferencia;
  - `scripts/sql/reconciliacion-saldos.sql`: usuarios cuyo saldo no coincide con la suma de su libro; debe devolver vacio.
- [ ] T008 Crear `supabase/migrations/20260929120500_carga_retroactiva.sql`, idempotente, que:
  - genera un movimiento de tipo escaneo por cada escaneo existente, con su fecha y dia real;
  - inserta la bienvenida a cada usuario que no la tenga, con fecha de la migracion;
  - recalcula `beats_balance` desde el libro usando la marca de transaccion del disparador (plan §4, decision 4).
- [ ] T009 [P] Crear `scripts/sql/limpiar-datos-prueba.sql`, en una sola transaccion, que:
  - borra en orden los movimientos de escaneo, los escaneos, los QR y las marcas indicadas en una lista editable al inicio del archivo (o todo lo de prueba);
  - recalcula los saldos y conserva las bienvenidas;
  - termina ejecutando la reconciliacion.
- [ ] T010 Actualizar los datos de prueba:
  - `supabase/seed.sql`: `beats_bienvenida` en la fila de configuracion, sin borrados en cascada;
  - `tests/servidor-mock/supabase-shim.sql`: el enum, la tabla, los disparadores y las funciones nuevas, para que los tests corran contra el mock.
- [ ] T011 Regenerar los tipos:
  - `src/types/database.ts` con la tabla `movimientos_beats`, el enum y la columna nueva de configuracion;
  - crear `src/types/beats.ts` con los tipos de dominio TipoMovimiento, Movimiento, DiaHistorial, ResumenBeats y CacheBeats.
- [ ] T012 [P] Revisar `src/lib/qr/confirmar-canje-transaccion.ts` y `src/app/api/qr/confirmar-canje/route.ts` para que sigan leyendo `beats_balance_actualizado` del resultado de la funcion recreada, sin cambiar el contrato publico.
- [ ] T013 [P] Quitar de `src/app/inicio/page.tsx` la ilustracion `vacio-sin-beats` y el texto del caso cero, y dejar solo "Sigue participando para sumar mas." (spec de registro §9.16, criterio 12).
- [ ] T014 Escribir `tests/integracion/libro-movimientos.test.ts`, que cubre:
  - bienvenida unica al crear el perfil, incluso reintentando;
  - monto configurable;
  - candado del saldo frente a un update directo;
  - ajuste negativo que dejaria el saldo bajo cero, rechazado;
  - regalo positivo;
  - borrado restringido de marca y QR con escaneos;
  - reconciliacion vacia.

  Ademas, actualizar las expectativas de saldo inicial (0 a 5) en `tests/integracion/escaneo-exitoso.test.ts` y en `tests/integracion/criterios-aceptacion.test.ts`.
- [ ] T015 Aplicar en Supabase de produccion, en este orden:
  1. correr `scripts/sql/reporte-saldos-previo.sql` y guardar el resultado;
  2. aplicar las migraciones de T001 a T008 en orden;
  3. correr `scripts/sql/reconciliacion-saldos.sql`;
  4. desplegar la app en Vercel.

Verificacion:
- [ ] V001 El reporte previo lista cada cuenta con saldo actual, recalculado y diferencia antes de migrar.
- [ ] V002 Aplicar las migraciones dos veces seguidas no falla ni duplica datos.
- [ ] V003 Cada escaneo existente tiene su movimiento con fecha real y cada cuenta tiene exactamente una bienvenida.
- [ ] V004 La reconciliacion devuelve vacio.
- [ ] V005 Una cuenta nueva confirmada llega a Inicio con 5 Beats. Con `beats_bienvenida` = 10, la siguiente recibe 10.
- [ ] V006 Escanear y confirmar un QR crea el escaneo y su movimiento, y el saldo devuelto coincide con `usuarios`.
- [ ] V007 Editar `beats_balance` a mano desde el editor SQL se rechaza.
- [ ] V008 Un ajuste de -10 sobre 5 se rechaza sin crear nada, y un regalo de +20 aparece y sube el saldo.
- [ ] V009 Borrar una marca o QR con escaneos se rechaza. El script de limpieza si los borra y deja la reconciliacion vacia.
- [ ] V010 Inicio ya no muestra la ilustracion ni el texto del caso cero.

---

## Fase 2: Pantalla de Beats con historial

Objetivo: la persona entra a sus Beats y ve saldo, recordatorio e historial por dias.
Depende de: Fase 1

- [ ] T016 [US-2] Crear `supabase/migrations/20260929130000_lectura_beats.sql` con dos funciones que respetan RLS:
  - `resumen_beats()`: devuelve saldo, tiene_escaneos y onboarding_visto;
  - `historial_beats(antes_de, cantidad_dias)`: devuelve dias completos con total_neto, conteo solo de escaneos y movimientos (nombre y logo actuales de la marca via marca_id), mas hay_mas y siguiente_cursor, todo del mas reciente al mas antiguo (plan §3).

  Agregar ambas funciones a `tests/servidor-mock/supabase-shim.sql`.
- [ ] T017 [US-2] [P] Crear `src/lib/beats/consultas.ts` con `leerResumen`, `leerHistorial(antesDe?, cantidadDias = 7)` y `leerMarca(id)`, usando el cliente de navegador de `src/lib/supabase/client.ts` y los tipos de `src/types/beats.ts`.
- [ ] T018 [US-2] [P] Crear `src/lib/beats/formato.ts`, que reutiliza la zona de `src/lib/fecha/limite-diario.ts` y contiene:
  - etiqueta de dia: "HOY", "AYER" o dia de la semana y fecha sin año en mayusculas ("MIERCOLES 30 SEPT"), calculada en hora de Caracas sin importar la zona del telefono;
  - hora en formato de 12 h con am/pm;
  - Beats con signo;
  - conteo "N escaneo(s)";
  - nombre visible por tipo de movimiento ("Bienvenida a Latidos", "Ajuste Latidos", "Regalo Latidos" o el nombre de la marca).
- [ ] T019 [US-1] [P] Crear `src/hooks/use-guardia-beats.ts`, que:
  - sin sesion redirige a `/registro/confirma-tu-correo`;
  - con `onboarding_visto` falso redirige a `/onboarding/pantalla-1`;
  - valida con `leerResumen` cuando hay red;
  - deja un punto de extension para usar la cache sin red, que se completa en la Fase 5.
- [ ] T020 [US-1] Crear la ruta `src/app/beats/page.tsx` como pantalla de cliente y el componente `src/components/beats/pantalla-beats.tsx`, con:
  - titulo "BEATS" en tipografia display;
  - `ContadorBeats` de `src/components/marca/contador-beats.tsx` dentro de una card `vidrio-medio`, sin animacion de entrada;
  - la linea "Pronto podras cambiarlos por entradas al concierto, merch y cursos.";
  - un contenedor para el historial;
  - la `TabBar`.
- [ ] T021 [US-2] [P] Crear `src/components/beats/dia-historial.tsx`: linea de dia como boton de acordeon con `aria-expanded`, etiqueta, total neto y conteo (sin conteo si no hay escaneos), estado abierto y cerrado independiente por dia, y touch target de 48 px o mas.
- [ ] T022 [US-2] [P] Crear `src/components/beats/fila-movimiento.tsx`: fila no interactiva con el logo de la marca, un circulo con la inicial si no tiene logo, o el icono de Latidos (`public/icon-192.png`) en los tipos de Latidos; nombre visible, Beats con signo en color de texto normal y hora.
- [ ] T023 [US-2] Crear `src/hooks/use-historial-beats.ts` e integrarlo en `src/components/beats/pantalla-beats.tsx`:
  - carga inicial de resumen e historial de 7 dias;
  - dia mas reciente abierto;
  - al acercarse al final de la lista, carga el siguiente lote con `siguiente_cursor` hasta que `hay_mas` sea falso;
  - estados de carga y error expuestos para las Fases 4 y 5.
- [ ] T024 [US-1] [P] Encender el tab Beats en `src/components/navegacion/tab-bar.tsx` con `href: "/beats"`.
- [ ] T025 [US-1] [P] Convertir la card del contador en `src/app/inicio/page.tsx` en un enlace a `/beats`, accesible ("Ver mis Beats"), sin cambiar su aspecto.
- [ ] T026 Escribir `tests/integracion/beats-historial.test.ts`, que cubre:
  - acceso desde el tab y desde la card, y la pantalla de exito del escaneo sin enlace;
  - redirecciones del guardia;
  - contador sin animacion de entrada;
  - HOY abierto y AYER cerrado, etiquetas, totales y conteos;
  - dia solo con bienvenida;
  - varios dias abiertos y filas no tocables;
  - inicial sin logo, icono de Latidos y hora en Caracas con otra zona en el navegador;
  - QR desactivado y marca renombrada con los Beats originales;
  - paginacion de 20 dias.

Verificacion:
- [ ] V011 El tab Beats abre `/beats` y se ve activo en azul. La card de Inicio abre `/beats`.
- [ ] V012 Sin sesion o sin onboarding, las redirecciones coinciden con las de Inicio.
- [ ] V013 Con movimientos de hoy, ayer y hace 5 dias, las etiquetas, totales, conteos y aperturas son correctos.
- [ ] V014 Las filas de marcas sin logo, de QR desactivados y de marcas renombradas se muestran segun la spec.
- [ ] V015 Con 20 dias de historial se cargan 7, luego 7 mas al bajar, y al final no hay mas pedidos.

---

## Fase 3: Como ganar y estado inicial

Objetivo: la explicacion de como ganar vive en un solo lugar y se muestra donde corresponde.
Depende de: Fase 2

- [ ] T027 [US-3] Crear `src/lib/beats/contenido-como-ganar.ts` con las listas unicas:
  - formas de ganar: escanear QR de marcas, disponible, con "Cada marca da distinto"; donar, voluntariado y actividades como "Pronto";
  - en que los cambias: concierto, merch y cursos, todos "Pronto".

  Cada item lleva titulo, detalle, icono o ilustracion (assets existentes en `public/assets/iconos` y `public/assets/recompensas`) y estado disponible o pronto.
- [ ] T028 [US-3] [P] Crear el componente reutilizable `src/components/ui/hoja-inferior.tsx`: radio superior de 24 px, fondo claro, asa centrada, cierre al tocar fuera y al arrastrar hacia abajo, foco atrapado mientras esta abierta, devolucion del foco al disparador y `role="dialog"` con titulo.
- [ ] T029 [US-3] [P] Crear `src/components/beats/lista-como-ganar.tsx`, que renderiza el contenido de T027: items "Pronto" atenuados, sin interaccion, con etiqueta "Pronto" y contraste AA.
- [ ] T030 [US-3] Agregar a `src/components/beats/pantalla-beats.tsx` el boton ghost azul "¿Como gano Beats?" a la derecha del titulo, que abre la hoja de T028 con las secciones "Como los ganas" y "En que los cambias" de T029.
- [ ] T031 [US-3] Crear `src/components/beats/estado-inicial.tsx` e integrarlo en `src/components/beats/pantalla-beats.tsx`:
  - mientras `tiene_escaneos` sea falso, debajo del historial se muestran la lista de formas de ganar desplegada, la linea "Escanea tu primer QR para sumar." y el boton "Escanear" hacia `/escanear`;
  - desaparece en cuanto hay un escaneo.
- [ ] T032 [US-3] [P] Migrar `src/app/onboarding/pantalla-2/page.tsx` para que use el contenido de T027: sin montos fijos, con "Cada marca da distinto" y "Pronto" en lo no disponible. Mantener su estructura visual actual (bloques y titulos de seccion).
- [ ] T033 Escribir `tests/integracion/beats-como-ganar.test.ts`, que cubre:
  - estado inicial visible solo sin escaneos y oculto tras el primero;
  - "Escanear" abre el escaner;
  - apertura y cierre de la hoja, foco, "Pronto" no interactivo;
  - mismo contenido en la hoja y en el onboarding.

  Actualizar `tests/integracion/onboarding.test.ts` para que refleje el contenido nuevo de la pantalla 2.

Verificacion:
- [ ] V016 Una cuenta nueva sin escaneos ve la bienvenida, la explicacion desplegada, la linea guia y "Escanear".
- [ ] V017 Tras el primer canje, la explicacion desplegada ya no aparece.
- [ ] V018 La hoja se abre y se cierra correctamente, los "Pronto" no responden y cumplen AA.
- [ ] V019 La pantalla 2 del onboarding muestra exactamente el mismo contenido que la hoja.

---

## Fase 4: Actualizacion en vivo

Objetivo: la pantalla refleja cambios de saldo sin salir de ella.
Depende de: Fase 2

- [ ] T034 [US-4] Crear `src/hooks/use-movimientos-en-vivo.ts`: suscripcion al canal de tiempo real de inserciones en `movimientos_beats`, filtrada por el usuario de la sesion; alta al montar y baja al desmontar; tolerante a la caida del canal, sin mostrar errores.
- [ ] T035 [US-4] Integrar T034 en `src/hooks/use-historial-beats.ts`. Por cada evento:
  - resuelve la marca con `leerMarca` si no esta en memoria;
  - inserta la fila en su dia o crea el dia arriba y abierto;
  - relee el saldo con `leerResumen`;
  - actualiza `tiene_escaneos`.
- [ ] T036 [US-4] [P] Crear `src/components/beats/contador-beats-vivo.tsx`, que envuelve `ContadorBeats` y usa `ContadorAnimado` de `src/components/escaneo/contador-animado.tsx` solo cuando el saldo cambia con la pantalla abierta. Respeta `prefers-reduced-motion`. Reemplaza al contador en `src/components/beats/pantalla-beats.tsx`.
- [ ] T037 [US-4] [P] Crear `src/components/beats/anuncio-vivo.tsx`: region `aria-live="polite"` que anuncia "Sumaste N Beats" (o "Se descontaron N Beats" si el cambio es negativo) cuando el saldo cambia en vivo. Montarla en `src/components/beats/pantalla-beats.tsx`.
- [ ] T038 Escribir `tests/integracion/beats-en-vivo.test.ts`, que cubre:
  - un escaneo desde otra sesion del mismo usuario anima el contador, agrega la fila y anuncia el cambio;
  - un regalo por funcion interna produce el mismo resultado;
  - un dia nuevo se crea arriba y abierto;
  - reduced motion;
  - la caida del canal no muestra errores;
  - no llegan eventos de otros usuarios.

Verificacion:
- [ ] V020 Con `/beats` abierta, un escaneo o un regalo sube el numero y agrega la fila en el momento, con anuncio para lectores de pantalla.
- [ ] V021 Con `prefers-reduced-motion`, el numero cambia sin animacion.
- [ ] V022 Si se corta el canal, no hay error visible y al reentrar la pantalla esta al dia.
- [ ] V023 Los movimientos de otros usuarios no llegan a la sesion.

---

## Fase 5: Sin conexion y errores

Objetivo: la pantalla es util con mala señal o fallas.
Depende de: Fase 2

- [ ] T039 [US-5] Crear `src/lib/beats/cache.ts`: leer, escribir y borrar CacheBeats en almacenamiento local con clave por usuario (campos del plan §2), descartar la cache si el usuario no coincide con la sesion y borrar las claves de otros usuarios al abrir.
- [ ] T040 [US-5] Integrar la cache en `src/hooks/use-historial-beats.ts` y `src/hooks/use-guardia-beats.ts`:
  - la pantalla abre de inmediato con lo guardado y luego pide datos frescos;
  - escribe la cache tras cada carga exitosa y tras cada evento en vivo;
  - sin red, el guardia usa `onboarding_visto` de la cache y la sesion local, en vez de redirigir.
- [ ] T041 [US-5] [P] Crear `src/components/beats/aviso-estado.tsx`, con el toast de la constitution §2 (borde izquierdo de color semantico):
  - sin conexion: "Sin conexion. Asi estaban tus Beats a las [hora]", con "ayer, [hora]" o el dia si no fue hoy; desaparece y dispara la recarga al volver la red, usando `src/hooks/use-conexion.ts`;
  - con conexion y falla de carga: "No pudimos actualizar" con boton "Reintentar".
- [ ] T042 [US-5] [P] Crear `src/components/beats/sin-conexion-beats.tsx`: pantalla completa con `public/assets/estados-vacios/vacio-sin-conexion.webp` y el texto "Necesitas conexion para ver tus Beats por primera vez. Vuelve a intentarlo cuando tengas señal.", para cuando no hay red ni cache. Integrarla en `src/components/beats/pantalla-beats.tsx`.
- [ ] T043 [US-5] [P] Actualizar `public/sw.js` a v4: para la navegacion a `/beats`, red primero; en cada respuesta exitosa guardar una copia en el cache del shell; sin red, servir esa copia o, si no existe, `/sin-conexion`. Las demas rutas no cambian.
- [ ] T044 [US-5] [P] Crear `src/components/pwa/limpiar-cache-sesion.tsx`, que escucha el evento de cierre de sesion de Auth y borra CacheBeats. Montarlo en `src/app/layout.tsx` junto a `RegistrarServiceWorker`.
- [ ] T045 Escribir `tests/integracion/beats-sin-conexion.test.ts` con Playwright en modo offline, que cubre:
  - apertura con cache y aviso con hora, y variante "ayer";
  - recarga automatica al reconectar;
  - navegador limpio sin red;
  - falla simulada de `historial_beats` con "Reintentar";
  - cierre de sesion y otra cuenta en el mismo navegador;
  - el service worker v4 no rompe el registro ni el escaneo.

Verificacion:
- [ ] V024 En modo avion, `/beats` abre con lo ultimo guardado y el aviso con la hora correcta.
- [ ] V025 Al reconectar, se actualiza sola y el aviso desaparece.
- [ ] V026 En un navegador limpio y sin red aparece la pantalla completa de sin conexion.
- [ ] V027 La falla de carga con red muestra "No pudimos actualizar" y "Reintentar" funciona.
- [ ] V028 Otra cuenta en el mismo telefono nunca ve los Beats de la anterior.
- [ ] V029 El service worker v4 reemplaza al v3 sin romper la navegacion del registro ni del escaneo.

---

## Fase 6: Polish y QA

Objetivo: estabilizar, cubrir edge cases y verificar calidad antes de soltar a pruebas del equipo de Flame.
Depende de: Fases 1 a 5

- [ ] T046 [P] Escribir `tests/integracion/criterios-beats.test.ts`, que recorre los criterios 1 a 33 de la spec de Beats y los criterios 12 a 12d de la spec de registro, reutilizando los ayudantes de `tests/ayudantes/`.
- [ ] T047 [P] Escribir `tests/integracion/libro-concurrencia.test.ts`: dos confirmaciones simultaneas del mismo QR y usuario generan un solo escaneo y un solo movimiento; un ajuste negativo simultaneo con un canje nunca deja el saldo negativo ni desincronizado.
- [ ] T048 [P] Ampliar `tests/integracion/rls.test.ts`: un usuario no lee movimientos ajenos, no puede insertar, actualizar ni borrar en `movimientos_beats`, no puede cambiar su `beats_balance` y no puede ejecutar `registrar_movimiento_latidos`.
- [ ] T049 [P] Ampliar `tests/integracion/accesibilidad.test.ts` con la pantalla de Beats: acordeon navegable por teclado con `aria-expanded`, hoja con foco atrapado, region viva, contraste AA en filas y en items "Pronto", y touch targets de 48 px o mas.
- [ ] T050 [P] Ampliar `tests/integracion/rendimiento.test.ts`: `/beats` carga en menos de 3 s con 4G simulada y 60 dias de historial sembrado.
- [ ] T051 Revisar el copy de `src/components/beats/*`, `src/lib/beats/contenido-como-ganar.ts` y `src/app/onboarding/pantalla-2/page.tsx` contra la constitution §3: sin "Felicidades" ni "Increible", CTAs de maximo 2 palabras, estados que guian a la accion y tuteo.
- [ ] T052 Desplegar en Vercel, correr `scripts/sql/reconciliacion-saldos.sql` en produccion y hacer el recorrido completo en un telefono real: registro, bienvenida, Inicio, Beats, escaneo, fila en vivo, modo avion y reconexion.

Verificacion:
- [ ] V030 Todos los escenarios de la Guia de Validacion del plan pasan.
- [ ] V031 Los edge cases de §8 de la spec estan cubiertos por tests.
- [ ] V032 La reconciliacion devuelve vacio despues de toda la suite y en produccion.
- [ ] V033 El recorrido en telefono real contra produccion no muestra fallas.

---

## Grafo de Dependencias

```
Fase 1 (Libro, bono y carga retroactiva)
  |
  +---> Fase 2 (Pantalla de Beats con historial)
          |
          +---> Fase 3 (Como ganar y estado inicial)
          |
          +---> Fase 4 (Actualizacion en vivo)
          |
          +---> Fase 5 (Sin conexion y errores)
                  |
  Fases 3 + 4 + 5 +---> Fase 6 (Polish y QA)
```

Las Fases 3, 4 y 5 dependen solo de la Fase 2 y pueden hacerse en cualquier orden. Se recomienda 3, luego 4 y luego 5, porque la Fase 5 escribe la cache tambien desde los eventos en vivo.

## Ejecucion Paralela por Fase

| Fase | Secuenciales | Paralelas | Total |
|------|-------------|-----------|-------|
| 1    | 7           | 8         | 15    |
| 2    | 4           | 7         | 11    |
| 3    | 4           | 3         | 7     |
| 4    | 3           | 2         | 5     |
| 5    | 3           | 4         | 7     |
| 6    | 2           | 5         | 7     |
| **Total** | **23** | **29**   | **52** |

## Scope MVP

Para un primer deploy funcional que el equipo de Flame pueda probar, completar las Fases 1 a 3:
- 33 tareas.
- Entregable: toda cuenta arranca con 5 Beats de bienvenida; la persona entra a Beats desde el tab o desde Inicio, ve su saldo, su historial por dias con cada movimiento explicado y como ganar mas; el onboarding y la hoja dicen lo mismo; y saldo e historial cuadran siempre.
- Las Fases 4 (en vivo) y 5 (sin conexion) se suman antes de Empuje (18 de diciembre), cuando llegan el operador y los eventos con mala señal.
