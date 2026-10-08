import { test, type Page } from "@playwright/test";
import { cuentaEnInicio, datosDeRegistro } from "../ayudantes/cuenta";
import { reiniciarMock, sembrarMovimiento } from "../ayudantes/mock";

const D = process.env.SALIDA!;
test.skip(!process.env.SALIDA, "solo con npm run capturas");

async function foto(page: Page, nombre: string, completa = true) {
  await page.waitForTimeout(700);
  // Alto de la ventana = alto del contenido: la barra fija queda abajo, como
  // en la referencia, y no flotando a media pagina.
  const alto = completa ? await page.evaluate(() => document.documentElement.scrollHeight) : 844;
  await page.setViewportSize({ width: 390, height: alto });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${D}/${nombre}.png` });
  await page.setViewportSize({ width: 390, height: 844 });
}

const abrir = async (page: Page, titulo: string, abierto: boolean) => {
  const b = page.getByRole("button", { name: new RegExp(titulo) });
  if ((await b.getAttribute("aria-expanded")) !== String(abierto)) await b.click();
};

test("inicio 390", async ({ page }) => {
  await reiniciarMock();
  await page.setViewportSize({ width: 390, height: 844 });
  await cuentaEnInicio(page, datosDeRegistro({ nombre: "Israel" }));
  const { id } = await (await fetch("http://localhost:54321/prueba/ultimo-usuario")).json();
  await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 15, marcaId: "a1000000-0000-4000-8000-000000000001" });
  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 20, diasAtras: 2 });
  await page.reload();
  await foto(page, "inicio-actividad-abierta");
  await abrir(page, "Actividad reciente", false);
  await foto(page, "inicio-cerrado");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Notificaciones" }).click();
  await foto(page, "inicio-notificaciones", false);
});
