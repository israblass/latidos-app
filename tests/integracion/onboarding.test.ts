import { expect, test } from "@playwright/test";

import { completarRegistro, confirmarCorreo } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";

/**
 * T060 — onboarding con salto y sin salto.
 * Cubre los criterios de aceptacion 8, 9, 10, 11 y 12 de la spec.
 */
test.beforeEach(reiniciarMock);

/** Deja la sesion iniciada, parada en la primera pantalla del onboarding. */
async function reciénRegistrada(page: import("@playwright/test").Page) {
  const datos = await completarRegistro(page);
  await confirmarCorreo(page);
  return datos;
}

test("son exactamente 3 pantallas antes de Inicio", async ({ page }) => {
  // Criterio 8.
  await reciénRegistrada(page);

  await expect(page).toHaveURL(/pantalla-1/);
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForURL("**/pantalla-2");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForURL("**/pantalla-3");

  // La tercera cierra: ya no hay "Siguiente", hay "Empezar".
  await expect(page.getByRole("button", { name: "Empezar" })).toBeVisible();
  await page.getByRole("button", { name: "Empezar" }).click();
  await page.waitForURL("**/inicio");
});

test("la pantalla 2 explica como se ganan Beats y para que sirven", async ({ page }) => {
  await reciénRegistrada(page);
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForURL("**/pantalla-2");

  await expect(page.getByText(/Beats/).first()).toBeVisible();
  await expect(page.getByText(/Escanea/i).first()).toBeVisible();
});

test("saltar desde la pantalla 1 lleva directo a Inicio", async ({ page }) => {
  // Criterio 9.
  await reciénRegistrada(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");
  await expect(page).toHaveURL(/\/inicio/);
});

test("Inicio arranca con el contador de Beats en cero", async ({ page }) => {
  // Criterio 12.
  const datos = await reciénRegistrada(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");

  const contador = page.locator("section[aria-label='Tu balance de Beats']");
  await expect(contador).toContainText("0");
  await expect(page.getByText(datos.nombre)).toBeVisible();
});

test("la barra inferior trae los 5 tabs", async ({ page }) => {
  await reciénRegistrada(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");

  await expect(page.locator("nav li")).toHaveCount(5);
  // Inicio y Escanear navegan; los otros tres todavia no existen.
  await expect(page.locator("nav a")).toHaveCount(2);
  await expect(page.locator("nav button[disabled]")).toHaveCount(3);
});

test("el onboarding presenta los avisos y para que sirven", async ({ page }) => {
  // Criterio 11: el permiso se plantea aqui, y se explica que son avisos de
  // valor (jornadas, artistas), no una confirmacion por cada accion.
  await reciénRegistrada(page);
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForURL("**/pantalla-2");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForURL("**/pantalla-3");

  // El copy dice "avisos", no "notificaciones" (tono de la constitution §3).
  await expect(page.getByText("Avisos del programa")).toBeVisible();
  await expect(
    page.getByText(/Nuevas jornadas, artistas confirmados/),
  ).toBeVisible();
});

test("con el permiso concedido, el onboarding lo refleja y deja seguir", async ({
  page,
}) => {
  // Bajo emulacion movil Chromium deniega los avisos de entrada y no hay forma
  // de concederlos desde Playwright, asi que se sustituye la API del navegador.
  // Lo que se prueba aqui es nuestra rama de "concedido", no el permiso del
  // navegador en si.
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "permission", {
      configurable: true,
      get: () => "granted",
    });
  });
  await reciénRegistrada(page);
  await page.goto("/onboarding/pantalla-3");

  await expect(page.getByText("Avisos activados.")).toBeVisible();
  await page.getByRole("button", { name: "Empezar" }).click();
  await page.waitForURL("**/inicio");
});

test("un permiso ya concedido se sincroniza con el perfil", async ({ page }) => {
  // Sin esto la pantalla diria que los avisos estan activos mientras el perfil
  // guardado sigue marcando que no.
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "permission", {
      configurable: true,
      get: () => "granted",
    });
  });
  const llamadas: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/usuario/notificaciones")) llamadas.push(r.method());
  });

  await reciénRegistrada(page);
  await page.goto("/onboarding/pantalla-3");
  await expect(page.getByText("Avisos activados.")).toBeVisible();

  expect(llamadas).toContain("POST");
});

test("sin el permiso, el onboarding lo dice y no bloquea", async ({ page, context }) => {
  // Flujo alternativo 8: negar los avisos no impide llegar a Inicio.
  await context.clearPermissions();
  await reciénRegistrada(page);
  await page.goto("/onboarding/pantalla-3");

  await expect(page.getByText(/Sin avisos por ahora/)).toBeVisible();
  await page.getByRole("button", { name: "Empezar" }).click();
  await page.waitForURL("**/inicio");
  await expect(page).toHaveURL(/\/inicio/);
});

test("una vez visto, el onboarding no vuelve nunca", async ({ page }) => {
  // Criterio 10 y regla de negocio 5.
  await reciénRegistrada(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");

  // Volver por URL no lo reabre.
  await page.goto("/onboarding/pantalla-1");
  await expect(page).toHaveURL(/\/inicio/);

  // Y reabrir la app tampoco.
  await page.goto("/inicio");
  await expect(page).toHaveURL(/\/inicio/);
  await expect(page.locator("section[aria-label='Tu balance de Beats']")).toBeVisible();
});

test("saltar tambien marca el onboarding como visto", async ({ page }) => {
  await reciénRegistrada(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");

  await page.goto("/onboarding/pantalla-2");
  await expect(page).toHaveURL(/\/inicio/);
});
