import { expect, test, type Page } from "@playwright/test";

import { auditar, informe } from "../ayudantes/accesibilidad";
import { completarRegistro, confirmarCorreo, cuentaEnInicio } from "../ayudantes/cuenta";
import { ponerModoEvento, reiniciarMock } from "../ayudantes/mock";
import { QR } from "../ayudantes/qr";

/**
 * T065 — accesibilidad basica en todas las pantallas construidas.
 *
 * La constitution §9 pide touch targets de 48px, contraste AA en todos los
 * textos y labels en todos los inputs. Se revisa pantalla por pantalla en vez
 * de una sola vez: un problema de contraste suele vivir en un componente que
 * solo aparece en un estado concreto.
 */
test.beforeEach(reiniciarMock);

async function revisar(page: Page, pantalla: string) {
  const hallazgos = await auditar(page);
  expect(hallazgos, informe(pantalla, hallazgos)).toEqual([]);
}

test("bienvenida", async ({ page }) => {
  await page.goto("/");
  await revisar(page, "bienvenida");
});

test("los 6 pasos del registro", async ({ page }) => {
  await page.goto("/registro/paso-1");
  await revisar(page, "registro paso 1");

  await page.getByLabel("Cedula").fill("V-12345678");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-2");
  await revisar(page, "registro paso 2");

  await page.getByLabel("Nombre").fill("Maria");
  await page.getByLabel("Apellido").fill("Rodriguez");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-3");
  await revisar(page, "registro paso 3");

  await page.getByLabel("Telefono").fill("04141234567");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-4");
  await revisar(page, "registro paso 4");

  await page.getByLabel("Correo").fill("maria@ejemplo.com");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-5");
  await revisar(page, "registro paso 5");

  await page.getByRole("radio", { name: /Estudiante UCV/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-6");
  await revisar(page, "registro paso 6");
});

test("el registro tambien es accesible mostrando un error", async ({ page }) => {
  // El texto de error es rojo sobre fondo claro: es justo donde el contraste
  // se suele perder.
  await page.goto("/registro/paso-1");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await revisar(page, "registro paso 1 con error");
});

test("espera de confirmacion del correo", async ({ page }) => {
  await completarRegistro(page);
  await revisar(page, "confirma tu correo");
});

test("las 3 pantallas del onboarding", async ({ page }) => {
  await completarRegistro(page);
  await confirmarCorreo(page);
  await revisar(page, "onboarding 1");

  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForURL("**/pantalla-2");
  await revisar(page, "onboarding 2");

  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForURL("**/pantalla-3");
  await revisar(page, "onboarding 3");
});

test("Inicio con la barra de navegacion", async ({ page }) => {
  await cuentaEnInicio(page);
  await revisar(page, "inicio");
});

test("pantalla de escaneo", async ({ page, context }) => {
  await context.grantPermissions(["camera"]);
  await cuentaEnInicio(page);
  await page.goto("/escanear");
  await page.waitForTimeout(1500);
  await revisar(page, "escanear");
});

test("confirmacion de canje", async ({ page }) => {
  await cuentaEnInicio(page);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await expect(page.getByText("Vas a canjear el QR de")).toBeVisible();
  await revisar(page, "confirmar canje");
});

test("canje otorgado, cierre simple", async ({ page }) => {
  await cuentaEnInicio(page);
  await ponerModoEvento(false);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
  await page.waitForTimeout(1500); // que el contador termine de subir
  await revisar(page, "canje otorgado");
});

test("canje otorgado, cierre de modo evento", async ({ page }) => {
  await cuentaEnInicio(page);
  await ponerModoEvento(true);
  await page.goto(`/escanear/confirmar?qr=${QR.conCupo}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 5 Beats/)).toBeVisible();
  await page.waitForTimeout(1500);
  await revisar(page, "canje otorgado con modo evento");
});

test("pantallas de friccion del canje", async ({ page }) => {
  await cuentaEnInicio(page);

  await page.goto(`/escanear/confirmar?qr=${QR.agotado}`);
  await expect(page.getByText(/ya no esta activo/)).toBeVisible();
  await revisar(page, "QR agotado");

  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await expect(page.getByText(/Ya sumaste con esta marca hoy/)).toBeVisible();
  await revisar(page, "ya escaneado hoy");
});

test("pantalla sin conexion", async ({ page }) => {
  await page.goto("/sin-conexion");
  await revisar(page, "sin conexion");
});

test("modal de instalacion en iOS", async ({ browser }) => {
  const contexto = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  });
  const pagina = await contexto.newPage();
  await pagina.goto("/");
  await pagina.waitForTimeout(1000);
  await revisar(pagina, "modal de instalacion iOS");
  await contexto.close();
});
