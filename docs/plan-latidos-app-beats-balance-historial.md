---
tipo: plan
producto: Latidos App
slug: latidos-app
spec-origen: spec-latidos-app-beats-balance-historial.md
spec-complementaria: spec-latidos-app-registro-primer-escaneo.md (ajuste 2026-09-29)
pipeline: plan-builder
alimenta-a: task-builder
tags: [plan, latidos-app, beats, tasks-pendiente]
relacionados:
  - "[[spec latidos-app - beats balance e historial]]"
  - "[[spec latidos-app - registro y primer escaneo]]"
  - "[[tasks latidos-app - beats balance e historial]]"
  - "[[constitution latidos-app]]"
---

# Plan de Implementacion: Latidos App - Beats: balance e historial

## 1. Contexto Tecnico

- **Spec de origen**: `spec-latidos-app-beats-balance-historial.md`.
- **Spec complementaria**: ajuste del 2026-09-29 a `spec-latidos-app-registro-primer-escaneo.md`, que cubre el bono de bienvenida, Inicio sin estado en cero y la card del contador tocable, y el onboarding sin montos fijos y con "Pronto". Se construye en esta misma tanda.
- **Stack** (constitution §4, repo actual): Next.js 14 App Router como PWA, TypeScript, Tailwind con los tokens del design system, Supabase (PostgreSQL, Auth, Realtime) y deploy en Vercel. No se agregan dependencias.
- **Punto de partida en el repo**:
  - Tablas `usuarios` (con `beats_balance` y el guardia por rol), `marcas`, `qr_marca`, `escaneos` (con `dia_local` y un indice unico por dia) y `configuracion_app` (singleton).
  - Funcion transaccional `confirmar_canje_qr`.
  - `asegurarPerfil`, que crea la fila de `usuarios` al confirmar el correo.
  - Service worker con la navegacion en modo red primero y la pantalla `/sin-conexion` como respaldo.
  - Inicio renderizado en servidor.
  - Tab bar con Beats apagado.
  - Componentes `ContadorBeats` y `ContadorAnimado`, y helper de dia en Caracas en `lib/fecha/limite-diario.ts`.
- **Restricciones**:
  - Todas las transacciones de Beats se validan del lado del servidor.
  - El RLS aisla a cada usuario.
  - La app carga en menos de 3 s en 4G.
  - Contraste AA y touch targets de 48 px o mas.
  - Sin conexion se muestran datos guardados y mensajes claros (constitution §9).
  - Hoy todas las cuentas son de prueba (equipo de Flame y dev).

## 2. Modelo de Datos

### MovimientoBeats (nueva)

Libro unico de todo lo que suma o resta Beats. Es la fuente de verdad del historial y del saldo.

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| id | UUID | si | PK |
| usuario_id | ref | si | FK -> Usuario, se borra en cascada con la cuenta |
| tipo | enum | si | escaneo, bienvenida, ajuste, regalo, donacion, voluntariado, prediccion, canje |
| beats | numero entero | si | con signo, distinto de cero |
| ocurrido_en | timestamp | si | momento real del movimiento (en un escaneo, el `confirmado_en`) |
| dia_local | fecha | si | dia calendario en hora de Caracas, calculado con el mismo helper del limite diario |
| marca_id | ref | condicional | FK -> Marca, restringe el borrado. Obligatorio si tipo = escaneo; nulo en los tipos de Latidos |
| escaneo_id | ref | condicional | FK -> Escaneo, restringe el borrado, unico. Obligatorio si tipo = escaneo |
| created_at | timestamp | si | implicito |

- **Relaciones**:
  - Usuario 1---N MovimientoBeats.
  - Marca 1---N MovimientoBeats.
  - Escaneo 1---0..1 MovimientoBeats.
- **Validaciones**:
  - Coherencia entre tipo y referencias: escaneo lleva marca y escaneo; bienvenida, ajuste y regalo no llevan ninguna.
  - Una sola bienvenida por usuario (unicidad parcial sobre usuario_id donde tipo = bienvenida).
  - Inmutable: no hay policies de insert, update ni delete para usuarios de la app. Solo se inserta desde funciones del servidor. Solo el script de limpieza borra.
  - El saldo resultante nunca puede quedar negativo. Lo garantiza el check existente en Usuario, y un movimiento que lo violaria revierte la transaccion entera.
- **Indices**: (usuario_id, dia_local desc, ocurrido_en desc) para el historial, y (usuario_id, tipo) para saber si ya tiene escaneos y para la unicidad de la bienvenida.
- **Visibilidad**: cada usuario lee solo sus filas. La tabla se publica en el canal de tiempo real.

### Usuario (cambia)

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| beats_balance | numero entero | si | Pasa a ser una copia sincronizada: solo la actualiza el disparador del libro. Se mantiene el check de no negativo |

- **Validaciones**: cualquier cambio de `beats_balance` que no venga del disparador del libro se rechaza, sea cual sea el rol, incluido el editor SQL. Reemplaza al guardia actual, que solo bloquea a `authenticated` y `anon`.
- **Eventos**: al insertarse la fila (creacion del perfil, que ocurre al confirmar el correo) se otorga la bienvenida.

### ConfiguracionApp (cambia)

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| beats_bienvenida | numero entero | si | mayor que 0, por defecto 5. Lo cambia el admin; hoy, el equipo tecnico |

### Escaneo (cambia)

- La FK a QRMarca pasa de borrado en cascada a restringido.
- El resto no cambia: sigue sirviendo para el limite diario, el limite total y las metricas del dashboard de patrocinantes.

### QRMarca (cambia)

- La FK a Marca pasa de borrado en cascada a restringido.

### Marca (sin cambios)

- `nombre` y `logo_url` se leen siempre en su valor actual para pintar el historial. La lectura ya esta permitida a cualquier usuario autenticado, sin depender del estado del QR.

### CacheBeats (entidad local del dispositivo, no va en la base)

| Campo | Tipo | Notas |
|-------|------|-------|
| usuario_id | texto | clave del registro; si no coincide con la sesion, se descarta |
| saldo | numero | |
| tiene_escaneos | boolean | decide el estado inicial |
| onboarding_visto | boolean | permite aplicar el guardia sin red |
| dias | lista | los dias ya cargados, con sus movimientos, nombre y logo de marca |
| hay_mas | boolean | |
| siguiente_cursor | fecha | |
| actualizado_en | timestamp | alimenta el aviso "Asi estaban tus Beats a las..." |

- Se reescribe en cada carga exitosa.
- Se borra al cerrar sesion y cuando la app abre con un usuario distinto al guardado.

### Diagrama de relaciones

```
Usuario 1---N MovimientoBeats
Usuario 1---N Escaneo
Marca   1---N QRMarca          (borrado restringido)
QRMarca 1---N Escaneo          (borrado restringido)
Marca   1---N MovimientoBeats  (borrado restringido)
Escaneo 1---0..1 MovimientoBeats (borrado restringido)
ConfiguracionApp (singleton) --> monto de bienvenida
```

## 3. Contratos de Interfaz

### Registrar movimiento (evento interno de base de datos)
- **Tipo**: disparador al insertar en MovimientoBeats.
- **Entrada**: la fila nueva (usuario_id, beats).
- **Efecto**: marca la transaccion como "viene del libro", suma `beats` a `usuarios.beats_balance` y desmarca.
- **Errores**: si el saldo quedaria negativo, se revierte todo.
- **Regla**: spec §9.1, §9.2, §9.4.

### Confirmar canje de QR (existente, cambia por dentro)
- **Tipo**: POST `/api/qr/confirmar-canje`, que llama a la funcion transaccional `confirmar_canje_qr`.
- **Entrada**: `{ contenido }` (sin cambios).
- **Salida**: `{ beats_otorgados, beats_balance_actualizado, modo_evento_activo }` (sin cambios).
- **Cambio interno**: en vez de actualizar el saldo directamente, inserta el Escaneo y luego un MovimientoBeats de tipo escaneo, con marca_id, escaneo_id, ocurrido_en = confirmado_en y dia_local. El saldo devuelto se lee de Usuario despues del disparador.
- **Errores**: sin cambios (401 sesion invalida; 409 ya_escaneado_hoy, limite_alcanzado, qr_invalido).
- **Regla**: spec §9.2, §9.5.

### Otorgar bienvenida (evento interno de base de datos)
- **Tipo**: disparador al insertar en Usuario.
- **Entrada**: el id del nuevo usuario y `configuracion_app.beats_bienvenida`.
- **Efecto**: inserta un MovimientoBeats de tipo bienvenida con ocurrido_en = ahora. Si ya existe una bienvenida para ese usuario, no hace nada (idempotente).
- **Errores**: ninguno visible. Si no hay configuracion, usa 5.
- **Regla**: spec de registro §9.16.

### Registrar ajuste o regalo (funcion de base de datos, uso interno)
- **Tipo**: funcion ejecutable solo por el rol de servicio o el propietario de la base. Hoy la usa el equipo tecnico desde el editor SQL; mañana, el backoffice.
- **Entrada**: `{ usuario_id, tipo: ajuste | regalo, beats }`.
- **Salida**: `{ movimiento_id, saldo_resultante }`.
- **Errores**: tipo invalido; beats = 0; regalo con beats negativos; usuario inexistente; saldo resultante negativo (se rechaza y no se crea nada).
- **Regla**: spec §9.2, §9.4, §10.19, §10.24.

### Leer resumen de Beats
- **Tipo**: funcion de base de datos invocada por el cliente con la sesion del usuario (respeta RLS).
- **Entrada**: ninguna; el usuario sale de la sesion.
- **Salida**: `{ saldo, tiene_escaneos, onboarding_visto }`.
- **Errores**: 401 sin sesion.
- **Regla**: spec §8.1, §8.12.

### Leer historial por dias
- **Tipo**: funcion de base de datos invocada por el cliente con la sesion del usuario (respeta RLS).
- **Entrada**: `{ antes_de?: fecha, cantidad_dias?: numero (por defecto 7) }`.
- **Salida**: `{ dias: [{ dia_local, total_neto, escaneos, movimientos: [{ id, tipo, beats, ocurrido_en, marca: { nombre, logo_url } | null }] }], hay_mas, siguiente_cursor }`.
  - Los dias y los movimientos van del mas reciente al mas antiguo.
  - `escaneos` cuenta solo los de tipo escaneo.
  - La marca se resuelve por `marca_id` en su valor actual.
- **Errores**: 401 sin sesion.
- **Regla**: spec §9.7, §9.8, §10.2 a §10.4, §10.7.

### Suscripcion en vivo a movimientos
- **Tipo**: canal de tiempo real sobre inserciones en MovimientoBeats, filtrado por usuario_id de la sesion y protegido por RLS.
- **Entrada**: la sesion del usuario.
- **Salida por evento**: la fila insertada.
- **Efecto en el cliente**:
  - Si la marca no esta en memoria, la pide por id.
  - Relee el saldo.
  - Inserta la fila en su dia; si el dia no existe, lo crea arriba y abierto.
  - Anima el contador y anuncia el cambio en una region viva para lectores de pantalla.
  - Actualiza CacheBeats.
- **Errores**: si el canal se cae, no se muestra nada; la proxima entrada a la pantalla hace carga completa.
- **Regla**: spec §8.5, §8.6, §10.15, §10.25.

### Pantalla de Beats disponible sin conexion
- **Tipo**: comportamiento del service worker.
- **Navegacion a `/beats`**: red primero. Si responde, guarda una copia del HTML de la pantalla (no lleva datos del usuario). Sin red, sirve esa copia; si no hay copia, `/sin-conexion`.
- **Demas rutas**: sin cambios.
- **Regla**: spec §8.2, §8.3, §10.26.

### Reporte de reconciliacion (consulta de verificacion)
- **Tipo**: consulta de solo lectura para el equipo tecnico.
- **Salida**: usuarios cuyo `beats_balance` no coincide con la suma de sus movimientos. Debe devolver vacio.
- **Variante previa a la migracion**: lista de usuarios con saldo actual, saldo recalculado (escaneos + bienvenida) y diferencia.
- **Regla**: spec §9.1.

### Limpieza de datos de prueba (operacion manual)
- **Tipo**: script para el editor SQL, en una sola transaccion.
- **Entrada**: las marcas o QR marcados como de prueba, o "todo" antes del lanzamiento publico.
- **Efecto**:
  - Borra, en orden, los movimientos de escaneo, los escaneos, los QR y las marcas indicadas.
  - Recalcula los saldos desde el libro.
  - Conserva las bienvenidas.
  - Termina corriendo el reporte de reconciliacion.
- **Regla**: spec §9.6 (fuera del script, lo que tiene movimientos no se borra).

## 4. Decisiones Tecnicas

1. **Libro de movimientos como fuente unica del historial y del saldo**: una sola tabla sirve a todos los tipos presentes y futuros, y a una sola suscripcion en vivo.
   - Alternativa descartada: armar el historial uniendo escaneos con otras tablas. Cada tipo nuevo (donacion, canje) obligaria a tocar la consulta y el canal en vivo.
2. **Saldo guardado como copia sincronizada por disparador**: Inicio y el canje leen un campo, no una suma, y el check de no negativo sigue viviendo en Usuario.
   - Alternativa descartada: calcular la suma en cada lectura. Es mas lento y deja sin un lugar natural la regla de no negativo.
3. **Candado del saldo para todos los roles**: solo el disparador del libro, con una marca de transaccion, puede mover `beats_balance`. Tambien bloquea el editor SQL.
   - Alternativa descartada: el guardia actual por rol, que deja pasar ediciones manuales y rompe la regla saldo = historial.
4. **Carga retroactiva recalculando, con reporte previo**:
   - Se generan movimientos para todos los escaneos existentes, con su fecha real, y la bienvenida para cada cuenta, con fecha de la migracion.
   - El saldo se recalcula desde el libro.
   - Antes de aplicar, se corre el reporte con saldo actual, recalculado y diferencia.
   - Alternativa descartada: crear "Ajuste Latidos" por la diferencia. Solo preservaria numeros de prueba y ensuciaria esos historiales para siempre.
5. **Bono por disparador al crear el perfil**: cubre cualquier via de creacion (confirmacion activada o desactivada) y es idempotente.
   - Alternativa descartada: otorgarlo en la ruta `/auth/confirmar`. Se saltaria si el perfil se crea por otro camino.
6. **Borrado restringido en QR, marca y escaneo**: lo que tiene movimientos no se puede borrar por accidente. La limpieza de pruebas va por un script explicito.
   - Alternativa descartada: una bandera de borrado logico. Duplica lo que ya hace el estado activo/inactivo del QR.
7. **`marca_id` guardado en el movimiento**: el historial lee la marca directo, sin pasar por QRMarca, cuyas policies ocultan los QR inactivos y dejarian filas sin nombre.
   - Alternativa descartada: resolver la marca via el QR, que falla justo con los QR desactivados.
8. **`dia_local` guardado, calculado con el helper existente**: agrupar e indexar por dia es directo, y "hoy" coincide con el corte del limite diario.
   - Alternativa descartada: convertir la zona horaria en cada consulta, que no se puede indexar y duplica la regla de medianoche.
9. **Paginacion por dias con cursor de fecha**: cada lote trae dias completos y ningun acordeon queda cortado a la mitad.
   - Alternativa descartada: paginar por cantidad de filas, que parte los dias entre lotes.
10. **`/beats` como pantalla de cliente con copia en el service worker y datos en almacenamiento local por usuario**: es la unica forma de abrir con datos guardados sin señal.
    - Alternativa descartada: renderizar en servidor como Inicio, que sin red cae siempre en `/sin-conexion`.
11. **Guardia de sesion en el cliente para `/beats`**: aplica las mismas reglas que Inicio (sin perfil a `/registro/confirma-tu-correo`, sin onboarding a `/onboarding/pantalla-1`). Con red valida contra el servidor; sin red usa lo guardado para no expulsar a quien ya tenia sesion.
    - Alternativa descartada: guardia solo en servidor, incompatible con la decision 10.
12. **Tiempo real sobre inserciones del libro, con relectura del saldo**: una sola fuente de eventos da la fila y el saldo sale del valor autoritativo.
    - Alternativa descartada: suscribirse a cambios de Usuario, que da el saldo pero no la fila del historial.
13. **Contenido de "como ganar" y "en que los cambias" en un modulo unico**: lo usan el onboarding y la hoja, y asi no pueden divergir (spec §9.10).
    - Alternativa descartada: duplicar las listas en cada pantalla, que ya produjo la inconsistencia del "+5".
14. **Limpieza de CacheBeats al cerrar sesion y al detectar otro usuario**: hoy no existe un boton de cerrar sesion, asi que se engancha al evento de cierre de sesion de Auth y a la comparacion de usuario al abrir. Queda cubierto cuando Perfil lo agregue.
    - Alternativa descartada: limpiar solo desde un boton, que hoy no existe.

## 5. Fases de Construccion

### Fase 1: Libro de movimientos, bono y carga retroactiva
- **Objetivo**:
  - Toda variacion de Beats pasa por el libro.
  - Existe el bono de bienvenida.
  - Las cuentas actuales quedan migradas y cuadradas.
  - Inicio deja de tener estado en cero.
- **Entidades involucradas**: MovimientoBeats, Usuario, ConfiguracionApp, Escaneo, QRMarca, Marca.
- **Contratos involucrados**: Registrar movimiento, Confirmar canje de QR (cambio interno), Otorgar bienvenida, Registrar ajuste o regalo, Reporte de reconciliacion, Limpieza de datos de prueba.
- **Alcance**:
  - Migracion idempotente, pegable en el editor SQL como las anteriores: tipo enum, tabla, indices, RLS de solo lectura propia, publicacion en tiempo real, disparador del libro, candado del saldo, FKs restringidas, `beats_bienvenida`, disparador de bienvenida y ajuste de `confirmar_canje_qr`.
  - Script de reporte previo y script de carga retroactiva.
  - Script de limpieza de pruebas.
  - Actualizacion de `seed.sql`.
  - Inicio: se quitan la ilustracion y el texto del caso cero.
  - Tipos de TypeScript regenerados.
- **Depende de**: ninguna.
- **Entregable verificable**:
  - Una cuenta nueva llega a Inicio con 5 Beats.
  - Escanear sigue funcionando igual.
  - El reporte de reconciliacion devuelve vacio.

### Fase 2: Pantalla de Beats con historial
- **Objetivo**: la persona entra a sus Beats y ve saldo, recordatorio e historial por dias.
- **Entidades involucradas**: MovimientoBeats, Marca, Usuario.
- **Contratos involucrados**: Leer resumen de Beats, Leer historial por dias.
- **Alcance**:
  - Ruta `/beats` como pantalla de cliente con guardia de sesion.
  - Tab Beats encendido.
  - Card del contador de Inicio como enlace.
  - Titulo, contador (mismo componente que Inicio, sin animacion de entrada) y linea de recordatorio.
  - Acordeon por dias: etiquetas HOY, AYER o dia y fecha sin año, total neto y conteo de escaneos, el mas reciente abierto, varios abiertos a la vez.
  - Filas fijas con logo, inicial o icono de Latidos, nombre, Beats con signo y hora de 12 h en hora de Caracas.
  - Carga de 7 dias mas al llegar al final.
- **Depende de**: Fase 1.
- **Entregable verificable**: desde el tab o desde la card de Inicio se ve el historial completo y correcto de una cuenta con escaneos de varios dias.

### Fase 3: Como ganar y estado inicial
- **Objetivo**: la explicacion de como ganar vive en un solo lugar y se muestra donde corresponde.
- **Entidades involucradas**: ninguna nueva (contenido estatico).
- **Contratos involucrados**: Leer resumen de Beats (`tiene_escaneos`).
- **Alcance**:
  - Modulo unico de contenido.
  - Componente de hoja inferior (nuevo), con asa, cierre al tocar fuera o arrastrar, y foco atrapado.
  - Boton "¿Como gano Beats?".
  - Estado inicial: explicacion desplegada, linea guia y "Escanear" hacia `/escanear`, visible mientras `tiene_escaneos` sea falso.
  - Pantalla 2 del onboarding migrada al modulo unico: sin "+5", con "Cada marca da distinto" y "Pronto" atenuado y no interactivo.
- **Depende de**: Fase 2.
- **Entregable verificable**:
  - Una cuenta sin escaneos ve la explicacion desplegada, que desaparece tras el primer escaneo.
  - La hoja y el onboarding muestran el mismo contenido.

### Fase 4: Actualizacion en vivo
- **Objetivo**: la pantalla refleja cambios de saldo sin salir de ella.
- **Entidades involucradas**: MovimientoBeats, Marca.
- **Contratos involucrados**: Suscripcion en vivo a movimientos, Leer resumen de Beats.
- **Alcance**:
  - Suscripcion al montar la pantalla y baja al desmontar.
  - Insercion de la fila en su dia, o creacion del dia.
  - Animacion del contador con `ContadorAnimado` (respeta `prefers-reduced-motion`).
  - Region viva "Sumaste N Beats".
  - Relectura del saldo.
  - Tolerancia a la caida del canal.
- **Depende de**: Fase 2.
- **Entregable verificable**: con la pantalla abierta en un telefono, un ajuste o un escaneo registrado desde otro dispositivo sube el numero y agrega la fila en el momento.

### Fase 5: Sin conexion y errores
- **Objetivo**: la pantalla es util con mala señal o fallas.
- **Entidades involucradas**: CacheBeats.
- **Contratos involucrados**: Pantalla de Beats disponible sin conexion, Leer resumen de Beats, Leer historial por dias.
- **Alcance**:
  - Escritura y lectura de CacheBeats por usuario.
  - Apertura instantanea con lo guardado.
  - Toast "Sin conexion. Asi estaban tus Beats a las [hora]", con el dia si no fue hoy, que desaparece al volver la señal y recarga sola.
  - Toast "No pudimos actualizar" con "Reintentar".
  - Pantalla completa de sin conexion cuando no hay nada guardado.
  - Service worker v4 con red primero y copia para `/beats`.
  - Limpieza de CacheBeats al cerrar sesion y al detectar otro usuario.
- **Depende de**: Fase 2 (la Fase 4 no es requisito, pero conviene tenerla antes).
- **Entregable verificable**:
  - En modo avion, la pantalla abre con lo ultimo guardado y el aviso.
  - Al reconectar, se actualiza sola.
  - En un navegador limpio y sin red, aparece la pantalla de sin conexion.

### Fase 6: Polish y QA
- **Objetivo**: cerrar calidad antes de soltar a pruebas del equipo de Flame.
- **Alcance**:
  - Pruebas de integracion para los criterios 1 a 33 de la spec y los criterios 12 a 12d de la spec de registro.
  - Pruebas de concurrencia del libro: dos canjes simultaneos y un ajuste negativo contra un canje.
  - Pruebas de RLS: no se pueden leer movimientos ajenos ni escribir en el libro o el saldo desde el cliente.
  - Reconciliacion con datos sembrados.
  - Accesibilidad: acordeon con `aria-expanded`, hoja con foco atrapado, region viva, contraste AA en filas atenuadas y targets de 48 px.
  - Rendimiento: menos de 3 s en 4G simulada con 60 dias de historial.
  - Revision de copy contra la constitution §3.
- **Depende de**: Fases 1 a 5.
- **Entregable verificable**: suite en verde, reconciliacion vacia y recorrido completo probado en telefono real contra produccion.

## 6. Guia de Validacion

### Fase 1: Libro de movimientos, bono y carga retroactiva
- [ ] Correr el reporte previo: lista cada cuenta con saldo actual, recalculado y diferencia antes de migrar.
- [ ] Aplicar la migracion dos veces seguidas: la segunda no falla ni duplica nada.
- [ ] Carga retroactiva: cada escaneo existente tiene su movimiento con su fecha real y cada cuenta tiene exactamente una bienvenida.
- [ ] Reporte de reconciliacion: devuelve vacio.
- [ ] Crear y confirmar una cuenta nueva: recibe 5 Beats una sola vez; reintentar la creacion del perfil no duplica la bienvenida.
- [ ] Cambiar `beats_bienvenida` a 10 y crear otra cuenta: recibe 10.
- [ ] Escanear y confirmar un QR: se crean el escaneo y su movimiento, y el saldo devuelto coincide con Usuario.
- [ ] Editar `beats_balance` a mano desde el editor SQL: se rechaza.
- [ ] Registrar un ajuste de -10 en una cuenta con 5: se rechaza y no se crea nada. Registrar un regalo de +20: aparece el movimiento y el saldo sube.
- [ ] Intentar borrar una marca o QR con escaneos: se rechaza. El script de limpieza si los borra y deja la reconciliacion vacia.
- [ ] Inicio: con cualquier cuenta ya no aparecen la ilustracion ni el texto del caso cero.

### Fase 2: Pantalla de Beats con historial
- [ ] Tocar el tab Beats: abre `/beats` y el tab se ve activo en azul.
- [ ] Tocar la card del contador en Inicio: abre `/beats`.
- [ ] La pantalla de exito del escaneo sigue sin enlace a Beats.
- [ ] Sin sesion: redirige a `/registro/confirma-tu-correo`. Sin onboarding: redirige a `/onboarding/pantalla-1`.
- [ ] El contador se ve igual que en Inicio y no anima al entrar.
- [ ] Con movimientos hoy, ayer y hace 5 dias: HOY abierto, AYER cerrado y el tercero con dia y fecha sin año; totales y conteos correctos.
- [ ] Un dia con solo bienvenida muestra el total sin conteo.
- [ ] Se pueden abrir dos dias a la vez; tocar una fila no hace nada.
- [ ] Una marca sin logo muestra su inicial; la bienvenida muestra el icono de Latidos; la hora sale en formato de 12 h en hora de Caracas aunque el telefono tenga otra zona.
- [ ] Desactivar un QR, renombrar su marca y cambiar sus Beats: las filas viejas siguen visibles con el nombre nuevo y los Beats originales.
- [ ] Con 20 dias de historial: se cargan 7, al bajar 7 mas, y al final ya no se pide nada.

### Fase 3: Como ganar y estado inicial
- [ ] Una cuenta nueva sin escaneos ve la bienvenida, la explicacion desplegada, la linea guia y "Escanear".
- [ ] "Escanear" abre el escaner. Tras confirmar el primer canje y volver, la explicacion desplegada ya no esta.
- [ ] "¿Como gano Beats?" abre la hoja con las dos secciones. Los elementos "Pronto" estan atenuados, no responden al toque y cumplen contraste AA.
- [ ] La hoja se cierra al tocar fuera y al arrastrar; el foco vuelve al boton.
- [ ] La pantalla 2 del onboarding muestra exactamente el mismo contenido que la hoja.

### Fase 4: Actualizacion en vivo
- [ ] Con `/beats` abierta, confirmar un escaneo desde otra sesion del mismo usuario: el contador anima, aparece la fila y el lector de pantalla anuncia "Sumaste N Beats".
- [ ] Registrar un regalo desde el editor SQL con la pantalla abierta: mismo resultado.
- [ ] Un movimiento en un dia que no estaba en pantalla crea el dia arriba y abierto.
- [ ] Con `prefers-reduced-motion`, el numero cambia sin animacion.
- [ ] Cortar el canal (sin red breve): no aparece ningun error; al reentrar, la pantalla esta al dia.
- [ ] Un movimiento de otro usuario no llega a esta sesion.

### Fase 5: Sin conexion y errores
- [ ] Abrir `/beats` con red, pasar a modo avion y volver a abrir: aparece lo guardado con "Sin conexion. Asi estaban tus Beats a las [hora]".
- [ ] Si la ultima carga fue ayer, el aviso dice "ayer, [hora]".
- [ ] Al volver la red, se actualiza solo y el aviso desaparece.
- [ ] Navegador limpio y sin red: aparece la pantalla completa de sin conexion.
- [ ] Con red pero con la funcion de historial fallando (simulado): toast "No pudimos actualizar" y "Reintentar" funciona.
- [ ] Cerrar sesion y entrar con otra cuenta en el mismo telefono: no se ven los Beats de la anterior en ningun momento.
- [ ] El service worker v4 reemplaza al v3 sin romper la navegacion del registro ni del escaneo.

### Fase 6: Polish y QA
- [ ] Suite de integracion en verde con los criterios de ambas specs.
- [ ] Concurrencia: dos canjes simultaneos del mismo QR y usuario generan un solo escaneo y un solo movimiento; un ajuste negativo simultaneo con un canje nunca deja el saldo negativo.
- [ ] RLS: un usuario no lee movimientos ajenos ni puede insertar, actualizar o borrar en el libro ni cambiar su saldo.
- [ ] Reconciliacion vacia despues de toda la suite.
- [ ] Carga de `/beats` en menos de 3 s en 4G simulada con 60 dias de historial.
- [ ] Accesibilidad: navegacion por teclado y lector de pantalla del acordeon, la hoja y la region viva; targets de 48 px o mas.
- [ ] Copy revisado: sin "Felicidades" ni "Increible", CTAs de maximo 2 palabras y estados que guian a la accion.
- [ ] Recorrido completo en telefono real contra produccion: registro, bienvenida, Inicio, Beats, escaneo, fila en vivo, modo avion y reconexion.
