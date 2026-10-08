import { test, type Page } from "@playwright/test";
import { abrirBeats, cuentaConId, MARCA_KFC, MARCA_PEPSI } from "../ayudantes/beats";
import { datosDeRegistro } from "../ayudantes/cuenta";
import { moverMovimientos, reiniciarMock, sembrarMovimiento } from "../ayudantes/mock";

const D = process.env.SALIDA!;
test.skip(!process.env.SALIDA, "solo con npm run capturas");

async function foto(page: Page, nombre: string) {
  await page.waitForTimeout(700);
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 390, height: alto });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${D}/${nombre}.png` });
  await page.setViewportSize({ width: 390, height: 844 });
}

test("beats con datos", async ({ page }) => {
  await reiniciarMock();
  await page.setViewportSize({ width: 390, height: 844 });
  const { id } = await cuentaConId(page, datosDeRegistro({ nombre: "Israel" }));
  await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 15, marcaId: MARCA_KFC });
  await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 20, diasAtras: 1, marcaId: MARCA_PEPSI });
  await abrirBeats(page);
  await foto(page, "beats-con-datos");
});

test("beats sin datos", async ({ page }) => {
  await reiniciarMock();
  await page.setViewportSize({ width: 390, height: 844 });
  const { id } = await cuentaConId(page, datosDeRegistro({ nombre: "Israel" }));
  await moverMovimientos(id, 10);
  await abrirBeats(page);
  await foto(page, "beats-sin-datos");
});
