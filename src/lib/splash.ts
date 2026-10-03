/**
 * Imagenes de arranque de iOS (constitution §2, v2.10.1).
 *
 * iOS, con la app instalada, no usa el splash del manifest: muestra la
 * `apple-touch-startup-image` cuyo media query coincide con el dispositivo y,
 * si ninguna coincide, una pantalla en blanco. Una por tamaño de iPhone, en
 * vertical. Los PNG los genera `npm run splash` (scripts/generar-splash.mjs),
 * que lee esta misma lista.
 */
export const TAMANOS_SPLASH = [
  { ancho: 440, alto: 956, escala: 3 }, // 16 Pro Max
  { ancho: 402, alto: 874, escala: 3 }, // 16 Pro
  { ancho: 430, alto: 932, escala: 3 }, // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  { ancho: 393, alto: 852, escala: 3 }, // 14 Pro, 15, 15 Pro, 16
  { ancho: 428, alto: 926, escala: 3 }, // 12 y 13 Pro Max, 14 Plus
  { ancho: 390, alto: 844, escala: 3 }, // 12, 13, 14
  { ancho: 375, alto: 812, escala: 3 }, // X, XS, 11 Pro
  { ancho: 360, alto: 780, escala: 3 }, // 12 y 13 mini
  { ancho: 414, alto: 896, escala: 3 }, // XS Max, 11 Pro Max
  { ancho: 414, alto: 896, escala: 2 }, // XR, 11
  { ancho: 414, alto: 736, escala: 3 }, // 6+, 7+, 8+
  { ancho: 375, alto: 667, escala: 2 }, // SE 2 y 3, 8
  { ancho: 320, alto: 568, escala: 2 }, // SE 1
  { ancho: 420, alto: 912, escala: 3 }, // Air
] as const;

export const IMAGENES_SPLASH = TAMANOS_SPLASH.map(({ ancho, alto, escala }) => ({
  url: `/splash/splash-${ancho * escala}x${alto * escala}.png`,
  media: `(device-width: ${ancho}px) and (device-height: ${alto}px) and (-webkit-device-pixel-ratio: ${escala}) and (orientation: portrait)`,
}));
