import { expect, test, type Page } from "@playwright/test";

import { abrirBeats, cuentaConId } from "../ayudantes/beats";
import { completarRegistro, confirmarCorreo, cuentaEnInicio } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";
import { QR } from "../ayudantes/qr";

/**
 * T033 — como ganar y estado inicial (Fase 3, V016 a V019).
 */
test.beforeEach(reiniciarMock);

const hoja = (page: Page) => page.getByRole("dialog", { name: "¿Cómo gano Beats?" });
const botonComoGano = (page: Page) => page.getByRole("button", { name: "Cómo ganar" });
const lineaGuia = (page: Page) => page.getByText("Escanea tu primer QR para sumar.");

/** Titulo y detalle de cada item de "como ganar", en orden, dentro de `raiz`. */
const itemsDe = async (raiz: import("@playwright/test").Locator) =>
  (await raiz.locator("li[data-estado]").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());

test.describe("estado inicial", () => {
  test("sin escaneos: explicacion desplegada, linea guia y Escanear", async ({ page }) => {
    // V016 y criterio 16.
    await cuentaEnInicio(page);
    await abrirBeats(page);

    await expect(lineaGuia(page)).toBeVisible();
    const inicial = page.getByRole("region", { name: "Cómo empezar a sumar" });
    await expect(inicial.getByRole("heading", { name: "Cómo los ganas" })).toBeVisible();
    await expect(inicial.getByText("Cada marca da distinto.")).toBeVisible();
    await expect(inicial.locator("li[data-estado='pronto']")).toHaveCount(3);
    // Y la bienvenida sigue en su dia, encima.
    await expect(page.getByText("Bienvenida a Latidos")).toBeVisible();
  });

  test("Escanear abre el escaner", async ({ page }) => {
    // Criterio 17.
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await page.getByRole("main").getByRole("link", { name: "Escanear" }).click();
    await page.waitForURL("**/escanear");
  });

  test("tras el primer escaneo la explicacion desplegada desaparece", async ({ page }) => {
    // V017 y criterio 18.
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await page.getByRole("button", { name: "Confirmar canje" }).click();
    await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();

    await abrirBeats(page);
    // KFC sale en su fila del historial y, desde la v2.8.0, en el carrusel de
    // marcas.
    await expect(page.locator(`[id^='dia-'] li`).filter({ hasText: "KFC" })).toBeVisible();
    await expect(lineaGuia(page)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Cómo empezar a sumar" })).toHaveCount(0);
    // La explicacion queda en el boton.
    await expect(botonComoGano(page)).toBeVisible();
  });

  test("otros movimientos de Latidos no cuentan como escaneo", async ({ page }) => {
    // Spec §10.8: con un regalo pero sin escaneos, sigue el estado inicial.
    const { id } = await cuentaConId(page);
    const { sembrarMovimiento } = await import("../ayudantes/mock");
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 20, diasAtras: 1 });
    await abrirBeats(page);
    await expect(lineaGuia(page)).toBeVisible();
  });
});

test.describe("hoja ¿Cómo gano Beats?", () => {
  test("muestra las dos secciones con sus Pronto", async ({ page }) => {
    // V018 y criterio 19.
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await botonComoGano(page).click();

    const dialogo = hoja(page);
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole("heading", { name: "Cómo los ganas" })).toBeVisible();
    await expect(dialogo.getByRole("heading", { name: "En qué los cambias" })).toBeVisible();
    await expect(dialogo.getByText("Cada marca da distinto.")).toBeVisible();
    for (const titulo of ["Dona insumos", "Haz voluntariado", "Asiste a actividades",
                          "Entradas al concierto", "Merch de Latidos", "Cursos universitarios"]) {
      const item = dialogo.locator("li").filter({ hasText: titulo });
      await expect(item).toHaveAttribute("data-estado", "pronto");
      await expect(item).toContainText("Pronto");
    }
  });

  test("lo marcado Pronto no hace nada al tocarlo", async ({ page }) => {
    // Criterio 20.
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await botonComoGano(page).click();

    const pronto = hoja(page).locator("li[data-estado='pronto']");
    await expect(pronto.locator("a, button")).toHaveCount(0);
    await pronto.first().click();
    await expect(hoja(page)).toBeVisible();
    await expect(page).toHaveURL(/\/beats$/);
  });

  test("el foco entra, queda atrapado y vuelve al boton al cerrar con Escape", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await botonComoGano(page).focus();
    await page.keyboard.press("Enter");
    await expect(hoja(page)).toBeVisible();

    const focoDentro = () =>
      page.evaluate(() => Boolean(document.activeElement?.closest("[role='dialog']")));
    expect(await focoDentro()).toBe(true);
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await focoDentro()).toBe(true);
    }
    await page.keyboard.press("Shift+Tab");
    expect(await focoDentro()).toBe(true);

    await page.keyboard.press("Escape");
    await expect(hoja(page)).toHaveCount(0);
    await expect(botonComoGano(page)).toBeFocused();
  });

  test("se cierra tocando fuera, con Cerrar y arrastrando hacia abajo", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);

    await botonComoGano(page).click();
    await page.mouse.click(200, 30); // arriba de la hoja, sobre el fondo
    await expect(hoja(page)).toHaveCount(0);

    await botonComoGano(page).click();
    await hoja(page).getByRole("button", { name: "Cerrar" }).click();
    await expect(hoja(page)).toHaveCount(0);

    await botonComoGano(page).click();
    const asa = await hoja(page).locator("h2").boundingBox();
    if (!asa) throw new Error("sin asa");
    await page.mouse.move(asa.x + 20, asa.y + 5);
    await page.mouse.down();
    await page.mouse.move(asa.x + 20, asa.y + 60, { steps: 5 });
    await page.mouse.move(asa.x + 20, asa.y + 200, { steps: 5 });
    await page.mouse.up();
    await expect(hoja(page)).toHaveCount(0);
  });

  test("un arrastre corto no la cierra", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await botonComoGano(page).click();
    const asa = await hoja(page).locator("h2").boundingBox();
    if (!asa) throw new Error("sin asa");
    await page.mouse.move(asa.x + 20, asa.y + 5);
    await page.mouse.down();
    await page.mouse.move(asa.x + 20, asa.y + 40, { steps: 4 });
    await page.mouse.up();
    await expect(hoja(page)).toBeVisible();
  });
});

test("la hoja y la pantalla 2 del onboarding dicen exactamente lo mismo", async ({ page }) => {
  // V019 y spec §9 regla 10.
  await completarRegistro(page);
  await confirmarCorreo(page);
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForURL("**/pantalla-2");
  const enOnboarding = await itemsDe(page.locator("body"));

  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");
  await abrirBeats(page);
  await botonComoGano(page).click();
  const enHoja = await itemsDe(hoja(page));

  expect(enHoja).toHaveLength(7);
  expect(enOnboarding).toEqual(enHoja);
});
