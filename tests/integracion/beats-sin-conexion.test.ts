import { expect, test, type Page } from "@playwright/test";

import { abrirBeats, cuentaConId, numeroDeBeats } from "../ayudantes/beats";
import { completarRegistro, confirmarCorreo, cuentaEnInicio, datosDeRegistro } from "../ayudantes/cuenta";
import { reiniciarMock, sembrarMovimiento, simularFalla } from "../ayudantes/mock";
import { QR } from "../ayudantes/qr";
import { cortarRed, volverRed } from "../ayudantes/red";

/**
 * T045 — sin conexion y errores (Fase 5, V024 a V029).
 *
 * Usa el service worker de verdad (public/sw.js) y el modo sin red de
 * Playwright. Lo que no se puede ver aqui: el comportamiento del service
 * worker en Safari de iOS y en Android reales, que se revisa en T052.
 */
test.beforeEach(reiniciarMock);

const aviso = (page: Page) => page.locator("[data-aviso-beats]");

/** Imagenes visibles que no cargaron (sin red, las que no estan guardadas). */
const imagenesRotas = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.images)
      .filter((i) => i.getBoundingClientRect().width > 0 && (!i.complete || i.naturalWidth === 0))
      .map((i) => i.getAttribute("src")),
  );
const CACHE_SW = "latidos-shell-v13";

/**
 * Deja la pantalla lista para abrirse sin red: el service worker controlando
 * la pagina, sus archivos estaticos guardados y la copia del HTML de /beats.
 */
async function prepararCopia(page: Page) {
  await abrirBeats(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  // La primera carga no pasa por el service worker (se registra despues);
  // la segunda si, y es la que deja guardados HTML y archivos.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.reload();
  await expect(numeroDeBeats(page)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((nombre) => caches.open(nombre).then((c) => c.match("/beats")).then(Boolean), CACHE_SW),
    )
    .toBe(true);
  // Y la copia de datos en el dispositivo.
  await expect
    .poll(() =>
      page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("latidos:beats:")).length),
    )
    .toBe(1);
}

test("sin red abre con lo guardado y el aviso con la hora", async ({ page, context }) => {
  // V024 y criterio 23.
  const { id } = await cuentaConId(page);
  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 20, diasAtras: 1 });
  await prepararCopia(page);

  await cortarRed(context);
  const respuesta = await page.reload();
  // Es la copia del service worker, no el servidor: la copia se guarda solo
  // con content-type, sin las cabeceras que agrega Next.
  expect(respuesta?.headers()["x-powered-by"]).toBeUndefined();

  await expect(numeroDeBeats(page)).toHaveText("25");
  await expect(page.getByText("Regalo Latidos")).toHaveCount(1);
  await expect(aviso(page)).toHaveAttribute("data-aviso-beats", "sin-conexion");
  await expect(aviso(page)).toHaveText(/^Sin conexión\. Así estaban tus Beats a las \d{1,2}:\d{2} (am|pm)\.$/);
  // Los iconos (barra, filas) salen de lo guardado, no quedan rotos.
  await expect.poll(() => imagenesRotas(page)).toEqual([]);
  // La linea de latido de "Tu pulso" (v2.8.0) se guarda con la copia de
  // /beats y se ve sin red.
  const ecg = page.locator("img[data-ecg-pulso]");
  await expect.poll(() => ecg.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  expect(
    await page.evaluate(
      (nombre) => caches.open(nombre).then((c) => c.match("/ilustraciones/ecg-pulso.webp")).then(Boolean),
      CACHE_SW,
    ),
  ).toBe(true);
  await volverRed(context);
});

test("si la copia es de ayer, el aviso lo dice", async ({ page, context }) => {
  await cuentaEnInicio(page);
  await prepararCopia(page);

  // La ultima carga buena fue ayer a las 9:10 pm de Caracas.
  await page.evaluate(() => {
    const clave = Object.keys(localStorage).find((k) => k.startsWith("latidos:beats:"))!;
    const copia = JSON.parse(localStorage.getItem(clave)!);
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
    const [a, m, d] = hoy.split("-").map(Number);
    copia.actualizado_en = new Date(Date.UTC(a, m - 1, d - 1, 21 + 4, 10)).toISOString();
    localStorage.setItem(clave, JSON.stringify(copia));
  });

  await cortarRed(context);
  await page.reload();
  await expect(aviso(page)).toHaveText("Sin conexión. Así estaban tus Beats ayer, 9:10 pm.");
  await volverRed(context);
});

test("al volver la red se actualiza sola y el aviso desaparece", async ({ page, context }) => {
  // V025 y criterio 24.
  const { id } = await cuentaConId(page);
  await prepararCopia(page);

  await cortarRed(context);
  await page.reload();
  await expect(aviso(page)).toBeVisible();

  // Mientras no habia red, el equipo le regalo Beats.
  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 30 });
  await volverRed(context);

  await expect(numeroDeBeats(page)).toHaveText("35");
  await expect(aviso(page)).toHaveCount(0);
  await expect(page.getByText("Regalo Latidos")).toBeVisible();
});

test("sin red y sin nada guardado: la pantalla completa de sin conexion", async ({ page, context }) => {
  // V026 y criterio 25: el HTML de la pantalla esta en el telefono, pero no
  // hay datos guardados (nunca cargo con esta cuenta, o se cerro la sesion).
  await cuentaEnInicio(page);
  await prepararCopia(page);
  await page.evaluate(() => localStorage.clear());

  await cortarRed(context);
  await page.reload();
  const pantalla = page.getByRole("region", { name: "Sin conexión" });
  await expect(pantalla).toContainText(
    "Necesitas conexión para ver tus Beats por primera vez. Vuelve a intentarlo cuando tengas señal.",
  );
  await expect(pantalla.locator("img[src*='latido-ecg-ruido']")).toBeVisible();
  // La ilustracion solo se ve sin red: el service worker la guardo con la copia.
  await expect.poll(() => imagenesRotas(page)).toEqual([]);
  await expect(numeroDeBeats(page)).toHaveCount(0);

  // Al volver la señal carga la pantalla normal.
  await volverRed(context);
  await expect(numeroDeBeats(page)).toHaveText("5");
});

test("sin red y sin la copia de la pantalla, el service worker muestra sin conexion", async ({
  page,
  context,
}) => {
  // La persona nunca abrio Beats en este telefono: no hay HTML guardado.
  await cuentaEnInicio(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await cortarRed(context);
  await page.goto("/beats").catch(() => null);
  await expect(page.getByText("Te quedaste sin señal")).toBeVisible();
  await volverRed(context);
});

test("con red pero con la carga fallando: 'No pudimos actualizar' y Reintentar", async ({ page }) => {
  // V027 y criterio 26.
  const { id } = await cuentaConId(page);
  await prepararCopia(page);

  await simularFalla("historial_beats", true);
  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 10 });
  await page.reload();

  // Lo guardado sigue a la vista, con el aviso.
  await expect(aviso(page)).toHaveAttribute("data-aviso-beats", "error");
  await expect(aviso(page)).toContainText("No pudimos actualizar.");
  await expect(page.getByText("Bienvenida a Latidos")).toBeVisible();

  await simularFalla("historial_beats", false);
  await aviso(page).getByRole("button", { name: "Reintentar" }).click();
  await expect(aviso(page)).toHaveCount(0);
  await expect(page.getByText("Regalo Latidos")).toBeVisible();
  await expect(numeroDeBeats(page)).toHaveText("15");
});

test("sin nada guardado y con la carga fallando, el mensaje va en lugar del historial", async ({
  page,
}) => {
  await cuentaEnInicio(page);
  await simularFalla("historial_beats", true);
  await page.goto("/beats");

  const historial = page.getByRole("region", { name: "Historial de Beats" });
  await expect(historial).toContainText("No pudimos actualizar.");
  await simularFalla("historial_beats", false);
  await historial.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByText("Bienvenida a Latidos")).toBeVisible();
});

test("otra cuenta en el mismo navegador nunca ve los Beats de la anterior", async ({ page, context }) => {
  // V028 y criterio 27.
  const { id: primera } = await cuentaConId(page);
  await sembrarMovimiento({ usuarioId: primera, tipo: "regalo", beats: 72 }); // saldo 77
  await abrirBeats(page);
  await expect(numeroDeBeats(page)).toHaveText("77");
  await expect
    .poll(() => page.evaluate((id) => Boolean(localStorage.getItem(`latidos:beats:${id}`)), primera))
    .toBe(true);

  // Se va la sesion (lo mismo que dejaria un cierre de sesion) y entra otra
  // persona en el mismo navegador. Se graba todo numero que llegue a pintarse.
  await context.clearCookies();
  await page.addInitScript(() => {
    const vistos: string[] = [];
    (window as unknown as { __vistos: string[] }).__vistos = vistos;
    new MutationObserver(() => {
      document
        .querySelectorAll("section[aria-label='Tu balance de Beats'] p.font-display")
        .forEach((n) => vistos.push(n.textContent ?? ""));
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await completarRegistro(page, datosDeRegistro());
  await confirmarCorreo(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");
  await abrirBeats(page);
  await expect(numeroDeBeats(page)).toHaveText("5");

  const vistos = await page.evaluate(() => (window as unknown as { __vistos: string[] }).__vistos);
  expect(vistos).not.toContain("77");
  // Y la copia de la cuenta anterior ya no esta en el navegador.
  expect(await page.evaluate((id) => localStorage.getItem(`latidos:beats:${id}`), primera)).toBeNull();
});

test("el service worker v4 no rompe el registro ni el escaneo", async ({ page }) => {
  // V029: con el service worker controlando la pagina, los flujos de siempre.
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await completarRegistro(page);
  await confirmarCorreo(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");

  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
  await page.getByRole("button", { name: "Volver a Inicio" }).click();
  await page.waitForURL("**/inicio");

  const nombres = await page.evaluate(() => caches.keys());
  expect(nombres).toContain(CACHE_SW);
  expect(nombres.filter((n) => n.startsWith("latidos-") && n !== CACHE_SW)).toEqual([]);
});
