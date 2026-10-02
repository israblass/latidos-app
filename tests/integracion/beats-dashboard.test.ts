import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { auditar, informe } from "../ayudantes/accesibilidad";
import { abrirBeats, cuentaConId, lineaDelDia, lineasDeDias, MARCA_KFC, MARCA_PEPSI } from "../ayudantes/beats";
import { cambiarMarca, moverMovimientos, reiniciarMock, sembrarMovimiento } from "../ayudantes/mock";
import { marcasDelHistorial, metricasDeLaSemana } from "../../src/lib/beats/dashboard";
import { tituloDia } from "../../src/lib/beats/formato";
import type { DiaHistorial, Movimiento, TipoMovimiento } from "../../src/types/beats";

/**
 * Dashboard de Beats (constitution §2, v2.8.0): hero navy, "Tu pulso", marcas,
 * historial en acordeon y "Cómo ganar". Viewport de la referencia (390).
 */
test.use({ viewport: { width: 390, height: 844 } });

test.describe("metricas y marcas (sin pantalla)", () => {
  let n = 0;
  const mov = (
    tipo: TipoMovimiento,
    beats: number,
    ocurrido_en: string,
    marca: string | null = null,
    logo: string | null = null,
  ): Movimiento => ({
    id: `m${n++}`,
    tipo,
    beats,
    ocurrido_en,
    marca: marca ? { nombre: marca, logo_url: logo } : null,
  });
  const dia = (dia_local: string, movimientos: Movimiento[]): DiaHistorial => ({
    dia_local,
    total_neto: movimientos.reduce((t, m) => t + m.beats, 0),
    escaneos: movimientos.filter((m) => m.tipo === "escaneo").length,
    movimientos,
  });
  // Jueves 1 de octubre de 2026, 12:00 en Caracas (16:00 UTC).
  const AHORA = new Date("2026-10-01T16:00:00Z");

  test("semana vacia: todo en cero", () => {
    expect(metricasDeLaSemana([], AHORA)).toEqual({ beats: 0, escaneos: 0, marcas: 0, diasActivos: 0 });
    // Con historial, pero todo de hace mas de 7 dias.
    const viejo = [dia("2026-09-24", [mov("escaneo", 10, "2026-09-24T19:00:00Z", "KFC")])];
    expect(metricasDeLaSemana(viejo, AHORA)).toEqual({ beats: 0, escaneos: 0, marcas: 0, diasActivos: 0 });
  });

  test("escaneos de marca, marcas distintas, dias activos y total semanal", () => {
    const dias = [
      dia("2026-10-01", [
        mov("escaneo", 15, "2026-10-01T15:00:00Z", "KFC"),
        mov("bienvenida", 10, "2026-10-01T14:00:00Z"),
      ]),
      dia("2026-09-30", [
        mov("escaneo", 20, "2026-09-30T19:00:00Z", "Pepsi"),
        mov("escaneo", 5, "2026-09-30T18:00:00Z", "KFC"),
      ]),
      // Hace 6 dias: entra. Solo un regalo: dia activo, pero no escaneo.
      dia("2026-09-25", [mov("regalo", 3, "2026-09-25T19:00:00Z")]),
      // Hace 7 dias: ya no entra.
      dia("2026-09-24", [mov("escaneo", 50, "2026-09-24T19:00:00Z", "Movistar")]),
    ];
    expect(metricasDeLaSemana(dias, AHORA)).toEqual({
      beats: 15 + 10 + 20 + 5 + 3,
      escaneos: 3,
      marcas: 2,
      diasActivos: 3,
    });
  });

  test("la bienvenida y los movimientos de Latidos no son marca ni escaneo de marca", () => {
    const dias = [
      dia("2026-10-01", [
        mov("bienvenida", 5, "2026-10-01T14:00:00Z"),
        mov("regalo", 4, "2026-10-01T13:00:00Z"),
        mov("ajuste", -2, "2026-10-01T12:00:00Z"),
        // Un escaneo sin marca (no deberia pasar) tampoco cuenta como marca.
        mov("escaneo", 7, "2026-10-01T11:00:00Z", null),
      ]),
    ];
    expect(metricasDeLaSemana(dias, AHORA)).toEqual({ beats: 14, escaneos: 0, marcas: 0, diasActivos: 1 });
    expect(marcasDelHistorial(dias)).toEqual([]);
  });

  test("el cambio de dia es a medianoche de Caracas, no del telefono ni de UTC", () => {
    const dias = [dia("2026-09-24", [mov("escaneo", 10, "2026-09-25T03:30:00Z", "KFC")])];
    // 2 de octubre 03:30 UTC = 1 de octubre 23:30 en Caracas: la semana va del
    // 25 de septiembre al 1 de octubre y el 24 queda fuera.
    expect(metricasDeLaSemana(dias, new Date("2026-10-02T03:30:00Z")).escaneos).toBe(0);
    // 1 de octubre 03:30 UTC = 30 de septiembre 23:30 en Caracas: la semana
    // empieza el 24, que entra.
    expect(metricasDeLaSemana(dias, new Date("2026-10-01T03:30:00Z")).escaneos).toBe(1);
    // Un minuto despues de medianoche de Caracas (04:01 UTC) ya es el 1: el 24 sale.
    expect(metricasDeLaSemana(dias, new Date("2026-10-01T04:01:00Z")).escaneos).toBe(0);
  });

  test("agrupado por marca: escaneos, total, logo y orden por lo mas reciente", () => {
    const dias = [
      dia("2026-10-01", [
        mov("escaneo", 15, "2026-10-01T15:00:00Z", "KFC"),
        mov("bienvenida", 10, "2026-10-01T14:00:00Z"),
      ]),
      dia("2026-09-28", [
        mov("escaneo", 20, "2026-09-28T19:00:00Z", "Pepsi", "/pepsi.png"),
        mov("escaneo", 5, "2026-09-28T18:00:00Z", "KFC", "/kfc.png"),
      ]),
      // Fuera de la semana: el carrusel cubre todo el historial cargado.
      dia("2026-09-10", [mov("escaneo", 8, "2026-09-10T19:00:00Z", "Movistar")]),
    ];
    expect(marcasDelHistorial(dias)).toEqual([
      { nombre: "KFC", logo_url: "/kfc.png", escaneos: 2, beats: 20 },
      { nombre: "Pepsi", logo_url: "/pepsi.png", escaneos: 1, beats: 20 },
      { nombre: "Movistar", logo_url: null, escaneos: 1, beats: 8 },
    ]);
  });
});

test.describe("en pantalla", () => {
  test.beforeEach(reiniciarMock);

  const hoja = (page: Page) => page.getByRole("dialog", { name: "¿Cómo gano Beats?" });
  const pildora = (page: Page) => page.getByRole("button", { name: "¿Cómo gano Beats?" });
  const comoGanar = (page: Page) => page.getByRole("button", { name: "Cómo ganar" });
  const carrusel = (page: Page) => page.getByRole("list", { name: "Marcas donde has sumado" });
  const tarjetasDeMarca = (page: Page) => carrusel(page).locator("li[data-marca]");

  async function conDatos(page: Page) {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 15, marcaId: MARCA_KFC });
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 20, diasAtras: 1, marcaId: MARCA_PEPSI });
    await abrirBeats(page);
    return id;
  }

  test("con datos: cabecera, tarjeta de vidrio con saldo, chip y Tu pulso, y marcas", async ({ page }) => {
    await conDatos(page);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/^Tus\s*Beats$/);
    await expect(page.getByRole("heading", { level: 1, name: "Tus Beats" })).toHaveCount(1);
    for (const nombre of ["Tu pulso · Últimos 7 días", "Marcas", "Historial"]) {
      await expect(page.getByRole("heading", { level: 2, name: nombre })).toBeVisible();
    }

    // v2.9.0: una sola tarjeta de vidrio, region con nombre, con el saldo y
    // "Tu pulso" adentro.
    const tarjeta = page.getByRole("region", { name: "Tu balance de Beats" });
    await expect(tarjeta).toHaveCount(1);
    await expect(tarjeta).toHaveClass(/(^|\s)vidrio(\s|$)/);
    expect(await tarjeta.evaluate((el) => getComputedStyle(el).backdropFilter)).toContain("blur(24px)");
    await expect(tarjeta).toHaveCSS("border-top-left-radius", "30px");
    await expect(tarjeta.getByText("Beats acumulados")).toHaveCSS("color", "rgb(86, 94, 109)");
    await expect(tarjeta.locator("[data-chip-semana]")).toHaveText("+40 esta semana");
    const numero = tarjeta.locator("p.font-display");
    await expect(numero).toHaveText("40");
    await expect(numero).toHaveCSS("color", "rgb(26, 35, 50)");
    await expect(numero).toHaveCSS("font-size", "68px");

    const pulso = tarjeta.locator("[data-tu-pulso]");
    await expect(pulso.getByRole("heading", { name: "Tu pulso · Últimos 7 días" })).toHaveCSS("font-size", "12px");
    await expect(pulso.getByRole("heading", { name: "Tu pulso · Últimos 7 días" })).toHaveCSS("font-weight", "600");
    // La cifra semanal vive solo en el chip: no hay un "+40 Beats" aparte.
    await expect(page.locator("[data-pulso-beats]")).toHaveCount(0);
    await expect(page.getByText("+40", { exact: true })).toHaveCount(0);
    await expect(page.locator("[data-hero-beats]")).toHaveCount(0);
    const valores = await pulso.locator("dd").allTextContents();
    const etiquetas = await pulso.locator("dt").allTextContents();
    expect(etiquetas).toEqual(["Escaneos", "Marcas", "Días activos"]);
    expect(valores).toEqual(["2", "2", "2"]);
    // El ECG: dentro de la tarjeta, decorativo, con tamaño fijo y cargado.
    const ecg = tarjeta.locator("img[data-ecg-pulso]");
    await expect(ecg).toHaveAttribute("alt", "");
    await expect(ecg).toHaveAttribute("width", "640");
    await expect(ecg).toHaveAttribute("height", "218");
    await expect.poll(() => ecg.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);

    await expect(tarjetasDeMarca(page)).toHaveCount(2);
    await expect(tarjetasDeMarca(page).nth(0)).toContainText("KFC");
    await expect(tarjetasDeMarca(page).nth(0)).toContainText("1 escaneo");
    await expect(tarjetasDeMarca(page).nth(0)).toContainText("+15");
    await expect(tarjetasDeMarca(page).nth(1)).toContainText("Pepsi");
    await expect(tarjetasDeMarca(page).nth(1)).toContainText("+20");
    // La bienvenida no es una marca.
    await expect(carrusel(page)).not.toContainText("Bienvenida");
    // El carrusel nace al principio, no pegado a "Descubre más".
    await page.waitForTimeout(300);
    expect(await carrusel(page).evaluate((el) => el.scrollLeft)).toBe(0);
  });

  test("el ECG no mueve el layout al cargar", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 15, marcaId: MARCA_KFC });
    // La imagen llega tarde a proposito.
    await page.route("**/ilustraciones/ecg-pulso.webp", async (ruta) => {
      await new Promise((r) => setTimeout(r, 800));
      await ruta.continue();
    });
    await page.goto("/beats");
    await lineasDeDias(page).first().waitFor();
    const ecg = page.locator("img[data-ecg-pulso]");
    const antes = (await page.getByRole("heading", { level: 2, name: "Marcas" }).boundingBox())!.y;
    const altoAntes = (await ecg.boundingBox())!.height;
    await expect.poll(() => ecg.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    const despues = (await page.getByRole("heading", { level: 2, name: "Marcas" }).boundingBox())!.y;
    expect(altoAntes).toBeGreaterThan(90);
    // Mismo lugar (con margen de redondeo de subpixel).
    expect(Math.abs(despues - antes)).toBeLessThan(0.5);
  });

  test("una marca con logo usa el logo en su tarjeta", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 15, marcaId: MARCA_KFC });
    await cambiarMarca(MARCA_KFC, { logo_url: "/favicon-32.png" });
    await abrirBeats(page);
    const tarjeta = tarjetasDeMarca(page).first();
    await expect(tarjeta.locator("img[src='/favicon-32.png']")).toBeVisible();
    await expect(tarjeta.locator("img")).toHaveAttribute("alt", "");
  });

  test("sin datos en la semana: ceros, solo Descubre más y sin errores", async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    const { id } = await cuentaConId(page);
    // La bienvenida pasa a hace 10 dias: la semana queda vacia.
    await moverMovimientos(id, 10);
    await abrirBeats(page);
    const tarjeta = page.getByRole("region", { name: "Tu balance de Beats" });
    await expect(tarjeta.locator("p.font-display")).toHaveText("5");
    await expect(tarjeta.locator("img[data-ecg-pulso]")).toBeVisible();
    expect(await tarjeta.locator("[data-tu-pulso] dd").allTextContents()).toEqual(["0", "0", "0"]);
    await expect(page.locator("[data-pulso-beats]")).toHaveCount(0);
    await expect(page.locator("[data-chip-semana]")).toHaveCount(0);
    await expect(carrusel(page).getByRole("listitem")).toHaveCount(1);
    await expect(carrusel(page).getByRole("link", { name: /Descubre más/ })).toBeVisible();
    await expect(page.getByText(/algo salió mal|error/i)).toHaveCount(0);
    expect(errores).toEqual([]);
  });

  test("Descubre más lleva a /escanear", async ({ page }) => {
    await conDatos(page);
    const enlace = carrusel(page).getByRole("link", { name: /Descubre más/ });
    await expect(enlace).toHaveAttribute("href", "/escanear");
    await expect(enlace).toContainText("Escanea una marca");
    await enlace.click();
    await page.waitForURL("**/escanear**");
  });

  test("el carrusel se recorre con teclado: foco, flechas y Tab hasta Descubre más", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 15, marcaId: MARCA_KFC });
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 20, diasAtras: 1, marcaId: MARCA_PEPSI });
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 9, diasAtras: 2, marcaId: "a1000000-0000-4000-8000-000000000003" });
    await abrirBeats(page);
    await expect(tarjetasDeMarca(page)).toHaveCount(3);
    const lista = carrusel(page);
    await lista.focus();
    await expect(lista).toBeFocused();
    expect(await lista.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => lista.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    // Tab sale de la lista al enlace del final, y sigue de largo: sin trampa.
    await page.keyboard.press("Tab");
    await expect(lista.getByRole("link", { name: /Descubre más/ })).toBeFocused();
    await page.keyboard.press("Tab");
    expect(await lista.evaluate((el) => el.contains(document.activeElement))).toBe(false);
  });

  test("historial en acordeon: Hoy abierto, abrir Ayer y cerrarlo", async ({ page }) => {
    await conDatos(page);
    const hoy = lineaDelDia(page, "Hoy");
    const ayer = lineaDelDia(page, "Ayer");
    await expect(hoy).toHaveAttribute("aria-expanded", "true");
    await expect(hoy).toContainText("2 movimientos · +20");
    await expect(ayer).toHaveAttribute("aria-expanded", "false");
    await expect(ayer).toContainText("1 movimiento · +20");
    // Cada dia es un h3 (la seccion tiene su h2) con el boton adentro.
    await expect(page.getByRole("heading", { level: 3, name: /^Hoy/ }).getByRole("button")).toHaveCount(1);

    const regionAyer = page.locator(`[id="${await ayer.getAttribute("aria-controls")}"]`);
    await expect(regionAyer).toHaveAttribute("inert", "");
    await expect(regionAyer).toHaveAttribute("aria-hidden", "true");

    await ayer.click();
    await expect(ayer).toHaveAttribute("aria-expanded", "true");
    await expect(regionAyer).not.toHaveAttribute("inert", /.*/);
    await expect(regionAyer.getByRole("listitem")).toContainText(["Pepsi"]);
    // Abrir uno no cierra el otro.
    await expect(hoy).toHaveAttribute("aria-expanded", "true");

    await ayer.focus();
    await page.keyboard.press("Enter");
    await expect(ayer).toHaveAttribute("aria-expanded", "false");
    await expect(regionAyer).toHaveAttribute("inert", "");
  });

  test("con prefers-reduced-motion el historial abre sin transicion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await conDatos(page);
    const region = page.locator(`[id="${await lineaDelDia(page, "Ayer").getAttribute("aria-controls")}"]`);
    // La regla global de movimiento reducido deja 0.01ms: nada que se vea.
    const duracion = await region.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
    expect(duracion).toBeLessThan(0.001);
  });

  test("la hoja de Cómo ganar abre desde la pildora y desde el boton, y cierra con Escape", async ({ page }) => {
    await conDatos(page);
    // La pildora navy de la cabecera, la de siempre: una sola.
    await expect(pildora(page)).toHaveCount(1);
    await expect(pildora(page)).toHaveCSS("background-color", "rgb(26, 35, 50)");
    const caja = (await pildora(page).boundingBox())!;
    expect(Math.round(caja.width)).toBe(108);
    expect(Math.round(caja.height)).toBe(58);

    await pildora(page).click();
    await expect(hoja(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(hoja(page)).toHaveCount(0);
    await expect(pildora(page)).toBeFocused();

    await comoGanar(page).scrollIntoViewIfNeeded();
    // Pildora blanca con borde y el circulo navy con flecha amarilla.
    await expect(comoGanar(page)).toHaveCSS("background-color", "rgb(255, 255, 255)");
    expect((await comoGanar(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(comoGanar(page).locator(".circulo-flecha")).toHaveCSS("background-color", "rgb(26, 35, 50)");
    await comoGanar(page).focus();
    await page.keyboard.press("Enter");
    await expect(hoja(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(hoja(page)).toHaveCount(0);
    await expect(comoGanar(page)).toBeFocused();
  });

  test("tituloDia: Hoy, Ayer y la fecha en tipo oracion", () => {
    const ahora = new Date("2026-10-01T16:00:00Z");
    expect(tituloDia("2026-10-01", ahora)).toBe("Hoy");
    expect(tituloDia("2026-09-30", ahora)).toBe("Ayer");
    expect(tituloDia("2026-09-23", ahora)).toBe("Miércoles 23 sept");
  });

  async function sinViolaciones(page: Page, caso: string) {
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`), caso).toEqual([]);
    const hallazgos = await auditar(page);
    expect(hallazgos, informe(caso, hallazgos)).toEqual([]);
  }

  test("axe y auditoria sin violaciones con datos y con un dia abierto", async ({ page }) => {
    await conDatos(page);
    await sinViolaciones(page, "beats con datos");
    await lineaDelDia(page, "Ayer").click();
    await sinViolaciones(page, "beats con Ayer abierto");
  });

  test("axe y auditoria sin violaciones sin datos en la semana", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await moverMovimientos(id, 10);
    await abrirBeats(page);
    await sinViolaciones(page, "beats sin datos en la semana");
  });
});
