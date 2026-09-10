# Latidos App

PWA del programa Latidos UCV (Next.js 14 App Router + TypeScript + Tailwind + Supabase).

Documentos de referencia: `constitution latidos-app`, `spec latidos-app - registro y
primer escaneo`, `plan latidos-app` y el archivo de tareas de la historia.

## Estado

Implementadas la **Fase 1 — Setup + Registro** (T001-T015) y la **Fase 2 —
Instalacion PWA** (T016-T022). Las fases 3 a 6 (onboarding, escaneo de QR,
canje de Beats, QA) todavia no estan construidas.

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
                                            /registro/cuenta-lista
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

## Estructura

```
src/
  app/
    page.tsx                    Entrada a la app (la bienvenida final es T018, Fase 2)
    registro/
      layout.tsx                Proveedor del estado en memoria del formulario
      paso-1..paso-6/           Los 6 pasos del registro
      confirma-tu-correo/       Espera de confirmacion (puente, se va en Fase 3)
      cuenta-lista/             Destino tras confirmar (puente, se va en Fase 3)
    auth/confirmar/             Destino del enlace del correo
    api/auth/registro/          POST que crea la cuenta
    sin-conexion/               Pantalla que sirve el service worker sin red
  components/instalacion/       Prompts de instalacion iOS y Android
  components/pwa/               Registro del service worker
  components/registro/          Progreso, campo de texto, guardia de paso
  hooks/use-plataforma.ts       Deteccion de iOS / Android / otro
  hooks/use-registro-form.ts    Estado del registro (solo en memoria)
  lib/supabase/                 Clientes de navegador, servidor y middleware
  lib/usuario/asegurar-perfil.ts Baja los datos del registro a la tabla usuarios
  lib/validacion/registro.ts    Validacion de sintaxis basica de los campos
  types/                        Usuario, TipoUsuario y tipado del esquema
public/                         manifest.json, service worker e iconos
supabase/migrations/            SQL del esquema
scripts/verificar-registro.mjs  V001 contra el Supabase real
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

Los iconos de `public/` son un marcador de posicion (linea de pulso amarilla
sobre el fondo oscuro de la paleta). Hay que reemplazarlos por el arte oficial
del branding cuando este disponible; el `manifest.json` no cambia.

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
- **La confirmacion de correo esta activada.** El contrato del plan §3 devuelve
  `{ usuario_id, sesion_token }`; con la confirmacion activa no hay sesion al
  terminar el paso 6, asi que `sesion_token` viaja en null y el cliente manda a
  la pantalla de espera. Si el proyecto tuviera la confirmacion apagada, el
  mismo endpoint devuelve el token y el perfil se escribe de una vez, sin
  cambiar la forma de la respuesta.
