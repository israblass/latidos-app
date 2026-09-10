# Latidos App

PWA del programa Latidos UCV (Next.js 14 App Router + TypeScript + Tailwind + Supabase).

Documentos de referencia: `constitution latidos-app`, `spec latidos-app - registro y
primer escaneo`, `plan latidos-app` y el archivo de tareas de la historia.

## Estado

Implementada la **Fase 1 — Setup + Registro** (T001-T015). Las fases 2 a 6
(instalacion PWA, onboarding, escaneo de QR, canje de Beats, QA) todavia no
estan construidas.

## Requisitos

- Node.js 20 o superior
- Un proyecto de Supabase (la misma instancia que usa la web Latidos)

## Configuracion

```bash
npm install
cp .env.example .env.local   # completa la URL y la anon key de Supabase
npm run dev
```

En el proyecto de Supabase:

1. Aplica `supabase/migrations/20260910120000_usuarios.sql` (tabla `usuarios`,
   enum `tipo_usuario`, triggers y politicas RLS).
2. En **Authentication → Providers → Email**, deja *Confirm email* **encendido**.
3. En **Authentication → URL Configuration**, pon el *Site URL* del entorno
   (`http://localhost:3000` en local) y agrega `<site>/auth/confirmar` a las
   *Redirect URLs*.
4. En **Authentication → Emails → Confirm signup**, cambia el enlace de la
   plantilla para que apunte a la ruta propia con el hash del token:

   ```html
   <a href="{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=signup">
     Confirmar mi correo
   </a>
   ```

   La plantilla por defecto usa `{{ .ConfirmationURL }}`, que vuelve con un
   `code` de PKCE y solo funciona en el mismo navegador donde se hizo el
   registro. Con `{{ .TokenHash }}` la confirmacion funciona aunque la persona
   abra el correo desde otro telefono. `/auth/confirmar` acepta las dos formas,
   asi que la plantilla por defecto no rompe nada, pero limita el flujo.

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

Recorre V001 contra el Supabase configurado: contrato del plan §3, 409 por
correo repetido, 400 por formato invalido, confirmacion del correo, sesion
iniciada y perfil creado con 0 Beats. Con `SUPABASE_SERVICE_ROLE_KEY` en el
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
  components/registro/          Progreso, campo de texto, guardia de paso
  hooks/use-registro-form.ts    Estado del registro (solo en memoria)
  lib/supabase/                 Clientes de navegador, servidor y middleware
  lib/usuario/asegurar-perfil.ts Baja los datos del registro a la tabla usuarios
  lib/validacion/registro.ts    Validacion de sintaxis basica de los campos
  types/                        Usuario, TipoUsuario y tipado del esquema
supabase/migrations/            SQL del esquema
scripts/verificar-registro.mjs  V001 contra el Supabase real
```

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
