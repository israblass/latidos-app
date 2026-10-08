import { test, type Page } from "@playwright/test";
import { abrirBeats, cuentaConId, MARCA_KFC, MARCA_PEPSI } from "../ayudantes/beats";
import { datosDeRegistro } from "../ayudantes/cuenta";
import { moverMovimientos, reiniciarMock, sembrarMovimiento } from "../ayudantes/mock";

const D = process.env.SALIDA!;
test.skip(!process.env.SALIDA, "solo con npm run capturas");

async function foto(page: Page, nombre: string, ancho: number) {
  await page.waitForTimeout(700);
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: ancho, height: alto });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${D}/${nombre}-${ancho}.png` });
  await page.setViewportSize({ width: ancho, height: 844 });
}

for (const ancho of [320, 390, 430]) {
  for (const datos of [true, false]) {
    test(`${ancho} ${datos ? "con" : "sin"} datos`, async ({ page }) => {
      await reiniciarMock();
      await page.setViewportSize({ width: ancho, height: 844 });
      const { id } = await cuentaConId(page, datosDeRegistro({ nombre: "Israel" }));
      if (datos) {
        await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 15, marcaId: MARCA_KFC });
        await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 20, diasAtras: 1, marcaId: MARCA_PEPSI });
      } else {
        await moverMovimientos(id, 10);
      }
      const sufijo = datos ? "con-datos" : "sin-datos";
      await page.goto("/inicio");
      await page.locator("[data-saludo]").waitFor();
      await foto(page, `inicio-${sufijo}`, ancho);
      await abrirBeats(page);
      await foto(page, `beats-${sufijo}`, ancho);
    });
  }
}
