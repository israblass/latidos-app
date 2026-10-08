# Pruebas por niveles

Todo es Playwright (`tests/integracion`). Para no gastar tiempo ni uso de
Claude Code, las pruebas se corren por niveles. Las reglas para Claude Code
están en `CLAUDE.md`.

| Nivel | Comando | Qué corre | Cuándo |
|---|---|---|---|
| 0 | `npm run test:rapido` | Typecheck, lint y las pruebas con tag `@rapido`: reglas estáticas de diseño (`diseno.test.ts`) y funciones puras. Solo levanta el mock de Supabase: sin Next, sin navegador, sin Postgres. ~15 s. | Siempre, tras cualquier cambio. |
| 1 | `npm run test:e2e:area -- tests/integracion/<spec>.test.ts [...]` | Solo esos specs, en Chromium, sin reintentos, reporter `line`. Levanta mock + `next dev`, y Postgres solo si algún spec usa `tests/ayudantes/base-de-datos.ts`. | Cambios de lógica, rutas, auth, base de datos o flujos de usuario. No para cambios visuales. |
| 2 | `npm run test:completo` | `next build` (incluye typecheck y lint) + la suite entera contra el build de producción, con las pruebas de base de datos y la de rendimiento. Reporter `dot`: solo imprime el detalle de lo que falla. | Lo corre GitHub Actions en cada PR. En local, solo con `MODO: completo`. |
| — | `npm run capturas [-- bienvenida borde inicio beats pulido]` | Regenera las capturas de `docs/capturas-*` desde `tests/capturas/`. No es una prueba. | Solo con `CAPTURAS: sí`. |

Una prueba nueva que no abre navegador ni toca Postgres se marca con
`{ tag: "@rapido" }` para que entre al nivel 0.

**Postgres local (niveles 1 y 2):** se usa `DATABASE_URL` si está definida.
Si no, los scripts arrancan el cluster de `PG_PRUEBAS_DATOS` (por defecto
`/var/tmp/pgl`) en el puerto `PG_PRUEBAS_PUERTO` (55432). Sin Postgres, las
pruebas de base de datos se saltan solas con un aviso.

## `MODO: completo` y `CAPTURAS: sí`

Escríbelos en el prompt cuando quieras que Claude Code corra el nivel 2 o
regenere capturas en su sesión (por ejemplo, antes de una entrega grande o si
el CI no se puede usar). Sin esa línea, Claude Code solo corre el nivel 0 (y
el 1 si toca lógica).

## Si el CI falla

1. En el PR, abre el check **CI** que salió ❌ y el job que falló
   (**Nivel 0** o **Nivel 2**).
2. Copia solo el nombre de la prueba que falló (la línea `1) [movil] › ...`) y
   las últimas ~20 líneas del error. No pegues el log completo.
3. Pásaselo a Claude Code. Si hace falta la traza, el job deja el artifact
   `reporte-playwright` (solo cuando falla) con `playwright-report/` y
   `test-results/`.
