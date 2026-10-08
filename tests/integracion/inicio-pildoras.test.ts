import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { auditar, informe } from "../ayudantes/accesibilidad";
import { cuentaConId } from "../ayudantes/beats";
import { cuentaEnInicio, datosDeRegistro } from "../ayudantes/cuenta";
import { reiniciarMock, sembrarMovimiento } from "../ayudantes/mock";
import { beatsDeLaSemana, movimientosRecientes } from "../../src/lib/beats/actividad";
import type { DiaHistorial } from "../../src/types/beats";

/**
 * Inicio de la v2.6.0, pulido en la v2.7.0: pildoras de cabecera (campana y
 * avatar), saludo, tarjeta de Beats en vidrio con el chip de la semana,
 * Escanear QR y los acordeones de actividad y "Qué es Latidos". Viewport de la
 * referencia aprobada (390 de ancho).
 */
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(reiniciarMock);

const campana = (page: Page) => page.getByRole("button", { name: "Notificaciones" });
const perfil = (page: Page) => page.getByRole("main").getByRole("link", { name: "Ir a tu perfil" });
const acordeon = (page: Page, titulo: string) =>
  page.getByRole("heading", { level: 2, name: new RegExp(titulo) }).getByRole("button");
const chip = (page: Page) => page.locator("[data-chip-semana]");
const KFC = "a1000000-0000-4000-8000-000000000001";

async function sinViolaciones(page: Page, caso: string) {
  const resultado = await new AxeBuilder({ page }).analyze();
  expect(
    resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
    `axe: ${caso}`,
  ).toEqual([]);
  const hallazgos = await auditar(page);
  expect(hallazgos, informe(caso, hallazgos)).toEqual([]);
}

test("pildoras de cabecera: nombre accesible, 108 x 58, campana navy y avatar de marca", async ({ page }) => {
  await cuentaEnInicio(page, datosDeRegistro({ nombre: "Israel" }));
  for (const pildora of [campana(page), perfil(page)]) {
    const caja = (await pildora.boundingBox())!;
    expect(caja.width).toBeGreaterThanOrEqual(44);
    expect(caja.height).toBeGreaterThanOrEqual(44);
    expect(Math.round(caja.width)).toBe(108);
    expect(Math.round(caja.height)).toBe(58);
  }
  await expect(campana(page)).toHaveCSS("background-color", "rgb(26, 35, 50)");
  await expect(campana(page)).toHaveAttribute("aria-haspopup", "dialog");
  // La campana es un icono de trazo, como los demas.
  await expect(campana(page).locator("svg")).toHaveAttribute("aria-hidden", "true");
  await expect(campana(page).locator("svg")).toHaveAttribute("fill", "none");

  // Avatar: el corazon con audifonos, decorativo, sobre una pildora blanca
  // translucida. Ya no muestra la inicial.
  await expect(perfil(page)).toHaveAttribute("href", "/perfil");
  await expect(perfil(page)).toHaveText("");
  await expect(perfil(page)).toHaveCSS("background-color", "rgba(255, 255, 255, 0.85)");
  await expect(perfil(page)).toHaveCSS("border-top-color", "rgba(255, 255, 255, 0.9)");
  // Tailwind antepone las sombras vacias de su anillo: se busca la nuestra.
  expect(await perfil(page).evaluate((el) => getComputedStyle(el).boxShadow)).toContain(
    "rgba(26, 35, 50, 0.08) 0px 6px 18px 0px",
  );
  const avatar = perfil(page).locator("img");
  await expect(avatar).toHaveAttribute("alt", "");
  await expect(avatar).toHaveAttribute("src", /corazon-audifonos/);
  await expect.poll(() => avatar.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  expect(Math.round((await avatar.boundingBox())!.height)).toBe(46);
  // La pildora de ayuda se fue: "Cómo gano Beats" vive en la pantalla de Beats.
  await expect(page.getByRole("button", { name: /Cómo gano Beats/ })).toHaveCount(0);
});

test("la campana abre la hoja de notificaciones con teclado, Escape la cierra y el foco vuelve", async ({ page }) => {
  await cuentaEnInicio(page);
  await campana(page).focus();
  await page.keyboard.press("Enter");
  const hoja = page.getByRole("dialog", { name: "Notificaciones" });
  await expect(hoja).toBeVisible();
  await expect(hoja).toHaveAttribute("aria-modal", "true");
  // Titulo en Anton mayusculas.
  const titulo = hoja.getByRole("heading", { name: "Notificaciones" });
  await expect(titulo).toHaveCSS("text-transform", "uppercase");
  expect(await titulo.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/Anton/i);
  // Estado vacio.
  await expect(hoja.getByText("Sin notificaciones recientes")).toBeVisible();
  await expect(hoja.getByText("Sin notificaciones recientes")).toHaveCSS("font-weight", "600");
  await expect(hoja.getByText("Cuando haya novedades de Latidos, las verás aquí.")).toHaveCSS(
    "color",
    "rgb(86, 94, 109)",
  );
  const circulo = hoja.locator("[data-notificaciones-vacio] > span").first();
  await expect(circulo).toHaveCSS("background-color", "rgba(0, 144, 255, 0.12)");
  // Lo de atras no se desplaza y el foco no se escapa de la hoja.
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    expect(await hoja.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(hoja).toHaveCount(0);
  await expect(campana(page)).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("la X cierra la hoja; el velo y la hoja quedan por encima de la barra", async ({ page }) => {
  await cuentaEnInicio(page);
  await campana(page).click();
  const hoja = page.getByRole("dialog", { name: "Notificaciones" });
  await expect(hoja).toBeVisible();
  // Lo que se ve en el centro de la barra es el velo, no la barra.
  const barra = (await page.getByRole("navigation", { name: "Principal" }).boundingBox())!;
  const encima = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x, y)?.closest("nav[aria-label='Principal']") === null,
    [barra.x + barra.width / 2, barra.y + barra.height / 2],
  );
  expect(encima).toBe(true);
  const cerrar = hoja.getByRole("button", { name: "Cerrar" });
  const caja = (await cerrar.boundingBox())!;
  expect(caja.width).toBeGreaterThanOrEqual(44);
  expect(caja.height).toBeGreaterThanOrEqual(44);
  await cerrar.click();
  await expect(hoja).toHaveCount(0);
});

test("con prefers-reduced-motion la hoja de notificaciones entra sin animacion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await cuentaEnInicio(page);
  await campana(page).click();
  const hoja = page.getByRole("dialog", { name: "Notificaciones" });
  await expect(hoja).toBeVisible();
  expect(await hoja.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("la pildora de perfil lleva a Perfil", async ({ page }) => {
  await cuentaEnInicio(page);
  await perfil(page).click();
  await page.waitForURL("**/perfil");
});

test("saludo: Hola en 300 y el nombre en 700 con exclamacion, a 40 px", async ({ page }) => {
  await cuentaEnInicio(page, datosDeRegistro({ nombre: "Israel" }));
  const saludo = page.locator("[data-saludo]");
  await expect(saludo).toHaveText("Hola,Israel!");
  await expect(saludo).toHaveCSS("font-size", "40px");
  await expect(saludo).toHaveCSS("font-weight", "300");
  await expect(saludo.locator("b")).toHaveCSS("font-weight", "700");
  // DM Sans 300 y 700 cargadas de verdad, no sintetizadas.
  const cargadas = await page.evaluate(async () => {
    await document.fonts.ready;
    return Array.from(document.fonts)
      .filter((f) => f.status === "loaded" && /DM.Sans/.test(f.family))
      .map((f) => f.weight);
  });
  expect(cargadas).toEqual(expect.arrayContaining(["300", "700"]));
});

test("un nombre largo baja a 32 px y envuelve sin romper el layout", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await cuentaEnInicio(page, datosDeRegistro({ nombre: "Maximilianogregorio" }));
  const saludo = page.locator("[data-saludo]");
  await expect(saludo).toHaveCSS("font-size", "32px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const caja = (await saludo.boundingBox())!;
  expect(caja.x + caja.width).toBeLessThanOrEqual(360 - 16 + 1);
});

test("Escanear QR navega a /escanear y es el CTA de 64 px con su flecha", async ({ page }) => {
  await cuentaEnInicio(page);
  // v2.9.0: es el boton de deslizar; un toque en el circulo tambien abre.
  const control = page.getByRole("main").locator("[data-boton-deslizar]").filter({ hasText: "Escanear QR" });
  const caja = (await control.boundingBox())!;
  expect(Math.round(caja.height)).toBe(64);
  await expect(control).toHaveCSS("background-color", "rgb(253, 251, 5)");
  await expect(control).toContainText("Escanear QR");
  const circulo = page.getByRole("button", { name: /^Escanear QR/ });
  expect(Math.round((await circulo.boundingBox())!.width)).toBe(48);
  await expect(circulo).toHaveCSS("background-color", "rgb(26, 35, 50)");
  await circulo.click();
  await page.waitForURL("**/escanear");
});

test("acordeones: actividad abierta y Qué es Latidos cerrado; alternan y lo cerrado queda inert", async ({ page }) => {
  await cuentaEnInicio(page);
  const actividad = acordeon(page, "Actividad reciente");
  const queEs = acordeon(page, "Qué es Latidos");
  await expect(actividad).toHaveAttribute("aria-expanded", "true");
  await expect(queEs).toHaveAttribute("aria-expanded", "false");

  const region = async (boton: ReturnType<typeof acordeon>) =>
    page.locator(`[id="${await boton.getAttribute("aria-controls")}"]`);
  const regionQueEs = await region(queEs);
  await expect(regionQueEs).toHaveAttribute("inert", "");
  await expect(regionQueEs).toHaveAttribute("aria-hidden", "true");
  await expect(regionQueEs).toHaveAttribute("role", "region");
  // Cerrado no esta en el arbol accesible.
  await expect(page.getByRole("region", { name: "Qué es Latidos" })).toHaveCount(0);

  await queEs.click();
  await expect(queEs).toHaveAttribute("aria-expanded", "true");
  await expect(regionQueEs).not.toHaveAttribute("inert", "");
  await expect(regionQueEs).not.toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("region", { name: "Qué es Latidos" })).toBeVisible();

  await actividad.click();
  await expect(actividad).toHaveAttribute("aria-expanded", "false");
  await expect(await region(actividad)).toHaveAttribute("inert", "");
  // La transicion de alto es de 250 ms.
  expect(await regionQueEs.evaluate((r) => getComputedStyle(r).transitionDuration)).toBe("0.25s");
});

test("con prefers-reduced-motion los acordeones abren sin transicion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await cuentaEnInicio(page);
  const queEs = acordeon(page, "Qué es Latidos");
  const region = page.locator(`[id="${await queEs.getAttribute("aria-controls")}"]`);
  const duracion = await region.evaluate((r) => parseFloat(getComputedStyle(r).transitionDuration));
  expect(duracion).toBeLessThan(0.001);
  await queEs.click();
  await expect(page.getByRole("region", { name: "Qué es Latidos" })).toBeVisible();
});

test("actividad reciente: hasta 3 movimientos con su monto y Ver historial lleva a Beats", async ({ page }) => {
  const { id } = await cuentaConId(page);
  await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 15, marcaId: KFC });
  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 20, diasAtras: 1 });
  await sembrarMovimiento({ usuarioId: id, tipo: "ajuste", beats: -3, diasAtras: 2 });
  await page.reload();

  const lista = page.getByRole("list", { name: "Movimientos recientes" });
  await expect(lista.getByRole("listitem")).toHaveCount(3);
  await expect(lista).toContainText("KFC");
  await expect(lista).toContainText("+15");

  // v2.13.0: deslizable navy (lleva el circulo, asi que se desliza); un toque tambien lleva.
  const ver = page.getByRole("button", { name: "Desliza para ver tu historial" });
  await expect(page.locator("[data-boton-deslizar]").filter({ has: ver })).toHaveClass(/deslizar--navy/);
  expect((await ver.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await ver.click();
  await page.waitForURL("**/beats");
});

test("sin movimientos que mostrar: una linea discreta y ningun error", async ({ page }) => {
  const { id } = await cuentaConId(page);
  // El historial falla y no hay copia local: nunca un error a la vista.
  await page.evaluate(() => localStorage.clear());
  await page.route("**/rest/v1/rpc/historial_beats", (r) => r.fulfill({ status: 500, body: "{}" }));
  await page.reload();
  await expect(page.getByText("Aún no hay movimientos")).toBeVisible();
  await expect(page.getByText(/error|No pudimos/i)).toHaveCount(0);
  await expect(chip(page)).toHaveCount(0);
  expect(id).toBeTruthy();
});

test("el chip +N esta semana solo aparece con movimientos positivos en 7 dias", async ({ page }) => {
  const { id } = await cuentaConId(page);
  // Solo la bienvenida (+5, hoy).
  await expect(chip(page)).toHaveText("+5 esta semana");

  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 10, diasAtras: 6 });
  // Fuera de la ventana: hace 7 dias no cuenta.
  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 100, diasAtras: 7 });
  await page.reload();
  await expect(chip(page)).toHaveText("+15 esta semana");

  // Un ajuste que deja la semana en cero: el chip desaparece.
  await sembrarMovimiento({ usuarioId: id, tipo: "ajuste", beats: -15 });
  await page.reload();
  await expect(page.getByRole("list", { name: "Movimientos recientes" })).toBeVisible();
  await expect(chip(page)).toHaveCount(0);
  // Sin chip la tarjeta no cambia de alto.
  const tarjeta = page.locator("section[aria-label='Tu balance de Beats'] > a");
  expect(Math.round((await tarjeta.boundingBox())!.height)).toBeGreaterThan(100);
});

test("la tarjeta de Beats es de vidrio, con texto navy, y sigue llevando a Beats", async ({ page }) => {
  await cuentaEnInicio(page);
  const tarjeta = page.getByRole("link", { name: /Ver mis Beats. Tienes 5 Beats/ });
  // La clase central del vidrio, sin backdrop-filter propio.
  await expect(tarjeta).toHaveClass(/(^|\s)vidrio(\s|$)/);
  expect(await tarjeta.evaluate((el) => getComputedStyle(el).backdropFilter)).toContain("blur(24px)");
  await expect(tarjeta).toHaveCSS("border-top-left-radius", "30px");
  await expect(tarjeta.getByText("Beats acumulados")).toHaveCSS("color", "rgb(86, 94, 109)");
  const numero = page.locator("section[aria-label='Tu balance de Beats'] p.font-display");
  await expect(numero).toHaveText("5");
  await expect(numero).toHaveCSS("font-size", "68px");
  await expect(numero).toHaveCSS("color", "rgb(26, 35, 50)");
  await expect(page.locator(".halo-beats")).toHaveCount(0);
  await expect(page.getByText("Sigue participando para sumar más.")).toHaveCount(0);
  await tarjeta.click();
  await page.waitForURL("**/beats");
});

test("margenes laterales de 16 px", async ({ page }) => {
  await cuentaEnInicio(page);
  const tarjeta = (await page.locator("section[aria-label='Tu balance de Beats']").boundingBox())!;
  expect(Math.round(tarjeta.x)).toBe(16);
  expect(Math.round(390 - tarjeta.x - tarjeta.width)).toBe(16);
});

test("axe y auditoria sin violaciones con los acordeones cerrados y abiertos", async ({ page }) => {
  const { id } = await cuentaConId(page);
  await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 15, marcaId: KFC });
  await page.reload();
  await expect(page.getByRole("list", { name: "Movimientos recientes" })).toBeVisible();
  await sinViolaciones(page, "inicio, estado inicial");

  await acordeon(page, "Actividad reciente").click();
  await sinViolaciones(page, "inicio, todo cerrado");

  await acordeon(page, "Qué es Latidos").click();
  await sinViolaciones(page, "inicio, Qué es Latidos abierto");

  await acordeon(page, "Actividad reciente").click();
  await sinViolaciones(page, "inicio, los dos abiertos");

  await campana(page).click();
  await expect(page.getByRole("dialog", { name: "Notificaciones" })).toBeVisible();
  await sinViolaciones(page, "inicio, hoja de notificaciones");
});

test.describe("funciones de actividad (sin pantalla)", { tag: "@rapido" }, () => {
  const dia = (dia_local: string, beats: number[]): DiaHistorial => ({
    dia_local,
    total_neto: beats.reduce((a, b) => a + b, 0),
    escaneos: 0,
    movimientos: beats.map((b, i) => ({
      id: `${dia_local}-${i}`,
      tipo: "regalo",
      beats: b,
      ocurrido_en: `${dia_local}T19:00:00.000Z`,
      marca: null,
    })),
  });

  test("beatsDeLaSemana cuenta los ultimos 7 dias calendario de Caracas", () => {
    // 1 oct 2026 a las 10 pm de Caracas son las 2 am del 2 oct en UTC.
    const ahora = new Date("2026-10-02T02:00:00Z");
    const dias = [dia("2026-10-01", [5, 10]), dia("2026-09-25", [3]), dia("2026-09-24", [100])];
    expect(beatsDeLaSemana(dias, ahora)).toBe(18);
    expect(beatsDeLaSemana([dia("2026-10-01", [5, -5])], ahora)).toBe(0);
  });

  test("movimientosRecientes toma los primeros 3 en orden", () => {
    const dias = [dia("2026-10-01", [1, 2]), dia("2026-09-30", [3, 4])];
    expect(movimientosRecientes(dias).map((m) => m.beats)).toEqual([1, 2, 3]);
  });
});
