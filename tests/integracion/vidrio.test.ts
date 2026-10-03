import { expect, test, type Locator, type Page } from "@playwright/test";

import { abrirBeats, cuentaConId } from "../ayudantes/beats";
import { completarRegistro, confirmarCorreo } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";
import { NAVY, NEGRO, contraste, recetaDe, sobre } from "../ayudantes/vidrio";

/**
 * El vidrio se aplica y se nota (constitution §2, v2.5.0).
 *
 * Corre en el proyecto "movil" (Chromium) y, con PROBAR_WEBKIT=1, tambien en
 * "webkit" (playwright.config.ts): Safari es el navegador donde el vidrio
 * tiene que verse en los iPhone.
 */
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(reiniciarMock);

const barra = (page: Page) => page.getByRole("navigation", { name: "Principal" });

/** El backdrop-filter que el navegador calcula, con o sin prefijo. */
const filtroDe = (l: Locator) =>
  l.evaluate((el) => {
    const e = getComputedStyle(el);
    return e.backdropFilter || e.getPropertyValue("-webkit-backdrop-filter") || "none";
  });

/**
 * El filtro hace algo de verdad: la superficie se ve distinta con y sin el.
 * Si un ancestro lo anulara (raiz del backdrop), las dos capturas serian
 * identicas. Es lo que pasaba en la bienvenida y el onboarding.
 */
async function desenfocaDeVerdad(page: Page, l: Locator) {
  const caja = (await l.boundingBox())!;
  const clip = {
    x: Math.max(0, caja.x),
    y: Math.max(0, caja.y),
    width: Math.min(caja.width, 390 - Math.max(0, caja.x)),
    height: Math.min(caja.height, 844 - Math.max(0, caja.y)),
  };
  const con = await page.screenshot({ clip });
  await l.evaluate((el: HTMLElement) => {
    el.style.setProperty("backdrop-filter", "none", "important");
    el.style.setProperty("-webkit-backdrop-filter", "none", "important");
  });
  const sin = await page.screenshot({ clip });
  await l.evaluate((el: HTMLElement) => {
    el.style.removeProperty("backdrop-filter");
    el.style.removeProperty("-webkit-backdrop-filter");
  });
  return !con.equals(sin);
}

async function comprobar(page: Page, nombre: string, l: Locator, conEfecto = true) {
  await expect(l, nombre).toBeVisible();
  const filtro = await filtroDe(l);
  expect(filtro, nombre).not.toBe("none");
  expect(filtro, nombre).toContain("blur(24px)");
  if (conEfecto) expect(await desenfocaDeVerdad(page, l), `${nombre}: el filtro no cambia nada`).toBe(true);
}

test("bienvenida: los dos botones de deslizar llevan la receta; onboarding: el vidrio desenfoca el cielo", async ({ page }) => {
  // v2.10.0: la bienvenida ya no tiene cielo ni card de vidrio. El vidrio
  // son los dos botones de deslizar, sobre crema liso: llevan la receta
  // entera, pero ahi el desenfoque no tiene nada que mostrar (aceptado por
  // Isra), asi que no se exige diferencia visible.
  await page.goto("/");
  await page.waitForTimeout(600);
  const botones = page.locator("main .deslizar.vidrio");
  await expect(botones).toHaveCount(2);
  await comprobar(page, "Registrarme", botones.nth(0), false);
  await comprobar(page, "Ya tengo cuenta", botones.nth(1), false);

  await completarRegistro(page);
  await confirmarCorreo(page);
  await page.waitForTimeout(600);
  await comprobar(page, "onboarding", page.locator("main .vidrio").first());
});

test("Inicio: la tarjeta de Beats, la capsula sobre el banner y la barra", async ({ page }) => {
  await cuentaConId(page);
  await page.waitForTimeout(600);
  // v2.7.0: la tarjeta de Beats vuelve a ser vidrio, sobre el degradado de
  // marca.
  await comprobar(page, "tarjeta de Beats", page.locator("section[aria-label='Tu balance de Beats'] > a"));

  const capsula = page.locator("[data-capsula-puntos]");
  await capsula.scrollIntoViewIfNeeded();
  await comprobar(page, "capsula de puntos", capsula);
  // Va sobre la imagen del banner, no debajo.
  const banner = (await page.locator("section[aria-label='Anuncios'] > div").first().boundingBox())!;
  const cajaCapsula = (await capsula.boundingBox())!;
  expect(cajaCapsula.y + cajaCapsula.height).toBeLessThanOrEqual(banner.y + banner.height);
  expect(cajaCapsula.y).toBeGreaterThanOrEqual(banner.y);

  // La barra con el banner pasando por debajo.
  const cajaBarra = (await barra(page).boundingBox())!;
  await page.evaluate((y) => window.scrollBy(0, y), banner.y + banner.height / 2 - (cajaBarra.y + 32));
  await page.waitForTimeout(400);
  await comprobar(page, "barra sobre el banner", barra(page));
});

test("Beats: la barra con la lista debajo y la hoja de ayuda", async ({ page }) => {
  await cuentaConId(page);
  await abrirBeats(page);
  await comprobar(page, "barra en Beats", barra(page), false);

  await page.getByRole("button", { name: "¿Cómo gano Beats?" }).click();
  const hoja = page.getByRole("dialog");
  await page.waitForTimeout(600);
  await comprobar(page, "hoja", hoja);

  // El velo deja ver la pantalla: translucido, no un negro plano.
  const velo = await page.locator("[data-fondo-hoja]").evaluate((el) => getComputedStyle(el).backgroundColor);
  const alfa = Number((velo.match(/[\d.]+/g) ?? [])[3] ?? 1);
  expect(alfa).toBeGreaterThan(0);
  expect(alfa).toBeLessThanOrEqual(0.4);
});

test("barra y hojas pasan AA sobre negro puro con los valores finales", async ({ page }) => {
  await cuentaConId(page);
  await abrirBeats(page);
  const recetaBarra = await recetaDe(barra(page));
  await page.getByRole("button", { name: "¿Cómo gano Beats?" }).click();
  const recetaHoja = await recetaDe(page.getByRole("dialog"));

  for (const [nombre, receta] of [
    ["barra", recetaBarra],
    ["hoja", recetaHoja],
  ] as const) {
    const fondo = sobre(receta.tinte, NEGRO);
    expect(contraste(receta.textoTenue, fondo), `${nombre}: gris tenue`).toBeGreaterThanOrEqual(4.5);
    expect(contraste(NAVY, fondo), `${nombre}: navy`).toBeGreaterThanOrEqual(4.5);
    // Y siguen siendo vidrio: ni opacos ni casi opacos.
    expect(receta.tinte.alfa, `${nombre}: opacidad`).toBeLessThanOrEqual(0.85);
  }
  // Las etiquetas grises de la hoja usan el gris de la paleta (v2.7.0).
  const etiqueta = page.getByRole("dialog").locator(".etiqueta").first();
  await expect(etiqueta).toHaveCSS("color", "rgb(86, 94, 109)");
});
