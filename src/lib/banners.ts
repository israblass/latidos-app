/**
 * Banners "Aliado" del registro (constitution §2, v2.10.2).
 *
 * Cada pantalla que muestra un banner pide su slot por nombre. Hoy cada slot
 * apunta a un placeholder de public/banners (1200 x 600, WebP); cuando los
 * banners vengan del backoffice, solo cambia de donde sale este mapa: las
 * pantallas no se tocan.
 *
 * Van en los pasos 1, 3 y 4 y en "Revisa tu correo". No en los pasos 2, 5 y 6,
 * que tienen mas campos o la decision final.
 */
export type SlotBanner = "registro-paso-1" | "registro-paso-3" | "registro-paso-4" | "registro-revisa-correo";

export interface BannerAliado {
  /** Imagen 1200 x 600 (2:1), WebP. */
  src: string;
  ancho: number;
  alto: number;
  /** Texto alternativo: el nombre del aliado o lo que anuncia. */
  alt: string;
}

export const BANNERS: Record<SlotBanner, BannerAliado> = {
  "registro-paso-1": {
    src: "/banners/tu-marca-aqui-corazon.webp",
    ancho: 1200,
    alto: 600,
    alt: "Tu marca aquí: espacio para un aliado de Latidos",
  },
  "registro-paso-3": {
    src: "/banners/tu-marca-aqui-ecg.webp",
    ancho: 1200,
    alto: 600,
    alt: "Tu marca aquí: espacio para un aliado de Latidos",
  },
  "registro-paso-4": {
    src: "/banners/tu-marca-aqui-donaciones.webp",
    ancho: 1200,
    alto: 600,
    alt: "Tu marca aquí: espacio para un aliado de Latidos",
  },
  "registro-revisa-correo": {
    src: "/banners/tu-marca-aqui-corazon.webp",
    ancho: 1200,
    alto: 600,
    alt: "Tu marca aquí: espacio para un aliado de Latidos",
  },
};
