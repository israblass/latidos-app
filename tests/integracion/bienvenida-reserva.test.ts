import { expect, test, type Page } from "@playwright/test";

import { ALTO_WORDMARK, PANTALLAS, RESERVA_LOGO } from "../../src/components/bienvenida/pantallas";
import { reiniciarMock } from "../ayudantes/mock";

/**
 * Area de reserva del logo LATIDOS (constitution §2, v2.10.1).
 *
 * El rectangulo que envuelve el wordmark y su badge UCV (lo opaco del logo,
 * medido sobre su alfa) se agranda RESERVA_LOGO (0.5 x la altura del wordmark)
 * hacia los cuatro lados. Ninguna capa figurativa del arte (protagonista o
 * escena, con data-rol-arte) puede tocar ese rectangulo: se mide la caja de
 * cada capa, que es mas grande que su dibujo. Las texturas de fondo (anillos,
 * ECG ancho) no tienen rol y pueden pasar por detras.
 *
 * Ademas, los protagonistas que van sobre la etiqueta del titular terminan al
 * menos 8px por encima de ella.
 */
test.beforeEach(reiniciarMock);

type Caja = { top: number; bottom: number; left: number; right: number };

async function irA(page: Page, i: number) {
  await page
    .locator("[data-carrusel-bienvenida]")
    .evaluate((el, n) => el.scrollTo({ left: n * el.clientWidth, behavior: "instant" as ScrollBehavior }), i);
  await expect
    .poll(() => page.evaluate(() => document.querySelector("[data-punto][aria-current='true']")?.getAttribute("data-punto")))
    .toBe(String(i));
}

/** Logo (parte opaca), capas con rol y etiqueta de la pantalla i. */
function medir(page: Page, i: number) {
  return page.evaluate(async (n) => {
    const pantalla = document.querySelector(`[data-indice='${n}']`)!;
    const izquierda = pantalla.getBoundingClientRect().left;
    const caja = (r: DOMRect | Caja) => ({
      top: r.top,
      bottom: r.bottom,
      left: r.left - izquierda,
      right: r.right - izquierda,
    });
    // Lo opaco del logo: el wordmark y su badge, sin el margen del archivo.
    const logo = pantalla.querySelector<HTMLImageElement>("img[data-logo-bienvenida]")!;
    await logo.decode();
    const r = logo.getBoundingClientRect();
    const lienzo = document.createElement("canvas");
    lienzo.width = logo.naturalWidth;
    lienzo.height = logo.naturalHeight;
    const ctx = lienzo.getContext("2d")!;
    ctx.drawImage(logo, 0, 0);
    const d = ctx.getImageData(0, 0, lienzo.width, lienzo.height).data;
    let t = lienzo.height;
    let b = -1;
    let l = lienzo.width;
    let ri = -1;
    for (let y = 0; y < lienzo.height; y++) {
      for (let x = 0; x < lienzo.width; x++) {
        if (d[(y * lienzo.width + x) * 4 + 3] > 40) {
          t = Math.min(t, y);
          b = Math.max(b, y);
          l = Math.min(l, x);
          ri = Math.max(ri, x);
        }
      }
    }
    const ex = r.width / lienzo.width;
    const ey = r.height / lienzo.height;
    const opaco = { top: r.top + t * ey, bottom: r.top + (b + 1) * ey, left: r.left + l * ex, right: r.left + (ri + 1) * ex };
    const capas = Array.from(pantalla.querySelectorAll<HTMLImageElement>(".bienvenida-lienzo img[data-rol-arte]")).map((img) => ({
      src: img.getAttribute("src")!,
      rol: img.dataset.rolArte!,
      ...caja(img.getBoundingClientRect()),
    }));
    return {
      logo: caja(opaco),
      altoLogo: r.height,
      capas,
      etiqueta: caja(pantalla.querySelector(".bienvenida-eyebrow")!.getBoundingClientRect()),
    };
  }, i);
}

const seTocan = (a: Caja, b: Caja) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test("la reserva es la mitad del alto del wordmark (~20px)", { tag: "@rapido" }, () => {
  expect(ALTO_WORDMARK).toBeCloseTo(40.3, 1);
  expect(RESERVA_LOGO).toBeCloseTo(20.2, 1);
});

for (const [ancho, alto] of [
  [320, 568],
  [375, 667],
  [390, 844],
  [430, 932],
] as const) {
  test(`a ${ancho}x${alto} ninguna capa figurativa entra en la reserva del logo en las 4 laminas`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: alto });
    await page.goto("/");
    await expect(page.getByRole("button", { name: /^Registrarme\./ })).toBeVisible();
    for (let i = 0; i < PANTALLAS.length; i++) {
      await irA(page, i);
      const m = await medir(page, i);
      expect(m.altoLogo).toBeCloseTo(52, 1);
      const reserva = {
        top: m.logo.top - RESERVA_LOGO,
        bottom: m.logo.bottom + RESERVA_LOGO,
        left: m.logo.left - RESERVA_LOGO,
        right: m.logo.right + RESERVA_LOGO,
      };
      // Cada lamina tiene un protagonista; las que traen escenario, una escena.
      const esperadas = PANTALLAS[i].arte.filter((p) => p.rol).map((p) => p.ilustracion.src);
      expect(m.capas.map((c) => c.src)).toEqual(esperadas);
      expect(m.capas.filter((c) => c.rol === "protagonista")).toHaveLength(1);
      for (const capa of m.capas) {
        expect(seTocan(capa, reserva), `lamina ${i + 1}: ${capa.src} (arriba ${capa.top.toFixed(1)}, reserva hasta ${reserva.bottom.toFixed(1)})`).toBe(false);
      }
      // Los protagonistas que van sobre la etiqueta, 8px por encima.
      PANTALLAS[i].arte.forEach((pieza) => {
        if (!pieza.hastaEtiqueta) return;
        const capa = m.capas.find((c) => c.src === pieza.ilustracion.src)!;
        expect(m.etiqueta.top - capa.bottom, `lamina ${i + 1}: ${capa.src} sobre la etiqueta`).toBeGreaterThanOrEqual(8 - 0.5);
      });
    }
  });
}
