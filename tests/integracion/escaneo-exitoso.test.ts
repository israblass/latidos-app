import { expect, test } from "@playwright/test";

import { cuentaEnInicio } from "../ayudantes/cuenta";
import {
  cambiarBeatsDelQR,
  estadoDelQR,
  ponerModoEvento,
  reiniciarMock,
} from "../ayudantes/mock";
import { MARCA, QR } from "../ayudantes/qr";

/**
 * T061 — escaneo exitoso con confirmacion.
 * Cubre los criterios de aceptacion 15, 16, 17, 18, 19 y 24 de la spec.
 */
test.beforeEach(reiniciarMock);

const contador = (page: import("@playwright/test").Page) =>
  page.locator("section[aria-label='Tu balance de Beats']");

test("un QR valido muestra la confirmacion sin otorgar nada todavia", async ({ page }) => {
  // Criterio 15.
  await cuentaEnInicio(page);
  const antes = await estadoDelQR(QR.sinLimite);

  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);

  await expect(page.getByText("Vas a canjear el QR de")).toBeVisible();
  await expect(page.getByText(MARCA.sinLimite)).toBeVisible();
  await expect(page.getByText("+10")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar canje" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancelar" })).toBeVisible();

  // Nada se movio por el solo hecho de mirar la pantalla.
  const despues = await estadoDelQR(QR.sinLimite);
  expect(despues.escaneos).toBe(antes.escaneos);
  expect(despues.qr.escaneos_totales_contador).toBe(antes.qr.escaneos_totales_contador);
  await page.goto("/inicio");
  await expect(contador(page)).toContainText("0");
});

test("confirmar otorga los Beats, crea el Escaneo y sube el contador del QR", async ({
  page,
}) => {
  // Criterio 16 y verificacion V018.
  await cuentaEnInicio(page);
  const antes = await estadoDelQR(QR.sinLimite);

  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();

  await expect(page.getByText(/Sumaste 10 Beats de KFC/)).toBeVisible();

  const despues = await estadoDelQR(QR.sinLimite);
  expect(despues.escaneos).toBe(antes.escaneos + 1);
  expect(despues.qr.escaneos_totales_contador).toBe(
    antes.qr.escaneos_totales_contador + 1,
  );
});

test("el exito no se auto-reemplaza por el mensaje de 'ya escaneado'", async ({ page }) => {
  // Regresion. Al confirmar, el QR pasa a estar ya usado hoy; si algo vuelve a
  // renderizar esta ruta en el servidor, el exito desaparece delante de la
  // persona antes de que alcance a leerlo.
  await cuentaEnInicio(page);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();

  await page.waitForTimeout(2500);

  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
  await expect(page.getByText(/Ya sumaste con esta marca hoy/)).toHaveCount(0);
});

test("al volver a Inicio el balance ya refleja los Beats nuevos", async ({ page }) => {
  // Se sale por el boton, no por URL: asi se comprueba que Inicio no sirve el
  // balance viejo que el router de Next dejo en cache.
  await cuentaEnInicio(page);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();

  await page.getByRole("button", { name: "Volver a Inicio" }).click();
  await page.waitForURL("**/inicio");
  await expect(contador(page)).toContainText("10");
});

test("cancelar no escribe nada ni gasta cupo del QR", async ({ page }) => {
  // Criterio 17 y verificacion V019.
  await cuentaEnInicio(page);
  const antes = await estadoDelQR(QR.sinLimite);

  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.waitForURL("**/escanear");

  const despues = await estadoDelQR(QR.sinLimite);
  expect(despues.escaneos).toBe(antes.escaneos);
  expect(despues.qr.escaneos_totales_contador).toBe(antes.qr.escaneos_totales_contador);

  await page.goto("/inicio");
  await expect(contador(page)).toContainText("0");
});

test("con modo evento activo, el cierre invita a seguir escaneando", async ({ page }) => {
  // Criterio 18 y verificacion V020.
  await cuentaEnInicio(page);
  await ponerModoEvento(true);

  await page.goto(`/escanear/confirmar?qr=${QR.conCupo}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();

  await expect(page.getByText(/Sumaste 5 Beats de Pepsi/)).toBeVisible();
  await expect(page.getByText(/hay mas marcas cerca/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Seguir escaneando" })).toBeVisible();
});

test("con modo evento apagado, el cierre es simple", async ({ page }) => {
  // Criterio 19 y verificacion V021: sin CTA mas alla de volver a Inicio.
  await cuentaEnInicio(page);
  await ponerModoEvento(false);

  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();

  await expect(page.getByText(/hay mas marcas cerca/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Seguir escaneando" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Volver a Inicio" })).toBeVisible();
});

test("el historico conserva los Beats del momento del canje", async ({ page, browser }) => {
  // Criterio 24 y verificacion V022: el admin puede subir los Beats de un QR ya
  // impreso, y quien canjeo antes no ve su historico reescrito.
  await cuentaEnInicio(page);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();

  await cambiarBeatsDelQR(QR.sinLimite, 50);

  const otroContexto = await browser.newContext();
  const otra = await otroContexto.newPage();
  await cuentaEnInicio(otra);
  await otra.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await expect(otra.getByText("+50")).toBeVisible();
  await otra.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(otra.getByText(/Sumaste 50 Beats/)).toBeVisible();

  // Quien canjeo antes sigue con sus 10.
  await page.goto("/inicio");
  await expect(contador(page)).toContainText("10");
  await expect(contador(page)).not.toContainText("50");

  await otroContexto.close();
});
