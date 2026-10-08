# Latidos App: notas para Claude Code

Antes de cambiar diseño, copy o reglas de negocio, lee
`docs/constitution-app-latidos.md` y respétala.

## Política de pruebas

Detalle en `docs/pruebas.md`. Reglas:

1. Por defecto, tras cualquier cambio corre SOLO el nivel 0: `npm run test:rapido`.
2. Nivel 1 (`npm run test:e2e:area -- <specs del área tocada>`) solo si el
   cambio toca lógica de negocio, rutas, auth, base de datos o un flujo de
   usuario. Un cambio visual (CSS, textos, logos, ilustraciones, layout) NO
   necesita e2e.
3. Nivel 2 (`npm run test:completo`, build completo, `npm run capturas`) SOLO
   si el prompt trae `MODO: completo` o `CAPTURAS: sí`. Si no, no lo corras:
   lo corre GitHub Actions en el PR.
4. No levantes Postgres local si no vas a correr e2e que lo usen
   (`test:e2e:area` lo levanta solo si hace falta).
5. No ejecutes pruebas "por si acaso" ni repitas una corrida que ya pasó sin
   cambios nuevos en esa área.
6. Si algo falla, lee solo la parte que falla (últimas ~40 líneas o el nombre
   de la prueba), nunca el log completo. No adjuntes ni leas capturas de
   pantalla salvo que el prompt diga `CAPTURAS: sí`.
7. Reportes de entrega cortos: máximo ~8 líneas, sin recontar pasos.
8. `MODO: rápido` (o no decir nada) aplica estas reglas; `MODO: completo` las
   suspende para esa tarea.
