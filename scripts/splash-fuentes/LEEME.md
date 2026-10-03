# Fuentes de la pantalla de carga (splash)

Maqueta aprobada por Isra (`referencia-splash-v2`): solo el icono de la app,
centrado, sobre el fondo de marca. Sin wordmark ni texto.

- `icono.png`: el icono de la app (igual a `public/icons/icon-master-1024.png`).
- `referencia-390x844@2x.png`: la aprobacion visual (390 x 844 px CSS).
- `referencia.html`: la misma composicion en HTML/CSS.

`scripts/generar-splash.mjs` (`npm run splash`) dibuja el fondo como SVG con
los tres degradados de la referencia y pone el icono encima, y escribe las
imagenes de arranque de iOS en `public/splash/`. Si cambia el icono o el fondo,
se cambia aqui y en el script, se regenera y se commitean los PNG.

Medidas (W = ancho del dispositivo, H = alto, en px CSS):
- Icono: 0.33 W, esquinas del 22.5% del lado, centrado en horizontal y con el
  centro 0.5% de H por encima de la mitad (lo mismo que `margin-top: -1%` con
  flex centrado, como la referencia).
- Sombra: `0 16px 38px rgba(26,35,50,.18), 0 2px 6px rgba(26,35,50,.12)`.
- Fondo: crema `#FFFFF5`; encima, azul tenue arriba a la derecha
  (`radial-gradient(80% 50% at 100% 0%, rgba(0,144,255,.18), transparente 70%)`),
  azul abajo a la izquierda (`radial-gradient(90% 55% at 0% 100%, rgba(0,144,255,.34), transparente 70%)`)
  y el resplandor amarillo al centro
  (`radial-gradient(120% 70% at 50% 50%, rgba(253,251,5,.30), transparente 62%)`).
