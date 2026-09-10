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
2. En **Authentication → Providers → Email**, deja *Confirm email* **apagado**.
   El registro de esta fase deja la sesion iniciada de inmediato al terminar el
   paso 6 (spec §9 regla 4); con la confirmacion activada no habria sesion con
   la cual escribir el perfil y el endpoint responde 500.

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
      listo/                    Confirmacion de cuenta creada (puente hasta el onboarding)
    api/auth/registro/          POST que crea la cuenta y el perfil
  components/registro/          Progreso, campo de texto, guardia de paso
  hooks/use-registro-form.ts    Estado del registro (solo en memoria)
  lib/supabase/                 Clientes de navegador, servidor y middleware
  lib/validacion/registro.ts    Validacion de sintaxis basica de los campos
  types/                        Usuario, TipoUsuario y tipado del esquema
supabase/migrations/            SQL del esquema
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
