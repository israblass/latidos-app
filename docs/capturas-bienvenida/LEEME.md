# Capturas de la bienvenida y de la pantalla de carga

Hechas en Chromium (Playwright) contra `next start`; WebKit no esta disponible
en el entorno de pruebas. Las genera `tests/integracion/zz-capturas-*.test.ts`
(scripts locales, fuera del repo) con `SALIDA=<carpeta>`.

- `bienvenida-N-AxB.webp`: lamina N a ese tamaño.
- `borde-N-390x844-sin-zona.webp` / `-zona59.webp`: las 4 laminas sin zona
  segura y con una zona segura de arriba de 59px (iPhone 14 Pro en adelante),
  emulada con CDP (`Emulation.setSafeAreaInsetsOverride`).
  `borde-1-320x568-zona59.webp`: lo mismo a 320 x 568.
- `pie-AxB.webp` y `pie-logos-zoom.webp`: el pie con los logos de los aliados
  (Flame y UCV, en negro).
- `bienvenida-N-320x568.webp`: las 4 laminas a 320 x 568, con la reserva del
  logo (en pantallas bajas los protagonistas quedan mas chicos).
- `splash-overlay-AxB.webp`: el overlay de carga. Chromium no emula
  `display-mode: standalone`: se capturo sin JavaScript (antes de hidratar) y
  con esa media query reescrita a `all` en el HTML.

## Checklist para validar en el iPhone

1. [ ] Borrar la app y volver a añadirla desde Safari (Compartir > Añadir a
       pantalla de inicio). iOS guarda las imagenes de arranque al instalar:
       sin reinstalar NO se ven las nuevas.
2. [ ] Cerrar la app del todo y abrirla: aparece el icono centrado sobre el
       fondo crema, amarillo y azul, en lugar de blanco.
3. [ ] De la imagen de arranque al overlay no hay salto visible, y el overlay
       se desvanece al cargar.
4. [ ] Las 4 laminas, sin corte duro bajo la barra de estado; la hora y la
       bateria se leen.
5. [ ] Los 2 logos del pie (Flame y UCV, en negro) se leen en tu modelo.
7. [ ] En las 4 laminas hay aire alrededor del logo LATIDOS: ningun dibujo
       (corazon, parlante, estatua, vela, estadio, mural, vitral) lo toca.
6. [ ] En Safari, sin instalar, no aparece la pantalla de carga.
