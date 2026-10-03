#!/usr/bin/env node
/**
 * Imagenes de arranque de iOS (apple-touch-startup-image), constitution §2
 * v2.10.1.
 *
 * iOS, con la app instalada, ignora el splash del manifest: muestra la imagen
 * de arranque cuyo media query coincide con el dispositivo, y si no hay
 * ninguna, una pantalla en blanco. Este script dibuja la maqueta aprobada
 * (scripts/splash-fuentes/) para cada tamaño de iPhone: el fondo de marca en
 * SVG (crema + tres degradados) y el icono con esquinas redondeadas y sombra.
 *
 * Uso: npm run splash   (escribe public/splash/*.png; se commitean)
 *
 * La lista de tamaños vive en src/lib/splash.ts, que tambien usa layout.tsx
 * para los <link>: una sola fuente para las dos cosas.
 */

import { readFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const FUENTES = join(RAIZ, "scripts", "splash-fuentes");
const SALIDA = join(RAIZ, "public", "splash");

/** Lee la lista de src/lib/splash.ts sin compilar TypeScript. */
function tamanos() {
  const ts = readFileSync(join(RAIZ, "src", "lib", "splash.ts"), "utf8");
  return [...ts.matchAll(/\{\s*ancho:\s*(\d+),\s*alto:\s*(\d+),\s*escala:\s*(\d+)/g)].map(([, w, h, r]) => ({
    ancho: Number(w),
    alto: Number(h),
    escala: Number(r),
  }));
}

/**
 * Un gradiente radial de CSS (`radial-gradient(RX% RY% at CX% CY%, color, transparente FIN%)`)
 * en SVG: la elipse se arma escalando un circulo de radio 1.
 */
const radial = (id, w, h, { rx, ry, cx, cy, rgb, alfa, fin }) => `
    <radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1"
      gradientTransform="translate(${cx * w} ${cy * h}) scale(${rx * w} ${ry * h})">
      <stop offset="0" stop-color="rgb(${rgb})" stop-opacity="${alfa}"/>
      <stop offset="${fin}" stop-color="rgb(${rgb})" stop-opacity="0"/>
    </radialGradient>`;

/** La composicion entera, en px reales de la imagen. */
function svg({ ancho, alto, escala }, iconoBase64) {
  const W = ancho * escala;
  const H = alto * escala;
  const lado = 0.33 * W;
  const radio = 0.225 * lado;
  const x = (W - lado) / 2;
  // Flex centrado con margin-top: -1% del alto (como la referencia): el
  // centro queda 0.5% de H por encima de la mitad.
  const y = (H - lado) / 2 - 0.005 * H;
  const s = escala;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${radial("azulArriba", W, H, { rx: 0.8, ry: 0.5, cx: 1, cy: 0, rgb: "0,144,255", alfa: 0.18, fin: 0.7 })}${radial(
    "azulAbajo",
    W,
    H,
    { rx: 0.9, ry: 0.55, cx: 0, cy: 1, rgb: "0,144,255", alfa: 0.34, fin: 0.7 },
  )}${radial("amarillo", W, H, { rx: 1.2, ry: 0.7, cx: 0.5, cy: 0.5, rgb: "253,251,5", alfa: 0.3, fin: 0.62 })}
    <filter id="sombraGrande" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="${19 * s}"/>
    </filter>
    <filter id="sombraChica" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="${3 * s}"/>
    </filter>
    <clipPath id="esquinas">
      <rect x="${x}" y="${y}" width="${lado}" height="${lado}" rx="${radio}"/>
    </clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="rgb(255,255,245)"/>
  <rect width="${W}" height="${H}" fill="url(#azulArriba)"/>
  <rect width="${W}" height="${H}" fill="url(#azulAbajo)"/>
  <rect width="${W}" height="${H}" fill="url(#amarillo)"/>
  <rect x="${x}" y="${y + 16 * s}" width="${lado}" height="${lado}" rx="${radio}" fill="rgb(26,35,50)" fill-opacity="0.18" filter="url(#sombraGrande)"/>
  <rect x="${x}" y="${y + 2 * s}" width="${lado}" height="${lado}" rx="${radio}" fill="rgb(26,35,50)" fill-opacity="0.12" filter="url(#sombraChica)"/>
  <image x="${x}" y="${y}" width="${lado}" height="${lado}" clip-path="url(#esquinas)" preserveAspectRatio="none"
    href="data:image/png;base64,${iconoBase64}"/>
</svg>`;
}

async function main() {
  mkdirSync(SALIDA, { recursive: true });
  const icono = readFileSync(join(FUENTES, "icono.png")).toString("base64");
  for (const t of tamanos()) {
    const W = t.ancho * t.escala;
    const H = t.alto * t.escala;
    const { data } = await sharp(Buffer.from(svg(t, icono)))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const archivo = join(SALIDA, `splash-${W}x${H}.png`);
    // PNG de paleta (256 colores) con difuminado: los degradados no se ven en
    // escalones y el archivo pesa ~1/3 del de color completo (probado: ruido
    // sobre color completo llegaba a 2.7 MB; sin ruido, ~450 KB).
    await sharp(data, { raw: { width: W, height: H, channels: 3 } })
      .png({ palette: true, colours: 256, dither: 1, effort: 10, compressionLevel: 9 })
      .toFile(archivo);
    console.log(`${W} x ${H}  (${t.ancho}x${t.alto} @${t.escala})  ${Math.round(statSync(archivo).size / 1024)} KB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
