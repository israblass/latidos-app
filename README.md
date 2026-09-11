# Latidos App

PWA del programa Latidos UCV (Next.js 14 App Router + TypeScript + Tailwind + Supabase).

Documentos de referencia: `constitution latidos-app`, `spec latidos-app - registro y
primer escaneo`, `plan latidos-app` y el archivo de tareas de la historia.

## Estado

Implementadas la **Fase 1 — Setup + Registro** (T001-T015), la **Fase 2 —
Instalacion PWA** (T016-T022), la **Fase 3 — Onboarding + Inicio** (T023-T033),
la **Fase 4 — Escaneo y validacion de QR** (T034-T045) y la **Fase 5 — Canje y
otorgamiento de Beats** (T046-T058). Falta la Fase 6 (QA y pulido).

## Requisitos

- Node.js 20 o superior
- Un proyecto de Supabase (la misma instancia que usa la web Latidos)

## Configuracion

```bash
npm install
cp .env.example .env.local   # completa la URL y la anon key de Supabase
npm run dev
```

### Configuracion del proyecto de Supabase

Los cuatro pasos van por el panel. Ni la anon key ni la service-role key sirven
para esto: cambiar ajustes de Auth y plantillas de correo requiere la
Management API con un personal access token, y la migracion requiere acceso a
la base. Por el panel es mas rapido y no obliga a crear tokens nuevos.

**1. Aplicar la migracion**

Panel -> **SQL Editor** -> *New query*. Pega el contenido completo de
`supabase/migrations/20260910120000_usuarios.sql` y dale *Run*.

El archivo es idempotente: si lo corres dos veces no falla ni duplica nada.
Deberia terminar con `Success. No rows returned`. Para comprobarlo:

```sql
select tablename, policyname from pg_policies where tablename = 'usuarios';
```

Tienen que salir tres filas: `usuarios_select_propio`, `usuarios_insert_propio`
y `usuarios_update_propio`.

**2. Encender la confirmacion de correo**

Panel -> **Authentication** -> **Sign In / Providers** -> **Email**.
Enciende *Confirm email* y dale *Save*.

(En paneles mas viejos el mismo interruptor esta en *Authentication ->
Providers -> Email*.)

**3. Site URL y Redirect URLs**

Panel -> **Authentication** -> **URL Configuration**.

- *Site URL*: `http://localhost:3000` mientras se trabaja en local. Cuando haya
  deploy, el dominio real (`https://latidos.app`).
- *Redirect URLs* -> *Add URL*: agrega `http://localhost:3000/auth/confirmar`.
  Agrega tambien el del dominio real cuando exista.

Sin esa entrada, Supabase ignora el `emailRedirectTo` que manda la app y
devuelve al Site URL pelado, asi que la confirmacion no llega a la ruta.

**4. Plantilla del correo con TokenHash**

Panel -> **Authentication** -> **Emails** (o *Email Templates*) ->
pestaña **Confirm signup**. Reemplaza el enlace del cuerpo por:

```html
<a href="{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=signup">
  Confirmar mi correo
</a>
```

Dale *Save*.

Esto no es opcional. La plantilla por defecto usa `{{ .ConfirmationURL }}`, que
vuelve con un `code` de PKCE cuyo verificador vive en una cookie del navegador
donde se hizo el registro. Si la persona se registra en el telefono y abre el
correo en la laptop, la confirmacion falla. La spec (§9 regla 4 y criterio 7b)
pide explicitamente que se pueda confirmar desde otro dispositivo, y
`{{ .TokenHash }}` es lo que lo permite. `/auth/confirmar` acepta las dos
formas, asi que la plantilla por defecto no rompe el caso de un solo
dispositivo, pero incumple la spec.

## Flujo de registro

```
paso 1..6  ->  POST /api/auth/registro  ->  /registro/confirma-tu-correo
                (cuenta creada, sin sesion)          |
                                                 (enlace del correo)
                                                     v
                                            GET /auth/confirmar
                                     (verifica, crea la fila de usuarios)
                                                     v
                                     /onboarding/pantalla-1..3
                                  (Empezar o Saltar marcan onboarding_visto)
                                                     v
                                                 /inicio
```

Con la confirmacion de correo activada, al terminar el paso 6 la cuenta existe
pero todavia no hay sesion, asi que la fila de `usuarios` no se puede escribir
(RLS exige `auth.uid() = id`). Los 6 campos declarados viajan mientras tanto en
el `user_metadata` del usuario de Auth y bajan a la tabla en `/auth/confirmar`,
cuando ya hay sesion. Por eso **no hace falta la service-role key**: en ese
punto la escritura va firmada por el propio usuario.

## Verificacion

```bash
npm run dev                    # en una terminal
npm run verificar:registro     # en otra
```

Antes de empezar comprueba que *Confirm email* este encendido y que la tabla
`usuarios` exista, y para si falta alguna de las dos. Despues recorre V001
contra el Supabase configurado: contrato del plan §3, 409 por correo repetido,
400 por formato invalido, confirmacion del correo, sesion iniciada y perfil
creado con 0 Beats.

Las Redirect URLs y la plantilla del correo no se pueden comprobar por API; si
la confirmacion falla, revisa esos dos puntos primero.

**El correo de prueba.** Por defecto el script inventa una direccion con marca
de tiempo, que solo sirve si el correo de verdad sale del proveedor. Resend sin
dominio verificado unicamente entrega a la direccion con la que se abrio la
cuenta, asi que en ese caso hay que fijar la propia en `.env.local`:

```
CORREO_PRUEBA_QA=tu-correo@dominio.com
```

Un correo fijo solo sirve una vez: en la siguiente corrida esa cuenta ya existe
y el registro responde 409. El script lo detecta y avisa; borra el usuario en
**Authentication -> Users** antes de repetir.

**Si la confirmacion devuelve 404.** El enlace del correo apunta al *Site URL*
configurado en Supabase. Si ahi dice el dominio de produccion y todavia no hay
nada desplegado, el enlace no llega a esta app: ni en la verificacion ni para
las personas que se registren. El script reescribe el enlace al servidor local
para poder seguir, pero avisa cuando el origen no coincide. Cuando aparezca ese
aviso, corrige el *Site URL* en **Authentication -> URL Configuration**.

**Como llega el enlace de confirmacion.** El script lo consigue de tres formas,
en este orden: `SUPABASE_SERVICE_ROLE_KEY` en el entorno (lo pide por la API de
admin, sin abrir el buzon), `ENLACE_CONFIRMACION` con el enlace ya copiado (util
en CI), o preguntandolo por terminal para pegarlo a mano. Sin terminal
interactiva y sin ninguna de las dos variables, se detiene con un mensaje en vez
de quedarse esperando. Con `SUPABASE_SERVICE_ROLE_KEY` en el
entorno pide el enlace de confirmacion por la API de admin; sin ella, se
detiene y pide que se pegue el enlace que llego al buzon.

## Scripts

| Comando | Que hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run lint` | ESLint |

## Imagenes de marca

El arte oficial (logotipo, logos institucionales, lettering de cada fase) vive
en el Supabase Storage compartido con la web, bucket `imagenes-landing-ucv`, y
se consume por URL publica sin copiarlo al repo. Las URLs estan centralizadas en
`src/lib/assets.ts`, igual que en la web: un cambio de arte se refleja en ambos
productos sin tocar codigo.

Se renderizan con `ImagenMarca` (`src/components/marca/`), que usa `img` y no
`next/image` porque las piezas son remotas y no se conocen sus dimensiones —
`next/image` las exige para remotas, e inventarlas deformaria el arte. Fijando
solo el alto, cada pieza conserva su proporcion real. Si una imagen no carga,
el componente cae al texto del `alt`: se pierde el arte, nunca el contenido.

Los iconos de PWA (`public/icon-*.png`) NO salen de este bucket; se generan
aparte.

## Escaneo de QR

Al enfocar un codigo valido, la app lleva a la pantalla de confirmacion, que
dice de que marca es y cuantos Beats estan en juego. Los Beats **solo se
acreditan si la persona toca "Confirmar canje"**: cancelar no escribe nada y no
gasta cupo del QR.

El contenido del QR es el id del registro de `qr_marca`. Se aceptan dos formas:
el UUID pelado, o una URL de la app que lo lleve
(`https://<dominio>/escanear?qr=<uuid>`). La segunda existe porque la camara
nativa del telefono tambien la reconoce y abre la app directo. Los Beats nunca
van en el codigo: se resuelven en el servidor, para que el admin los pueda
cambiar sin reimprimir nada.

**El limite diario** corta a medianoche de `America/Caracas`, no a las 24 horas
del ultimo escaneo ni a la medianoche del proceso. En Vercel el servidor corre
en UTC, donde medianoche cae a las 8 de la noche en Venezuela: alguien que
escanea a las 9pm veria su limite reiniciado el mismo dia. La zona se puede
cambiar con la variable `ZONA_HORARIA`.

### QR de prueba

Mientras no exista la pantalla de admin, los codigos de prueba viven en
`supabase/seed.sql` con ids fijos. Para generar las imagenes:

```bash
npm run qr:prueba -- --url https://tu-dominio.vercel.app
```

Salen en `qr-prueba/` (PNG y SVG, ignorados por git). Sin `--url` el QR lleva el
id pelado, que solo sirve escaneando desde dentro de la app.

## Canje de Beats

Confirmar es la unica accion que escribe. Todo ocurre dentro de una funcion de
Postgres (`confirmar_canje_qr`, `security definer`) que en una sola transaccion
revalida el QR, reserva el cupo, crea el Escaneo y suma el balance. Si algo no
cuadra, no queda nada a medias.

**El cupo se reserva con un UPDATE condicional**, no leyendo y despues
escribiendo:

```sql
update public.qr_marca
   set escaneos_totales_contador = escaneos_totales_contador + 1
 where id = p_qr_marca_id
   and estado = 'activo'
   and (limite_total_escaneos is null
        or escaneos_totales_contador < limite_total_escaneos)
```

Postgres bloquea la fila durante el update, asi que dos personas que confirmen
el mismo QR en el mismo instante se serializan: la segunda ve el contador ya
movido, no cumple la condicion y recibe `limite_alcanzado`. Esta verificado
contra un Postgres real con dos conexiones sincronizadas al mismo instante de
arranque — pasa exactamente una.

**El limite de uno por dia por marca** lo sostiene un indice unico sobre
`(usuario_id, qr_marca_id, dia_local)`, no un `select` previo. La violacion del
indice aborta la transaccion completa, de modo que el contador del QR tampoco
queda movido.

**Los Beats se copian al Escaneo**, no se referencian (plan, Decision Tecnica
4). Si manana el admin sube ese QR de 10 a 50 Beats, quien canjeo ayer conserva
los 10 que gano: el historico no se reescribe solo.

**`modo_evento_activo`** vive en `configuracion_app` (una sola fila, forzada por
un unique) y solo cambia el cierre de la pantalla de exito: encendido invita a
seguir escaneando, apagado deja unicamente volver a Inicio. Viene apagado en el
seed.

## Design system

Base clara (constitution §2, v2.1.0): fondo blanco, cards con sombra suave y la
paleta de marca como acento. Los tokens viven en `tailwind.config.ts` y las
clases compartidas en `src/app/globals.css` (`.tarjeta`, `.boton-primario`,
`.bloque-oscuro`, `.bloque-amarillo`).

Dos reglas que hay que respetar al agregar pantallas:

- **El amarillo `#FDFB05` no se usa como color de texto sobre fondo claro.** Se
  queda muy por debajo del contraste AA. Cuando tiene que brillar, va como
  superficie (`.bloque-amarillo`, badges, botones primarios) o sobre una card
  oscura (`.bloque-oscuro`), que es como se resuelve el contador de Beats.
- **Los colores de marca y semanticos tienen variante de texto.** `#0090FF`,
  `#2EA043`, `#D29922` y `#F85149` se quedan en ~3.3:1 contra el blanco. Para
  texto se usan `secundario-texto`, `exito-texto`, `alerta-texto` y
  `error-texto`; los originales quedan para rellenos, bordes e iconos.

## Estructura

```
src/
  app/
    page.tsx                    Entrada a la app (la bienvenida final es T018, Fase 2)
    registro/
      layout.tsx                Proveedor del estado en memoria del formulario
      paso-1..paso-6/           Los 6 pasos del registro
      confirma-tu-correo/       Espera de confirmacion del correo
    auth/confirmar/             Destino del enlace del correo
    api/auth/registro/          POST que crea la cuenta
    api/usuario/                Onboarding visto y permiso de notificaciones
    api/qr/validar/             POST que valida un QR sin escribir nada
    api/qr/confirmar-canje/     POST que otorga los Beats (la unica escritura)
    escanear/                   Lector de QR con la camara
    escanear/confirmar/         Confirmar o cancelar el canje
    onboarding/pantalla-1..3/   Onboarding, una sola vez por cuenta
    inicio/                     Contador de Beats y barra de navegacion
    sin-conexion/               Pantalla que sirve el service worker sin red
  components/escaneo/           Lector, confirmacion, exito y mensajes de fallo
  components/instalacion/       Prompts de instalacion iOS y Android
  components/navegacion/        Barra inferior de 5 tabs
  components/onboarding/        Carrusel, bloques e iconos del onboarding
  components/pwa/               Registro del service worker
  components/registro/          Progreso, campo de texto, guardia de paso
  hooks/use-conexion.ts         Estado de red, para avisar antes de intentar
  hooks/use-permiso-notificaciones.ts  Permiso de avisos push
  hooks/use-plataforma.ts       Deteccion de iOS / Android / otro
  hooks/use-registro-form.ts    Estado del registro (solo en memoria)
  lib/fecha/limite-diario.ts    Medianoche de America/Caracas
  lib/qr/contenido.ts           Lee el id del QR (uuid pelado o URL)
  lib/qr/validar.ts             Validacion compartida por API y pantalla
  lib/qr/confirmar-canje-transaccion.ts  Llamada a la funcion de Postgres
  lib/supabase/                 Clientes de navegador, servidor y middleware
  lib/usuario/asegurar-perfil.ts Baja los datos del registro a la tabla usuarios
  lib/usuario/sesion.ts         Perfil de la sesion y guardias de pantalla
  lib/validacion/registro.ts    Validacion de sintaxis basica de los campos
  types/                        Usuario, QR, configuracion y tipado del esquema
public/                         manifest.json, service worker e iconos
supabase/migrations/            SQL del esquema
scripts/verificar-registro.mjs  V001 contra el Supabase real
scripts/generar-qr-prueba.mjs   Imagenes de los QR del seed
```

## Instalacion de la PWA

La app es instalable desde el navegador y funciona igual de completa sin
instalar. Los prompts de instalacion viven sobre la bienvenida y nunca bloquean
el registro (spec §9 regla 15):

- **iOS**: Safari no expone ninguna API de instalacion, asi que se muestra un
  modal con los pasos (Compartir -> Agregar a pantalla de inicio -> Agregar).
- **Android y escritorio**: se captura `beforeinstallprompt` y el boton dispara
  el dialogo nativo del sistema. Si el navegador no emite ese evento, no se
  pinta nada: no tiene sentido ofrecer instalar algo que no se va a instalar.
- Al cerrarlos, el descarte se recuerda una semana y queda un boton discreto
  "Instalar la app" siempre disponible (spec §10 suposicion 3).

El service worker solo intercepta lo que sabe manejar: navegaciones y archivos
estaticos sin parametros. Todo lo demas (escrituras, la API, los payloads RSC de
Next) pasa de largo sin que lo toque. Es una lista de permitidos y no de
prohibidos a proposito: con una lista de prohibidos, cualquier tipo de peticion
no previsto caia en la rama de cache y se rompia.

Los iconos de `public/` son un marcador de posicion (linea de pulso amarilla
sobre el fondo oscuro de la paleta). Hay que reemplazarlos por el arte oficial
del branding cuando este disponible; el `manifest.json` no cambia.

## Onboarding

Se muestra una sola vez por cuenta (spec §9 regla 5). Tanto "Empezar" como
"Saltar" llaman a `/api/usuario/onboarding-completado`, que marca
`onboarding_visto`; a partir de ahi cualquier intento de volver al onboarding,
incluso escribiendo la URL, cae en Inicio.

El permiso de notificaciones se pide en la tercera pantalla con un toque
explicito y no al cargar: Safari exige interaccion de la persona, y un permiso
pedido de golpe se deniega mas. Negarlo no bloquea nada. Sumar Beats al escanear
un QR NO dispara push; esa confirmacion ocurre solo en pantalla.

En la barra inferior solo Inicio esta activo. Pulso, Escanear, Beats y Perfil se
pintan apagados y sin enlace para que la barra ya tenga su forma definitiva sin
que ningun toque termine en un 404.

## Decisiones de esta fase

- **El registro no se guarda de forma parcial.** El estado vive solo en memoria
  (React context en el layout de `/registro`): recargar o cerrar la app devuelve
  al paso 1 con el formulario vacio. Es intencional (spec §9 regla 1).
- **Nada se valida contra un padron.** Cedula, correo y telefono son
  autodeclarados; solo se revisa sintaxis basica. La verificacion real (OTP)
  llega despues de la fase beta y no obliga a rehacer el formulario.
- **La cedula no lleva constraint `unique`.** Ver plan, Decision Tecnica 6.
- **`tipo_usuario` es un enum de Postgres** con exactamente `estudiante_ucv`,
  `egresado` y `externo`.
- **El balance de Beats no lo escribe el cliente.** Un trigger rechaza cualquier
  update de `beats_balance` que llegue con el rol `authenticated`.
- **El canje es atomico y el cupo se reserva con un UPDATE condicional**, no con
  un `select` seguido de un `insert`. Ver "Canje de Beats".
- **Cancelar no deja rastro.** No se crea Escaneo ni se toca el contador del QR
  (spec §5, flujo alternativo 5): nada se escribe hasta confirmar.
- **El trigger que protege `beats_balance` no es `security definer`.** Lo fue
  por un momento durante la Fase 5 y eso lo desactivaba por completo: con
  `security definer` el `current_user` que compara pasa a ser el dueno de la
  funcion y nunca el rol del cliente. Sin `security definer` el trigger corre
  con el rol de quien escribe, que es justo lo que hay que revisar.
- **La pantalla de exito no se refresca a si misma.** Tras confirmar, el QR pasa
  a estar "ya escaneado hoy"; un `router.refresh()` en esa ruta la renderiza de
  nuevo en el servidor y reemplaza el exito por el rechazo delante de la
  persona. El refresh va despues de navegar a Inicio, nunca antes.
- **La confirmacion de correo esta activada.** El contrato del plan §3 devuelve
  `{ usuario_id, sesion_token }`; con la confirmacion activa no hay sesion al
  terminar el paso 6, asi que `sesion_token` viaja en null y el cliente manda a
  la pantalla de espera. Si el proyecto tuviera la confirmacion apagada, el
  mismo endpoint devuelve el token y el perfil se escribe de una vez, sin
  cambiar la forma de la respuesta.
