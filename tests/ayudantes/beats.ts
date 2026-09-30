import type { Page } from "@playwright/test";

import { cuentaEnInicio, datosDeRegistro } from "./cuenta";
import { ultimoUsuario } from "./mock";

/** Marca de la semilla sin logo: KFC. */
export const MARCA_KFC = "a1000000-0000-4000-8000-000000000001";
export const MARCA_PEPSI = "a1000000-0000-4000-8000-000000000002";

/** Cuenta lista en Inicio, con su id para sembrarle movimientos. */
export async function cuentaConId(page: Page, datos = datosDeRegistro()) {
  await cuentaEnInicio(page, datos);
  const { id } = await ultimoUsuario();
  if (!id) throw new Error("el mock no registro el perfil");
  return { id, datos };
}

/** Numero grande del contador de la pantalla de Beats. */
export const numeroDeBeats = (page: Page) =>
  page.locator("section[aria-label='Tu balance de Beats'] p.font-display");

/** La linea (boton de acordeon) de un dia, por su etiqueta. */
export const lineaDelDia = (page: Page, etiqueta: string | RegExp) =>
  page
    .locator("section[aria-label='Historial de Beats'] button[aria-expanded]")
    .filter({ hasText: etiqueta });

/** Todas las lineas de dia visibles. */
export const lineasDeDias = (page: Page) =>
  page.locator("section[aria-label='Historial de Beats'] button[aria-expanded]");

/** Abre la pantalla de Beats y espera a que el historial este cargado. */
export async function abrirBeats(page: Page) {
  await page.goto("/beats");
  await lineasDeDias(page).first().waitFor();
}
