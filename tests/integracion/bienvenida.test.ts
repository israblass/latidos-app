import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { auditar, informe } from "../ayudantes/accesibilidad";
import { reiniciarMock } from "../ayudantes/mock";
import { NAVY, aColor, contraste, filtrar, recetaDe, sobre, type Rgb } from "../ayudantes/vidrio";
import { LOGO_AMARILLO } from "../../src/lib/assets";

/**
 * Bienvenida inmersiva (constitution §2, v2.10.0): carrusel de cuatro
 * pantallas y dos botones de deslizar de vidrio fijos abajo.
 *
 * Solo Chromium: el vidrio y el gesto en Safari de iPhone se validan a mano
 * (checklist del README).
 */
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(reiniciarMock);

const PANTALLAS = [
  ["Programa UCV · 2026-2027", "Tu pulso", "cuenta", "Asiste a los eventos, suma Beats y canjéalos por recompensas."],
  ["Eventos", "Vive cada", "evento", "Cada evento del programa te suma Beats."],
  ["Campus", "Recorre", "la UCV", "Busca los QR por el campus y escanéalos para sumar Beats."],
  ["Recompensas", "Enciende", "tu pulso", "Canjea tus Beats por recompensas."],
] as const;

const carrusel = (page: Page) => page.getByRole("region", { name: "Bienvenida a Latidos" });
const registrarme = (page: Page) => page.getByRole("button", { name: "Registrarme. Desliza o toca para activar." });
const yaTengo = (page: Page) => page.getByRole("button", { name: "Ya tengo cuenta. Desliza o toca para activar." });
const controles = (page: Page) => page.locator("[data-boton-deslizar]");
const punto = (page: Page, i: number) => page.getByRole("button", { name: `Ir a la pantalla ${i + 1} de 4` });

async function abrir(page: Page) {
  await page.goto("/");
  await expect(registrarme(page)).toBeVisible();
}

/** Desliza el carrusel (como el dedo) hasta la pantalla i. */
async function deslizarA(page: Page, i: number) {
  await carrusel(page).evaluate(
    (el, n) => el.scrollTo({ left: n * el.clientWidth, behavior: "instant" as ScrollBehavior }),
    i,
  );
}

const activo = (page: Page) =>
  page.evaluate(() => Number(document.querySelector("[data-punto][aria-current='true']")?.getAttribute("data-punto")));

/** Arrastra el circulo de un boton hasta `fraccion` de su recorrido. */
async function arrastrar(page: Page, indice: number, fraccion: number, soltar = true) {
  const control = (await controles(page).nth(indice).boundingBox())!;
  const c = (await controles(page).nth(indice).locator(".deslizar__circulo").boundingBox())!;
  const recorrido = control.width - c.width - 16;
  const x0 = c.x + c.width / 2;
  const y = c.y + c.height / 2;
  await page.mouse.move(x0, y);
  await page.mouse.down();
  for (let k = 1; k <= 10; k++) await page.mouse.move(x0 + (recorrido * fraccion * k) / 10, y);
  if (soltar) await page.mouse.up();
}

test("(a) cuatro pantallas en orden, con los textos exactos", async ({ page }) => {
  await abrir(page);
  const pantallas = page.locator("[data-carrusel-bienvenida] > [data-indice]");
  await expect(pantallas).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    const p = pantallas.nth(i);
    const [eyebrow, titulo, fuerte, sub] = PANTALLAS[i];
    await expect(p).toHaveAttribute("role", "group");
    await expect(p).toHaveAttribute("aria-roledescription", "pantalla");
    await expect(p).toHaveAttribute("aria-label", `${i + 1} de 4`);
    await expect(p.locator(".bienvenida-eyebrow")).toHaveText(eyebrow);
    const t = p.locator(".bienvenida-titulo");
    await expect(t).toHaveText(`${titulo} ${fuerte}`);
    await expect(t.locator("b")).toHaveText(fuerte);
    await expect(t.locator("b")).toHaveCSS("font-weight", "700");
    await expect(t).toHaveCSS("font-weight", "300");
    // Solo la visible es h1.
    expect(await t.evaluate((el) => el.tagName)).toBe(i === 0 ? "H1" : "P");
    await expect(p.locator(".bienvenida-sub")).toHaveText(sub);
  }
  await expect(carrusel(page)).toHaveAttribute("aria-roledescription", "carrusel");
  // Un solo h1 en el arbol accesible: el de la pantalla visible. Las otras van
  // inert y aria-hidden.
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tu pulso cuenta");
  for (let i = 1; i < 4; i++) {
    await expect(pantallas.nth(i)).toHaveAttribute("inert", "");
    await expect(pantallas.nth(i)).toHaveAttribute("aria-hidden", "true");
  }
  // Sin cielo de foto ni card de vidrio: el degradado de marca.
  await expect(page.locator("[data-cielo]")).toHaveCount(0);
  await expect(page.locator(".fondo-inicio")).toHaveCount(1);
  // Logos: el oficial con aro y, sobre el amarillo pleno, la variante de
  // LOGO_AMARILLO.
  for (const i of [0, 2, 3]) await expect(pantallas.nth(i).locator("img[data-logo-bienvenida]")).toHaveAttribute("src", /logo-latidos-aro\.png/);
  await expect(pantallas.nth(1).locator("img[data-logo-bienvenida]")).toHaveAttribute(
    "src",
    LOGO_AMARILLO === "blanco" ? /logo-latidos-blanco-aro\.png/ : /logo-latidos-navy-aro\.png/,
  );
});

test("(b) los puntos siguen al swipe y tocarlos lleva a esa pantalla", async ({ page }) => {
  await abrir(page);
  expect(await activo(page)).toBe(0);
  await deslizarA(page, 2);
  await expect.poll(() => activo(page)).toBe(2);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Recorre la UCV");

  await punto(page, 1).click();
  await expect.poll(() => activo(page)).toBe(1);
  await expect
    .poll(() => carrusel(page).evaluate((el) => Math.round(el.scrollLeft / el.clientWidth)))
    .toBe(1);
  // El punto activo mide 24px y es navy; los demas 8px.
  await expect(punto(page, 1).locator("span")).toHaveCSS("width", "24px");
  await expect(punto(page, 1).locator("span")).toHaveCSS("background-color", "rgb(26, 35, 50)");
  await expect(punto(page, 0).locator("span")).toHaveCSS("width", "8px");
  // Area tactil: 48px de alto (pedido: 44 como minimo; la constitucion pide
  // 48) y botones contiguos, sin solaparse.
  const cajas = [];
  for (let i = 0; i < 4; i++) cajas.push((await punto(page, i).boundingBox())!);
  for (const c of cajas) expect(c.height).toBe(48);
  for (let i = 1; i < 4; i++) expect(cajas[i].x).toBeGreaterThanOrEqual(cajas[i - 1].x + cajas[i - 1].width - 0.5);
});

test("(c) con el carrusel enfocado, las flechas cambian de pantalla", async ({ page }) => {
  await abrir(page);
  await carrusel(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => activo(page)).toBe(1);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => activo(page)).toBe(2);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => activo(page)).toBe(1);
  // Orden de foco: el carrusel, los puntos, Registrarme y Ya tengo cuenta.
  await carrusel(page).focus();
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    await expect(punto(page, i)).toBeFocused();
  }
  await page.keyboard.press("Tab");
  await expect(registrarme(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(yaTengo(page)).toBeFocused();
});

for (const [ancho, alto] of [
  [375, 667],
  [360, 640],
  [320, 568],
  [390, 844],
  [414, 896],
  [430, 932],
] as const) {
  test(`(d) a ${ancho}x${alto} los botones y el pie caben sin scroll y sin tapar el texto`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: alto });
    await abrir(page);
    for (const i of [0, 2]) {
      await deslizarA(page, i);
      await expect.poll(() => activo(page)).toBe(i);
      const medidas = await page.evaluate(() => {
        const caja = (el: Element | null) => el!.getBoundingClientRect();
        const visible = document.querySelector("[data-carrusel-bienvenida] > [data-indice]:not([inert])")!;
        return {
          alto: innerHeight,
          scroll: document.documentElement.scrollHeight,
          texto: caja(visible.querySelector(".bienvenida-texto")),
          puntos: caja(document.querySelector(".bienvenida-puntos > button > span")),
          b1: caja(document.querySelectorAll("[data-boton-deslizar]")[0]),
          b2: caja(document.querySelectorAll("[data-boton-deslizar]")[1]),
          pie: caja(document.querySelector(".bienvenida-pie")),
        };
      });
      expect(medidas.scroll, "sin scroll vertical").toBeLessThanOrEqual(medidas.alto);
      for (const nombre of ["b1", "b2", "pie"] as const) {
        expect(medidas[nombre].top, nombre).toBeGreaterThanOrEqual(0);
        expect(medidas[nombre].bottom, nombre).toBeLessThanOrEqual(medidas.alto);
      }
      expect(medidas.texto.bottom, "el texto no toca los puntos").toBeLessThanOrEqual(medidas.puntos.top);
      expect(medidas.b1.bottom).toBeLessThanOrEqual(medidas.b2.top);
      expect(medidas.pie.top - medidas.b2.bottom, "10px entre el boton 2 y el pie").toBeGreaterThanOrEqual(10);
    }
    // En alturas bajas: titular mas chico y pie solo con logos; a 320x568,
    // botones de 56px.
    const titulo = page.locator("[data-indice='0'] .bienvenida-titulo");
    const rotulo = page.locator(".bienvenida-pie__rotulo");
    const esperado = alto < 600 ? "38px" : alto < 700 ? "42px" : "48px";
    await expect(titulo).toHaveCSS("font-size", esperado);
    if (alto < 700) await expect(rotulo).toBeHidden();
    else await expect(rotulo).toBeVisible();
    const altoBoton = alto < 600 ? 56 : 64;
    expect(Math.round((await controles(page).nth(0).boundingBox())!.height)).toBe(altoBoton);
    expect(Math.round((await controles(page).nth(1).boundingBox())!.height)).toBe(altoBoton);
  });
}

test("(e) Registrarme lleva al registro tocando y deslizando", async ({ page }) => {
  await abrir(page);
  await registrarme(page).click();
  await page.waitForURL("**/registro/paso-1");
  await abrir(page);
  await arrastrar(page, 0, 0.95);
  await page.waitForURL("**/registro/paso-1");
});

test("(e) Ya tengo cuenta lleva a Entrar tocando, deslizando, con Enter y con Espacio", async ({ page }) => {
  await abrir(page);
  await yaTengo(page).click();
  await page.waitForURL("**/entrar");
  await abrir(page);
  // El recorrido y el umbral se miden sobre su ancho real (228px).
  await arrastrar(page, 1, 0.95);
  await page.waitForURL("**/entrar");
  await abrir(page);
  await yaTengo(page).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/entrar");
  await abrir(page);
  await yaTengo(page).focus();
  await page.keyboard.press(" ");
  await page.waitForURL("**/entrar");
});

test("(e) un arrastre corto del boton angosto no navega", async ({ page }) => {
  await abrir(page);
  await arrastrar(page, 1, 0.6);
  await page.waitForTimeout(700);
  expect(new URL(page.url()).pathname).toBe("/");
});

test("(f) mismo alto, el secundario mas angosto y centrado", async ({ page }) => {
  await abrir(page);
  const b1 = (await controles(page).nth(0).boundingBox())!;
  const b2 = (await controles(page).nth(1).boundingBox())!;
  expect(Math.round(b1.height)).toBe(64);
  expect(Math.round(b2.height)).toBe(64);
  expect(Math.round(b1.width)).toBe(390 - 32);
  expect(Math.round(b2.width)).toBe(228);
  expect(Math.abs(b2.x + b2.width / 2 - 195)).toBeLessThanOrEqual(1);
  // Los dos de vidrio, con sus variantes.
  await expect(controles(page).nth(0)).toHaveClass(/deslizar--vidrio-amarillo/);
  await expect(controles(page).nth(1)).toHaveClass(/deslizar--vidrio-blanco/);
  await expect(controles(page).nth(1).locator(".deslizar__circulo")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(controles(page).nth(0).locator(".deslizar__circulo")).toHaveCSS("color", "rgb(253, 251, 5)");
  await expect(controles(page).nth(1)).toHaveCSS("font-size", "16px");
});

test("(g) arrastrar un boton no mueve el otro ni el carrusel", async ({ page }) => {
  await abrir(page);
  await arrastrar(page, 0, 0.6, false);
  const x = (i: number) =>
    controles(page)
      .nth(i)
      .locator(".deslizar__circulo")
      .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  expect(await x(0)).toBeGreaterThan(100);
  expect(await x(1)).toBe(0);
  expect(await carrusel(page).evaluate((el) => el.scrollLeft)).toBe(0);
  expect(await activo(page)).toBe(0);
  await page.mouse.up();
  await page.waitForTimeout(600);
  expect(new URL(page.url()).pathname).toBe("/");
  // Y deslizar el carrusel no activa ningun boton.
  await deslizarA(page, 1);
  await expect.poll(() => activo(page)).toBe(1);
  await page.waitForTimeout(400);
  expect(new URL(page.url()).pathname).toBe("/");
});

test("(h) las etiquetas pasan AA sobre el vidrio en el peor caso de lo que hay detras", async ({ page }) => {
  await abrir(page);
  for (let i = 0; i < 2; i++) {
    const control = controles(page).nth(i);
    const receta = await recetaDe(control);
    // Lo que hay detras: se esconden los dos botones y se busca el pixel mas
    // oscuro de su zona en cada pantalla.
    const caja = (await control.boundingBox())!;
    let oscuro: Rgb = [255, 255, 255];
    for (const pantalla of [0, 1, 2, 3]) {
      await deslizarA(page, pantalla);
      await page.waitForTimeout(250);
      await page.locator("[data-boton-deslizar]").evaluateAll((els) => els.forEach((e) => ((e as HTMLElement).style.visibility = "hidden")));
      const png = await page.screenshot({ clip: caja });
      await page.locator("[data-boton-deslizar]").evaluateAll((els) => els.forEach((e) => ((e as HTMLElement).style.visibility = "")));
      const px = (await page.evaluate(async (b64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
        let o = [255, 255, 255];
        for (let k = 0; k < d.length; k += 4) if (lum(d[k], d[k + 1], d[k + 2]) < lum(o[0], o[1], o[2])) o = [d[k], d[k + 1], d[k + 2]];
        return o;
      }, png.toString("base64"))) as Rgb;
      if (px[0] * 0.2126 + px[1] * 0.7152 + px[2] * 0.0722 < oscuro[0] * 0.2126 + oscuro[1] * 0.7152 + oscuro[2] * 0.0722) oscuro = px;
    }
    const fondo = sobre(receta.tinte, filtrar(oscuro, receta.saturacion, receta.brillo));
    const etiqueta = aColor(await control.evaluate((el) => getComputedStyle(el).color)).rgb;
    expect(etiqueta).toEqual(NAVY);
    console.log(`[contraste] boton ${i + 1}: navy sobre el vidrio ${contraste(NAVY, fondo).toFixed(2)}:1 (peor pixel detras ${oscuro.join(",")})`);
    expect(contraste(NAVY, fondo), `boton ${i + 1}`).toBeGreaterThanOrEqual(4.5);
    await deslizarA(page, 0);
  }
  // El tinte amarillo es el pedido (.92 -> .82), sin subirlo.
  const amarillo = await recetaDe(controles(page).nth(0));
  expect(amarillo.tinte.alfa).toBeCloseTo(0.82, 2);
  // Sin desenfoque (o con menos transparencia) pasa a amarillo solido: navy
  // sobre #FDFB05.
  expect(contraste(NAVY, [253, 251, 5])).toBeGreaterThanOrEqual(4.5);
});

test("(h) con prefers-reduced-transparency el amarillo queda solido y el blanco opaco", async ({ browser }) => {
  const contexto = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pagina = await contexto.newPage();
  const cdp = await contexto.newCDPSession(pagina);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
  });
  await pagina.goto("/");
  const tintes = await pagina.locator("[data-boton-deslizar]").evaluateAll((els) =>
    els.map((el) => {
      const e = getComputedStyle(el);
      return [e.getPropertyValue("--vidrio-tinte-arriba").trim(), e.backdropFilter];
    }),
  );
  expect(tintes[0][0]).toMatch(/fdfb05|253, 251, 5/i);
  expect(tintes[1][0]).toMatch(/#fff(fff)?$|255, 255, 255/i);
  expect(tintes.map((t) => t[1])).toEqual(["none", "none"]);
  await contexto.close();
});

test("(i) el aviso de instalacion no bloquea ni tapa los botones", async ({ browser }) => {
  const contexto = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  });
  const pagina = await contexto.newPage();
  await pagina.addInitScript(() => {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const evento = new Event("beforeinstallprompt") as Event & {
          prompt?: () => Promise<void>;
          userChoice?: Promise<{ outcome: string }>;
        };
        evento.prompt = async () => undefined;
        evento.userChoice = Promise.resolve({ outcome: "dismissed" });
        window.dispatchEvent(evento);
      }, 300);
    });
  });
  await pagina.goto("/");
  const instalar = pagina.getByRole("button", { name: "Instalar", exact: true });
  await expect(instalar).toBeVisible();
  const aviso = (await instalar.locator("xpath=ancestor::div[contains(@class,'fixed')][1]").boundingBox())!;
  for (const nombre of ["Registrarme. Desliza o toca para activar.", "Ya tengo cuenta. Desliza o toca para activar."]) {
    const b = (await pagina.getByRole("button", { name: nombre }).boundingBox())!;
    expect(aviso.y + aviso.height, `el aviso no llega a ${nombre}`).toBeLessThan(b.y);
    // Lo que hay en el centro del boton es el boton.
    const encima = await pagina.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest("[data-boton-deslizar]") !== null,
      [b.x + b.width / 2, b.y + b.height / 2],
    );
    expect(encima).toBe(true);
  }
  await pagina.getByRole("button", { name: "Registrarme. Desliza o toca para activar." }).click();
  await pagina.waitForURL("**/registro/paso-1");
  await contexto.close();
});

test("(i) cerrado el aviso, queda un boton para instalar que no choca con el logo", async ({ page }) => {
  // Aviso descartado hace un momento: queda el boton para reabrirlo.
  await page.addInitScript(() => localStorage.setItem("latidos:instalacion-descartada", String(Date.now())));
  await abrir(page);
  const boton = page.getByRole("button", { name: "Instalar la app" });
  await expect(boton).toBeVisible();
  const b = (await boton.boundingBox())!;
  expect(b.width).toBeGreaterThanOrEqual(48);
  expect(b.height).toBeGreaterThanOrEqual(48);
  const logo = (await page.locator("[data-indice='0'] img[data-logo-bienvenida]").boundingBox())!;
  const solapa = b.x < logo.x + logo.width && b.x + b.width > logo.x && b.y < logo.y + logo.height && b.y + b.height > logo.y;
  expect(solapa).toBe(false);
});

test("(j) con prefers-reduced-motion los puntos llevan sin scroll suave", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await abrir(page);
  await punto(page, 3).click();
  // Instantaneo: en el mismo cuadro ya esta en la pantalla 4.
  const ancho = await carrusel(page).evaluate((el) => el.clientWidth);
  expect(await carrusel(page).evaluate((el) => el.scrollLeft)).toBe(ancho * 3);
  // Y sin destello en las etiquetas.
  const animacion = await controles(page)
    .nth(0)
    .locator(".deslizar__etiqueta span")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animacion).toBe("none");
});

test("con movimiento normal, tocar un punto desliza suave", async ({ page }) => {
  await abrir(page);
  await punto(page, 3).click();
  const ancho = await carrusel(page).evaluate((el) => el.clientWidth);
  // A mitad de camino todavia no llego.
  expect(await carrusel(page).evaluate((el) => el.scrollLeft)).toBeLessThan(ancho * 3);
  await expect.poll(() => carrusel(page).evaluate((el) => el.scrollLeft)).toBe(ancho * 3);
});

test("axe y auditoria sin violaciones en las cuatro pantallas", async ({ page }) => {
  await abrir(page);
  for (let i = 0; i < 4; i++) {
    await deslizarA(page, i);
    await expect.poll(() => activo(page)).toBe(i);
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`), `pantalla ${i + 1}`).toEqual([]);
    const hallazgos = await auditar(page);
    expect(hallazgos, informe(`pantalla ${i + 1}`, hallazgos)).toEqual([]);
  }
});

test("las ilustraciones son decorativas, con tamaño fijo, y solo la pantalla 1 carga de entrada", async ({ page }) => {
  await abrir(page);
  const imagenes = page.locator(".bienvenida-arte img");
  await expect(imagenes).toHaveCount(9);
  for (const img of await imagenes.all()) {
    await expect(img).toHaveAttribute("alt", "");
    await expect(img).toHaveAttribute("width", /\d+/);
    await expect(img).toHaveAttribute("height", /\d+/);
    await expect(img).toHaveAttribute("decoding", "async");
  }
  await expect(page.locator("[data-indice='0'] .bienvenida-arte img[loading='eager']")).toHaveCount(3);
  await expect(page.locator("[data-indice='1'] .bienvenida-arte img[loading='lazy']")).toHaveCount(2);
  await expect(page.locator(".bienvenida-arte").first()).toHaveAttribute("aria-hidden", "true");
});
