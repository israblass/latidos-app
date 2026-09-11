import { expect, type Page } from "@playwright/test";

import { ultimoEnlaceDeConfirmacion } from "./mock";

export interface DatosDeRegistro {
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  tipo: RegExp;
  contrasena: string;
}

let contador = 0;

/** Datos validos distintos en cada llamada, para no chocar por correo repetido. */
export function datosDeRegistro(ajustes: Partial<DatosDeRegistro> = {}): DatosDeRegistro {
  contador += 1;
  return {
    cedula: "V-12345678",
    nombre: "Maria",
    apellido: "Rodriguez",
    telefono: "04141234567",
    correo: `qa-${Date.now()}-${contador}@ejemplo.com`,
    tipo: /Estudiante UCV/,
    contrasena: "secreta1",
    ...ajustes,
  };
}

/**
 * Recorre los 6 pasos del registro y deja la pantalla en "confirma tu correo".
 * No confirma: hay pruebas que necesitan ver ese estado intermedio.
 */
export async function completarRegistro(page: Page, datos = datosDeRegistro()) {
  await page.goto("/registro/paso-1");

  await page.getByLabel("Cedula").fill(datos.cedula);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-2");

  await page.getByLabel("Nombre").fill(datos.nombre);
  await page.getByLabel("Apellido").fill(datos.apellido);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-3");

  await page.getByLabel("Telefono").fill(datos.telefono);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-4");

  await page.getByLabel("Correo").fill(datos.correo);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-5");

  await page.getByRole("radio", { name: datos.tipo }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-6");

  await page.getByLabel("Contrasena").fill(datos.contrasena);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL("**/confirma-tu-correo");

  return datos;
}

/** Abre el enlace del correo. Deja la sesion iniciada, en el onboarding. */
export async function confirmarCorreo(page: Page) {
  const { enlace } = await ultimoEnlaceDeConfirmacion();
  expect(enlace, "el mock no registro ningun enlace de confirmacion").toBeTruthy();
  await page.goto(enlace as string);
  await page.waitForURL("**/onboarding/pantalla-1");
}

/**
 * Cuenta lista para usar: registrada, confirmada y con el onboarding saltado.
 * La mayoria de las pruebas no vienen a probar el registro, solo necesitan
 * una sesion iniciada para llegar a lo suyo.
 */
export async function cuentaEnInicio(page: Page, datos = datosDeRegistro()) {
  await completarRegistro(page, datos);
  await confirmarCorreo(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");
  return datos;
}
