import { expect, test } from "@playwright/test";

import { completarRegistro, confirmarCorreo, datosDeRegistro } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";

/**
 * T059 — flujo completo de registro (6 pasos).
 * Cubre los criterios de aceptacion 5, 6 y 7 de la spec.
 */
test.beforeEach(reiniciarMock);

test("los 6 pasos van en el orden que manda la spec", async ({ page }) => {
  await page.goto("/registro/paso-1");

  // Criterio 5: cedula, nombre y apellido, telefono, correo, tipo, contrasena.
  await expect(page.getByText("Paso 1 de 6")).toBeVisible();
  await expect(page.getByLabel("Cedula")).toBeVisible();
  await page.getByLabel("Cedula").fill("V-12345678");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-2");
  await expect(page.getByLabel("Nombre")).toBeVisible();
  await expect(page.getByLabel("Apellido")).toBeVisible();
  await page.getByLabel("Nombre").fill("Maria");
  await page.getByLabel("Apellido").fill("Rodriguez");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-3");
  await expect(page.getByLabel("Telefono")).toBeVisible();
  await page.getByLabel("Telefono").fill("04141234567");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-4");
  await expect(page.getByLabel("Correo")).toBeVisible();
  await page.getByLabel("Correo").fill("maria@ejemplo.com");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-5");
  // Criterio 3 de reglas de negocio: exactamente tres opciones.
  await expect(page.getByRole("radio")).toHaveCount(3);
  await page.getByRole("radio", { name: /Estudiante UCV/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-6");
  await expect(page.getByText("Paso 6 de 6")).toBeVisible();
  await expect(page.getByLabel("Contrasena")).toBeVisible();
});

test("completar los 6 pasos crea la cuenta y pide confirmar el correo", async ({ page }) => {
  // Criterio 7. La sesion no arranca aqui: con la confirmacion de correo
  // activada en Supabase, primero hay que abrir el enlace.
  await completarRegistro(page);
  await expect(page.getByText(/Confirma tu correo/i)).toBeVisible();
});

test("sin confirmar el correo no hay sesion", async ({ page }) => {
  await completarRegistro(page);
  await page.goto("/inicio");
  // Sin sesion, Inicio no se abre.
  await expect(page).not.toHaveURL(/\/inicio/);
});

test("confirmar el correo inicia la sesion y lleva al onboarding", async ({ page }) => {
  // Criterio 8: la cuenta recien creada aterriza en el onboarding.
  const datos = await completarRegistro(page);
  await confirmarCorreo(page);
  await expect(page).toHaveURL(/\/onboarding\/pantalla-1/);

  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");
  await expect(page.getByText(datos.nombre)).toBeVisible();
});

test("cerrar la app a mitad del registro borra lo avanzado", async ({ page }) => {
  // Criterio 6 y regla de negocio 1: el formulario vive solo en memoria.
  await page.goto("/registro/paso-1");
  await page.getByLabel("Cedula").fill("V-12345678");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-2");

  await page.reload();

  await expect(page).toHaveURL(/\/registro\/paso-1/);
  await expect(page.getByLabel("Cedula")).toHaveValue("");
});

test("no se puede avanzar el paso del tipo sin elegir una opcion", async ({ page }) => {
  await page.goto("/registro/paso-1");
  await page.getByLabel("Cedula").fill("V-12345678");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-2");
  await page.getByLabel("Nombre").fill("Maria");
  await page.getByLabel("Apellido").fill("Rodriguez");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-3");
  await page.getByLabel("Telefono").fill("04141234567");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-4");
  await page.getByLabel("Correo").fill("maria@ejemplo.com");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-5");

  // El boton queda deshabilitado hasta elegir: no hay forma de pasar de aqui.
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
  await page.getByRole("radio", { name: /Egresado/ }).click();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
});

test.describe("validacion: solo sintaxis, ningun padron", () => {
  // Regla de negocio 2: nada se contrasta contra un registro oficial.
  test("una cedula inventada pasa sin chistar", async ({ page }) => {
    await completarRegistro(page, datosDeRegistro({ cedula: "V-00000000" }));
    await expect(page.getByText(/Confirma tu correo/i)).toBeVisible();
  });

  test("el telefono si revisa sintaxis basica", async ({ page }) => {
    await page.goto("/registro/paso-1");
    await page.getByLabel("Cedula").fill("V-12345678");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-2");
    await page.getByLabel("Nombre").fill("Maria");
    await page.getByLabel("Apellido").fill("Rodriguez");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-3");

    await page.getByLabel("Telefono").fill("no-son-digitos");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/paso-3/);
  });

  test("el correo si revisa que tenga arroba", async ({ page }) => {
    await page.goto("/registro/paso-1");
    await page.getByLabel("Cedula").fill("V-12345678");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-2");
    await page.getByLabel("Nombre").fill("Maria");
    await page.getByLabel("Apellido").fill("Rodriguez");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-3");
    await page.getByLabel("Telefono").fill("04141234567");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-4");

    await page.getByLabel("Correo").fill("sin-arroba.com");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/paso-4/);
  });
});
