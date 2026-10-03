import { expect, test, type Page } from "@playwright/test";

import { reiniciarMock } from "../ayudantes/mock";

/**
 * Bienvenida v2.10.1: el arte llega al borde de arriba y el pie con los logos
 * mas grandes.
 *
 * La zona segura de arriba se emula con CDP (Emulation.setSafeAreaInsetsOverride,
 * Chromium 141): asi `env(safe-area-inset-top)` vale 47px como en un iPhone
 * con la barra de estado translucida. Con la barra "default" (la que usa la
 * app) iOS deja la zona segura en 0 y pinta una barra opaca aparte: ese caso
 * es el de "sin zona segura" y lo cubre el fundido del borde superior.
 */
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(reiniciarMock);

const ZONA = 47;

async function abrir(page: Page, zona: number) {
  if (zona) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride" as never, { insets: { top: zona, topMax: zona } } as never);
  }
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^Registrarme\./ })).toBeVisible();
}

async function irA(page: Page, i: number) {
  await page
    .locator("[data-carrusel-bienvenida]")
    .evaluate((el, n) => el.scrollTo({ left: n * el.clientWidth, behavior: "instant" as ScrollBehavior }), i);
  await expect
    .poll(() => page.evaluate(() => document.querySelector("[data-punto][aria-current='true']")?.getAttribute("data-punto")))
    .toBe(String(i));
}

/** Posiciones de la pantalla i y del dock, en px del viewport. */
async function medidas(page: Page, i: number) {
  return page.evaluate((n) => {
    const pantalla = document.querySelector(`[data-indice='${n}']`)!;
    const caja = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top * 10) / 10, height: Math.round(r.height * 10) / 10 };
    };
    const ancho = pantalla.getBoundingClientRect().left;
    const arte = pantalla.querySelector(".bienvenida-arte")!;
    return {
      campo: caja(pantalla.querySelector(".bienvenida-campo")!),
      arte: caja(arte),
      lienzo: caja(arte.querySelector(".bienvenida-lienzo")!),
      logo: caja(pantalla.querySelector("img[data-logo-bienvenida]")!),
      velo: caja(pantalla.querySelector("[data-velo-superior]")!),
      texto: caja(pantalla.querySelector(".bienvenida-texto")!),
      puntos: caja(document.querySelector(".bienvenida-puntos")!),
      b1: caja(document.querySelectorAll("[data-boton-deslizar]")[0]),
      b2: caja(document.querySelectorAll("[data-boton-deslizar]")[1]),
      izquierda: ancho,
    };
  }, i);
}

test("con zona segura de 47px el campo llega al borde y el texto y el dock no se mueven", async ({ browser }) => {
  const sin = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await abrir(sin, 0);
  const con = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await abrir(con, ZONA);
  expect(await con.evaluate(() => getComputedStyle(document.querySelector(".bienvenida")!).getPropertyValue("--zona-arriba").trim())).not.toBe("");

  for (let i = 0; i < 4; i++) {
    await irA(sin, i);
    await irA(con, i);
    const a = await medidas(sin, i);
    const b = await medidas(con, i);

    // El campo de color empieza en y=0 y mide 430 (escalado) + la zona segura.
    expect(b.campo.top, `pantalla ${i + 1}: campo en y=0`).toBe(0);
    expect(b.campo.height, `pantalla ${i + 1}: alto del campo`).toBeCloseTo(a.campo.height + ZONA, 0);
    // Las ilustraciones se corren exactamente la zona segura; el lienzo no cambia.
    expect(b.arte.top).toBeCloseTo(a.arte.top + ZONA, 0);
    expect(b.lienzo.height).toBeCloseTo(a.lienzo.height, 0);
    // El logo, a la zona segura + 16px como minimo.
    expect(b.logo.top).toBeGreaterThanOrEqual(ZONA + 16);
    // El velo cubre la zona segura + 16px.
    expect(b.velo.top).toBe(0);
    expect(b.velo.height).toBeCloseTo(ZONA + 16, 0);
    // Texto, puntos y botones, en el mismo lugar que sin zona segura.
    for (const k of ["texto", "puntos", "b1", "b2"] as const) {
      expect(b[k].top, `pantalla ${i + 1}: ${k}`).toBeCloseTo(a[k].top, 0);
    }
  }
  await sin.close();
  await con.close();
});

test("sin zona segura (barra 'default' de iOS) el borde de arriba se funde con el crema", async ({ page }) => {
  await abrir(page, 0);
  for (let i = 0; i < 4; i++) {
    await irA(page, i);
    const estilos = await page.evaluate((n) => {
      const p = document.querySelector(`[data-indice='${n}']`)!;
      const m = (s: string) => {
        const e = getComputedStyle(p.querySelector(s)!);
        return e.maskImage || e.webkitMaskImage;
      };
      const velo = getComputedStyle(p.querySelector("[data-velo-superior]")!);
      return { campo: m(".bienvenida-campo"), arte: m(".bienvenida-arte"), velo: velo.backgroundImage, eventos: velo.pointerEvents };
    }, i);
    // La mascara arranca transparente en el borde y llega a opaca a los 56px.
    // (Chromium omite el "0px" de la primera parada al serializar.)
    expect(estilos.campo).toMatch(/^linear-gradient\(rgba\(0, 0, 0, 0\)( 0px)?, rgb\(255, 255, 255\) 56px/);
    expect(estilos.arte).toMatch(/^linear-gradient\(rgba\(0, 0, 0, 0\)[^,]*, rgb\(255, 255, 255\) (56px|calc\()/);
    // Velo crema translucido que se funde a transparente, sin interceptar toques.
    expect(estilos.velo).toContain("rgba(255, 255, 245, 0.55)");
    expect(estilos.velo).toContain("rgba(255, 255, 245, 0)");
    expect(estilos.eventos).toBe("none");
  }
  // El pixel de la primera fila es el crema del fondo, no el color del campo.
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 2 } });
  const fila = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return Array.from(ctx.getImageData(Math.floor(c.width / 2), 0, 1, 1).data.slice(0, 3));
  }, png.toString("base64"));
  // El degradado de marca (.fondo-inicio) puede teñir apenas: muy cerca del crema.
  expect(Math.abs(fila[0] - 255) + Math.abs(fila[1] - 255) + Math.abs(fila[2] - 245)).toBeLessThan(90);
});

test("pie: tres logos visibles de 22px o mas y 12px desde Ya tengo cuenta", async ({ page }) => {
  await abrir(page, 0);
  for (const nombre of ["flame", "ucv", "mun-ucv"]) {
    const logo = page.locator(`[data-logo-pie='${nombre}']`);
    await expect(logo).toBeVisible();
    expect((await logo.boundingBox())!.height, nombre).toBeGreaterThanOrEqual(22);
  }
  // El sello de la UCV mas alto que los wordmarks (altura optica).
  expect((await page.locator("[data-logo-pie='ucv']").boundingBox())!.height).toBe(28);
  expect((await page.locator("[data-logo-pie='flame']").boundingBox())!.height).toBe(24);
  // Como mucho el 85% del ancho y 24px entre logos.
  const fila = page.locator(".bienvenida-pie__logos");
  expect((await fila.boundingBox())!.width).toBeLessThanOrEqual(390 * 0.85 + 0.5);
  await expect(fila).toHaveCSS("column-gap", "24px");
  // Rotulo a 10px y 6px hasta los logos.
  await expect(page.locator(".bienvenida-pie__rotulo")).toHaveCSS("font-size", "10px");
  await expect(page.locator(".bienvenida-pie")).toHaveCSS("row-gap", "6px");
  const b2 = (await page.locator("[data-boton-deslizar]").nth(1).boundingBox())!;
  const pie = (await page.locator(".bienvenida-pie").boundingBox())!;
  expect(pie.y - (b2.y + b2.height)).toBeGreaterThanOrEqual(12);
  // El pie, a 14px del borde.
  expect(Math.round(844 - (pie.y + pie.height))).toBe(14);
});

for (const [ancho, alto] of [
  [375, 667],
  [360, 640],
  [320, 568],
] as const) {
  test(`pie a ${ancho}x${alto}: solo logos de 22px, todo cabe sin scroll`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: alto });
    await abrir(page, 0);
    await expect(page.locator(".bienvenida-pie__rotulo")).toBeHidden();
    for (const nombre of ["flame", "ucv", "mun-ucv"]) {
      expect((await page.locator(`[data-logo-pie='${nombre}']`).boundingBox())!.height).toBe(22);
    }
    const m = await page.evaluate(() => ({
      scroll: document.documentElement.scrollHeight,
      alto: innerHeight,
      pie: document.querySelector(".bienvenida-pie")!.getBoundingClientRect().bottom,
      b2: document.querySelectorAll("[data-boton-deslizar]")[1].getBoundingClientRect().bottom,
      pieTop: document.querySelector(".bienvenida-pie")!.getBoundingClientRect().top,
    }));
    expect(m.scroll).toBeLessThanOrEqual(m.alto);
    expect(m.pie).toBeLessThanOrEqual(m.alto);
    expect(m.pieTop - m.b2).toBeGreaterThanOrEqual(12);
    if (ancho < 360) await expect(page.locator(".bienvenida-pie__logos")).toHaveCSS("column-gap", "16px");
  });
}
