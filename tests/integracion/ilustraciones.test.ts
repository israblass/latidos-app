import { expect, test, type Page } from "@playwright/test";

import { completarRegistro, confirmarCorreo, cuentaEnInicio } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";
import { cortarRed, volverRed } from "../ayudantes/red";

/**
 * Ilustraciones definitivas (barrido de la Parte D).
 *
 * Lo que importa probar: que cada pantalla carga la suya (ninguna rota), que
 * no queda ninguna provisional, y que la de sin conexion y error esta
 * precacheada por el service worker y se ve sin red, dentro del presupuesto.
 */
test.beforeEach(reiniciarMock);

const CACHE_SW = "latidos-shell-v18";
const SIN_SENAL = "/ilustraciones/latido-ecg-ruido.webp";

/** Imagenes de la pagina que no cargaron. */
const imagenesRotas = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.getAttribute("src")),
  );

/** Las fuentes de todas las imagenes de la pagina, decodificadas. */
const fuentes = (page: Page) =>
  page.evaluate(() => Array.from(document.images).map((img) => decodeURIComponent(img.currentSrc || img.src)));

async function esperarServiceWorker(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(async () => Boolean(await (await caches.open("latidos-shell-v18")).match("/ilustraciones/latido-ecg-ruido.webp"))))
    .toBe(true);
}

test("el onboarding usa las tres ilustraciones nuevas, sin repetir", async ({ page }) => {
  await completarRegistro(page);
  await confirmarCorreo(page);

  const vistas: string[] = [];
  for (const [pantalla, nombre] of [
    [1, "corazon-latido"],
    [2, "caja-corazon"],
    [3, "figura-amarilla-corazon"],
  ] as const) {
    if (pantalla > 1) {
      await page.getByRole("button", { name: "Siguiente" }).click();
      await page.waitForURL(`**/pantalla-${pantalla}`);
    }
    const imagen = page.locator(`img[src*='${nombre}']`);
    await expect(imagen).toBeVisible();
    await expect(imagen).not.toHaveAttribute("alt", "");
    await expect.poll(() => imagenesRotas(page)).toEqual([]);
    vistas.push(nombre);
  }
  expect(new Set(vistas).size).toBe(3);
  // Nada de las provisionales.
  expect((await fuentes(page)).filter((f) => f.includes("/assets/ilustraciones/"))).toEqual([]);
});

test("las fases de Inicio llevan su ilustracion, con carga diferida", async ({ page }) => {
  await cuentaEnInicio(page);
  // Las fases viven en el acordeon "Qué es Latidos", cerrado al entrar.
  await page.getByRole("heading", { level: 2, name: /Qué es Latidos/ }).getByRole("button").click();
  const fases = page.getByRole("list", { name: "Fases del programa" }).getByRole("listitem");
  const esperadas = ["donaciones-cajas-bandera", "corazon-gorro-navidad", "estadio-beisbol"];
  for (let i = 0; i < 3; i++) {
    const imagen = fases.nth(i).locator("img");
    await expect(imagen).toHaveAttribute("src", new RegExp(esperadas[i]));
    await expect(imagen).toHaveAttribute("loading", "lazy");
    await expect(imagen).toHaveAttribute("width", /\d+/);
    // 70px sobre un panel celeste de 84 (Inicio v2.6.0).
    await expect(imagen).toHaveAttribute("height", "70");
    await imagen.scrollIntoViewIfNeeded();
    await expect
      .poll(() => imagen.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  }
});

test("sin red, la pantalla de sin conexion carga su ilustracion precacheada", async ({ page, context }) => {
  // Nunca se abrio /sin-conexion con red: solo puede salir de lo precacheado.
  await cuentaEnInicio(page);
  await esperarServiceWorker(page);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await cortarRed(context);
  await page.goto("/inicio").catch(() => null);
  await expect(page.getByRole("heading", { name: "Te quedaste sin señal" })).toBeVisible();
  const imagen = page.locator("img[data-ilustracion='latido-ecg-ruido']");
  await expect(imagen).toHaveAttribute("src", SIN_SENAL);
  await expect
    .poll(() => imagen.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  await volverRed(context);
});

test("la ilustracion de la pantalla de error se sirve sin red", async ({ page, context }) => {
  // La pantalla de error (src/app/error.tsx) usa el mismo archivo, pedido por
  // su ruta tal cual: se comprueba que sin red el service worker lo entrega.
  await cuentaEnInicio(page);
  await esperarServiceWorker(page);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await cortarRed(context);
  const resultado = await page.evaluate(async (ruta) => {
    const img = new Image();
    img.src = ruta;
    await img.decode().catch(() => null);
    return { ancho: img.naturalWidth };
  }, SIN_SENAL);
  expect(resultado.ancho).toBe(480);
  await volverRed(context);
});

test("lo precacheado de ilustraciones no pasa de 400 KB: la de sin señal y las de la pantalla 1 de la bienvenida", async ({ page }) => {
  await page.goto("/");
  await esperarServiceWorker(page);
  const precacheadas = await page.evaluate(async (nombre) => {
    const cache = await caches.open(nombre);
    const salida: { ruta: string; bytes: number }[] = [];
    for (const peticion of await cache.keys()) {
      const ruta = new URL(peticion.url).pathname;
      if (!ruta.startsWith("/ilustraciones/")) continue;
      const respuesta = await cache.match(peticion);
      salida.push({ ruta, bytes: (await respuesta!.arrayBuffer()).byteLength });
    }
    return salida;
  }, CACHE_SW);
  // v2.10.0 (service worker v11): ademas de la de sin señal, el arte de la
  // primera pintura de la bienvenida. Las pantallas 2 a 4 se guardan en uso.
  // La precarga en reposo de la pantalla 2 puede guardar su arte en uso si el
  // service worker ya controla la pagina: eso no es precache y no cuenta.
  const enUso = ["/ilustraciones/estadio-ucv.webp", "/ilustraciones/parlante-corazones.webp"];
  const soloPrecache = precacheadas.filter((p) => !enUso.includes(p.ruta));
  expect(soloPrecache.map((p) => p.ruta).sort()).toEqual(
    [
      SIN_SENAL,
      "/ilustraciones/circulos-pulso-bienvenida.webp",
      "/ilustraciones/corazon-latido-bienvenida.webp",
      "/ilustraciones/ecg-pulso-ancho.webp",
    ].sort(),
  );
  expect(soloPrecache.reduce((t, p) => t + p.bytes, 0)).toBeLessThanOrEqual(400 * 1024);
  // Y la cache vieja del service worker anterior no queda.
  const nombres = await page.evaluate(() => caches.keys());
  expect(nombres.filter((n) => n.startsWith("latidos-") && n !== CACHE_SW)).toEqual([]);
});

test("una direccion que no existe muestra el 404 con su ilustracion", async ({ page }) => {
  const respuesta = await page.goto("/esta-no-existe");
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Por aquí no es" })).toBeVisible();
  await expect(page.locator("img[src*='nubes-techo']")).toBeVisible();
  await expect.poll(() => imagenesRotas(page)).toEqual([]);
  await expect(page.getByRole("link", { name: "Ir a Inicio" })).toBeVisible();
});

test("las provisionales ya no existen en el servidor", async ({ request }) => {
  for (const ruta of [
    "/assets/ilustraciones/onboarding-1-comunidad-recortada.webp",
    "/assets/estados-vacios/vacio-sin-conexion.webp",
    "/assets/fondos/fondo-banner-publicitario-slot.webp",
  ]) {
    expect((await request.get(ruta)).status(), ruta).toBe(404);
  }
  // Los originales hd no se publican.
  expect((await request.get("/recursos/ilustraciones/hd/estadio-beisbol.webp")).status()).toBe(404);
});
