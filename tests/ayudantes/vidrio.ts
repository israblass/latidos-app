import type { Locator } from "@playwright/test";

/**
 * Contraste del texto sobre el vidrio, calculado con los valores que el
 * navegador realmente aplica (las variables de la receta en globals.css).
 */

export type Rgb = [number, number, number];

const canal = (v: number) => {
  const n = v / 255;
  return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
};
export const luminancia = ([r, g, b]: Rgb) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
export function contraste(a: Rgb, b: Rgb) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** "rgba(255, 255, 255, 0.77)" o "#4a5160" a canales y alfa. */
export function aColor(valor: string): { rgb: Rgb; alfa: number } {
  const v = valor.trim();
  if (v.startsWith("#")) {
    const h = v.slice(1);
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb, alfa: 1 };
  }
  const n = (v.match(/[\d.]+/g) ?? []).map(Number);
  return { rgb: [n[0], n[1], n[2]], alfa: n.length > 3 ? n[3] : 1 };
}

/** `arriba` con su alfa compuesto sobre `abajo`. */
export const sobre = (arriba: { rgb: Rgb; alfa: number }, abajo: Rgb): Rgb =>
  arriba.rgb.map((c, i) => c * arriba.alfa + abajo[i] * (1 - arriba.alfa)) as Rgb;

/** Filtros saturate() y brightness() de CSS sobre un color (Filter Effects 1). */
export function filtrar([r, g, b]: Rgb, saturacion: number, brillo: number): Rgb {
  const s = saturacion;
  const m = [
    [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  ];
  return m.map((f) => Math.min(255, Math.max(0, (f[0] * r + f[1] * g + f[2] * b) * brillo))) as Rgb;
}

/** Las variables de la receta tal como las ve un elemento de vidrio. */
export async function recetaDe(elemento: Locator) {
  const v = await elemento.evaluate((el) => {
    const e = getComputedStyle(el);
    // El build puede reescribir los colores (rgba -> hsla): el navegador los
    // normaliza a rgb() si se le pide pintar uno.
    const prueba = document.createElement("span");
    document.body.append(prueba);
    const normalizar = (valor: string) => {
      prueba.style.color = valor.trim();
      return getComputedStyle(prueba).color;
    };
    const leer = (n: string) => (n === "--vidrio-filtro" ? e.getPropertyValue(n) : normalizar(e.getPropertyValue(n)));
    queueMicrotask(() => prueba.remove());
    return {
      arriba: leer("--vidrio-tinte-arriba"),
      abajo: leer("--vidrio-tinte-abajo"),
      filtro: leer("--vidrio-filtro"),
      texto: leer("--vidrio-texto-tenue"),
    };
  });
  const arriba = aColor(v.arriba);
  const abajo = aColor(v.abajo);
  const saturacion = Number(/saturate\(([\d.]+)%?\)/.exec(v.filtro)?.[1] ?? 100) / (v.filtro.includes("%") ? 100 : 1);
  const brillo = Number(/brightness\(([\d.]+)\)/.exec(v.filtro)?.[1] ?? 1);
  return {
    // El tramo mas translucido del degradado es el peor caso.
    tinte: arriba.alfa <= abajo.alfa ? arriba : abajo,
    saturacion,
    brillo,
    textoTenue: aColor(v.texto).rgb,
    filtro: v.filtro.trim(),
  };
}

export const NAVY: Rgb = [26, 35, 50];
export const NEGRO: Rgb = [0, 0, 0];
