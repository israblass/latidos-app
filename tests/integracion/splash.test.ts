import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { reiniciarMock } from "../ayudantes/mock";

/**
 * Pantalla de carga de la app instalada (constitution §2, v2.10.1): imagenes
 * de arranque de iOS y el overlay #splash-inicial.
 *
 * Chromium no emula `display-mode: standalone` (ni por CDP ni con --app en
 * headless). Para verlo "instalado", la prueba reescribe el HTML de `/` y
 * cambia esa media query por `all`; antes comprueba que la media query esta
 * tal cual en los tres lugares donde se usa (CSS critico, <source> del icono
 * y preload), asi que la reescritura simula exactamente ese caso.
 */
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(reiniciarMock);

const RAIZ = join(__dirname, "..", "..");
const STANDALONE = "(display-mode: standalone)";

const TAMANOS = [
  [440, 956, 3],
  [402, 874, 3],
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [360, 780, 3],
  [414, 896, 3],
  [414, 896, 2],
  [414, 736, 3],
  [375, 667, 2],
  [320, 568, 2],
  [420, 912, 3],
] as const;

/** Ancho y alto de un PNG, leidos de su cabecera IHDR. */
function medidasPng(ruta: string) {
  const b = readFileSync(ruta);
  expect(b.subarray(1, 4).toString("ascii")).toBe("PNG");
  expect(b.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) };
}

/** Abre `/` como si fuera la app instalada (ver el comentario de arriba). */
async function abrirInstalada(page: Page) {
  await page.route("**/", async (ruta) => {
    if (ruta.request().resourceType() !== "document") return ruta.continue();
    const respuesta = await ruta.fetch();
    const html = await respuesta.text();
    await ruta.fulfill({ response: respuesta, body: html.split(STANDALONE).join("all") });
  });
  await page.goto("/");
}

test("el HTML de / trae las 14 imagenes de arranque y cada PNG mide lo que dice", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const links = Array.from(html.matchAll(/<link[^>]*rel="apple-touch-startup-image"[^>]*>/g)).map(([l]) => l);
  expect(links).toHaveLength(14);
  for (const [w, h, r] of TAMANOS) {
    const archivo = `/splash/splash-${w * r}x${h * r}.png`;
    const media = `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`;
    expect(links.some((l) => l.includes(`href="${archivo}"`) && l.includes(`media="${media}"`)), archivo).toBe(true);
    const ruta = join(RAIZ, "public", archivo);
    expect(existsSync(ruta), archivo).toBe(true);
    expect(medidasPng(ruta), archivo).toEqual({ ancho: w * r, alto: h * r });
  }
  // Ni mas ni menos que esas 14 en public/splash.
  expect(readdirSync(join(RAIZ, "public", "splash")).filter((f) => f.endsWith(".png"))).toHaveLength(14);
  // El resto de la configuracion de iOS no cambia.
  expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes"/>');
  expect(html).toContain('<meta name="apple-mobile-web-app-title" content="Latidos"/>');
  expect(html).toContain('<meta name="apple-mobile-web-app-status-bar-style" content="default"/>');
});

test("el overlay viene en el HTML del servidor, primero en el body y con su CSS en linea", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toMatch(/<body[^>]*><div id="splash-inicial" aria-hidden="true"/);
  const css = html.match(/<style>([\s\S]*?#splash-inicial[\s\S]*?)<\/style>/)![1];
  expect(css).toContain("html,body{background:#FFFFF5}");
  expect(css).toContain("#splash-inicial{display:none}");
  expect(css).toContain(`@media ${STANDALONE}{`);
  expect(css).toContain("pointer-events:none");
  expect(css).toContain("radial-gradient(120% 70% at 50% 50%,rgba(253,251,5,.30),rgba(253,251,5,0) 62%)");
  expect(css).toContain("radial-gradient(90% 55% at 0% 100%,rgba(0,144,255,.34),rgba(0,144,255,0) 70%)");
  expect(css).toContain("radial-gradient(80% 50% at 100% 0%,rgba(0,144,255,.18),rgba(0,144,255,0) 70%)");
  expect(html).toContain(`<source media="${STANDALONE}" srcSet="/icons/icon-512.png"/>`);
  expect(html).toContain(`<link rel="preload" as="image" href="/icons/icon-512.png" media="${STANDALONE}"/>`);
  // Los logos del pie no se precargan: no compiten con el arte de la pantalla 1.
  expect(html).not.toMatch(/rel="preload"[^>]*marca\/pie/);
});

test.describe("sin JavaScript (lo que se ve antes de hidratar)", () => {
  test.use({ javaScriptEnabled: false });

  test("en el navegador el overlay no se ve ni pide el icono", async ({ page }) => {
    const pedidos: string[] = [];
    page.on("request", (r) => pedidos.push(new URL(r.url()).pathname));
    await page.goto("/");
    await expect(page.locator("#splash-inicial")).toBeAttached();
    await expect(page.locator("#splash-inicial")).toBeHidden();
    expect(pedidos).not.toContain("/icons/icon-512.png");
  });

  test("instalada, cubre la pantalla con el icono centrado y sin recibir toques", async ({ page }) => {
    await abrirInstalada(page);
    const capa = page.locator("#splash-inicial");
    await expect(capa).toBeVisible();
    await expect(capa).toHaveCSS("position", "fixed");
    await expect(capa).toHaveCSS("pointer-events", "none");
    expect(await capa.boundingBox()).toEqual({ x: 0, y: 0, width: 390, height: 844 });
    const img = page.locator("#splash-inicial img");
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.currentSrc)).toContain("/icons/icon-512.png");
    const caja = (await img.boundingBox())!;
    // 0.33 del ancho, cuadrado, centrado y 1% de alto por encima del centro
    // (flex centrado con margin-top: -1vh, como la referencia).
    expect(caja.width).toBeCloseTo(390 * 0.33, 0);
    expect(caja.height).toBeCloseTo(caja.width, 0);
    expect(caja.x + caja.width / 2).toBeCloseTo(195, 0);
    expect(caja.y + caja.height / 2).toBeCloseTo(422 - 844 * 0.005, 0);
    await expect(img).toHaveCSS("border-radius", "22.5%");
    // El contenido de la app esta debajo y se puede tocar a traves del overlay.
    await expect(page.getByRole("button", { name: /^Registrarme\./ })).toBeAttached();
  });
});

test("instalada, al hidratar se desvanece en 250ms y sale del DOM", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { fases: string[] }).fases = [];
    new MutationObserver(() => {
      const capa = document.getElementById("splash-inicial");
      const fases = (window as unknown as { fases: string[] }).fases;
      const fase = capa ? capa.dataset.fase ?? "" : "fuera";
      if (fases[fases.length - 1] !== fase) fases.push(fase);
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });
  await abrirInstalada(page);
  await expect(page.locator("#splash-inicial")).toHaveCount(0);
  const fases = await page.evaluate(() => (window as unknown as { fases: string[] }).fases);
  expect(fases).toContain("saliendo");
  expect(fases[fases.length - 1]).toBe("fuera");
  // La app se usa sin esperar a nada mas.
  await expect(page.getByRole("button", { name: /^Registrarme\./ })).toBeVisible();
});

test.describe("con prefers-reduced-motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("instalada, sale del DOM sin fundido", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { saliendo: boolean }).saliendo = false;
      new MutationObserver(() => {
        if (document.querySelector("#splash-inicial.saliendo")) (window as unknown as { saliendo: boolean }).saliendo = true;
      }).observe(document, { subtree: true, childList: true, attributes: true });
    });
    await abrirInstalada(page);
    await expect(page.locator("#splash-inicial")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { saliendo: boolean }).saliendo)).toBe(false);
  });
});

test("en el navegador el overlay tambien sale del DOM y no vuelve en las navegaciones internas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#splash-inicial")).toHaveCount(0);
  await page.getByRole("button", { name: /^Ya tengo cuenta\./ }).click();
  await expect(page).toHaveURL(/\/entrar/);
  await expect(page.locator("#splash-inicial")).toHaveCount(0);
});

test("el manifest conserva el crema y los iconos de siempre", () => {
  const manifest = JSON.parse(readFileSync(join(RAIZ, "public", "manifest.json"), "utf8"));
  expect(manifest.background_color).toBe("#FFFFF5");
  expect(manifest.theme_color).toBe("#FFFFF5");
  expect(manifest.icons.map((i: { src: string; purpose: string }) => `${i.src} ${i.purpose}`)).toEqual([
    "/icons/icon-192.png any",
    "/icons/icon-512.png any",
    "/icons/icon-maskable-192.png maskable",
    "/icons/icon-maskable-512.png maskable",
  ]);
});
