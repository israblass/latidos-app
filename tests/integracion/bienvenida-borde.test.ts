import { expect, test, type Page } from "@playwright/test";

import { reiniciarMock } from "../ayudantes/mock";

/**
 * Bienvenida v2.10.1: el arte llega al borde de arriba y el pie con los logos
 * mas grandes.
 *
 * La zona segura de arriba se emula con CDP (Emulation.setSafeAreaInsetsOverride,
 * Chromium 141): asi `env(safe-area-inset-top)` vale 59px como en un iPhone
 * con la barra de estado translucida. Con la barra "default" (la que usa la
 * app) iOS deja la zona segura en 0 y pinta una barra opaca aparte: ese caso
 * es el de "sin zona segura" y lo cubre el fundido del borde superior.
 */
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(reiniciarMock);

// 59px: la zona segura de arriba de los iPhone 14 Pro en adelante.
const ZONA = 59;

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

test("con zona segura de 59px el campo llega al borde y el texto y el dock no se mueven", async ({ browser }) => {
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

/** Cajas de los logos del pie, en orden de izquierda a derecha. */
async function logosPie(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLImageElement>("[data-logo-pie]")).map((img) => {
      const r = img.getBoundingClientRect();
      return { nombre: img.dataset.logoPie!, izq: r.left, der: r.right, alto: r.height, centro: r.top + r.height / 2, cargado: img.complete && img.naturalWidth > 0 };
    }),
  );
}

/** Color medio de los pixeles opacos de un logo, leido de la captura. */
async function colorDe(page: Page, nombre: string) {
  const caja = (await page.locator(`[data-logo-pie='${nombre}']`).boundingBox())!;
  const png = await page.screenshot({ clip: caja });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    // El pixel mas alejado del crema: lo que de verdad pinta el logo.
    let lejos = 0;
    for (let i = 0; i < d.length; i += 4) {
      lejos = Math.max(lejos, Math.abs(d[i] - 255) + Math.abs(d[i + 1] - 255) + Math.abs(d[i + 2] - 245));
    }
    return lejos;
  }, png.toString("base64"));
}

for (const [ancho, alto] of [
  [320, 568],
  [375, 667],
  [390, 844],
  [430, 932],
] as const) {
  test(`pie a ${ancho}x${alto}: Flame, UCV y MUN UCV en orden, en el 85% y a 12px de los botones`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: alto });
    await abrir(page, 0);
    await expect.poll(async () => (await logosPie(page)).every((l) => l.cargado)).toBe(true);
    const logos = await logosPie(page);
    expect(logos.map((l) => l.nombre)).toEqual(["flame", "ucv", "mun-ucv"]);
    // Sin solaparse entre si, centrados como grupo y alineados al centro vertical.
    expect(logos[0].der).toBeLessThanOrEqual(logos[1].izq);
    expect(logos[1].der).toBeLessThanOrEqual(logos[2].izq);
    expect(Math.abs(logos[0].izq - (ancho - logos[2].der))).toBeLessThanOrEqual(1);
    for (const l of logos) expect(Math.abs(l.centro - logos[1].centro)).toBeLessThanOrEqual(0.5);
    expect(logos[2].der - logos[0].izq).toBeLessThanOrEqual(ancho * 0.85 + 0.5);
    // Separacion: 24px (16px por debajo de 360 de ancho).
    expect(Math.round(logos[1].izq - logos[0].der)).toBe(ancho < 360 ? 16 : 24);
    // Legibles: el wordmark de Flame, el mas bajo, nunca por debajo de 20px.
    expect(logos[0].alto).toBeGreaterThanOrEqual(20);
    if (alto >= 700) {
      expect(logos.map((l) => Math.round(l.alto))).toEqual([24, 36, 32]);
      await expect(page.locator(".bienvenida-pie__rotulo")).toBeVisible();
      await expect(page.locator(".bienvenida-pie__rotulo")).toHaveCSS("font-size", "10px");
      await expect(page.locator(".bienvenida-pie__rotulo")).toHaveCSS("color", "rgb(86, 94, 109)");
    } else {
      await expect(page.locator(".bienvenida-pie__rotulo")).toBeHidden();
    }
    // Su color efectivo no es blanco ni transparente sobre el crema.
    for (const l of logos) expect(await colorDe(page, l.nombre), l.nombre).toBeGreaterThan(150);
    const m = await page.evaluate(() => ({
      scroll: document.documentElement.scrollHeight,
      alto: innerHeight,
      b2: document.querySelectorAll("[data-boton-deslizar]")[1].getBoundingClientRect().bottom,
      pie: document.querySelector(".bienvenida-pie")!.getBoundingClientRect(),
    }));
    expect(m.pie.top - m.b2).toBeGreaterThanOrEqual(12);
    expect(Math.round(m.alto - m.pie.bottom)).toBe(14);
    expect(m.scroll).toBeLessThanOrEqual(m.alto);
  });
}

test("pie a 360x640: todo cabe sin scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await abrir(page, 0);
  const scroll = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  expect(scroll).toBeLessThanOrEqual(0);
});
