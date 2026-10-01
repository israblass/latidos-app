import { expect, test, type Page } from "@playwright/test";

import { abrirBeats, cuentaConId, numeroDeBeats } from "../ayudantes/beats";
import {
  canalesDe,
  ponerTiempoRealCaido,
  reiniciarMock,
  sembrarMovimiento,
} from "../ayudantes/mock";
import { cortarRed, volverRed } from "../ayudantes/red";

/**
 * Refresco al volver a la app.
 *
 * En el telefono, con la pantalla bloqueada, el socket de tiempo real se
 * suspende: lo que llega mientras tanto no aparece hasta recargar. Aqui se
 * simula el regreso con los mismos eventos que dispara el navegador
 * (visibilitychange a visible, online) y se comprueba que el saldo y el
 * historial se ponen al dia solos, sin recargar y sin filas repetidas.
 *
 * Para que nada llegue "por el canal" y se confunda con el refresco, el tiempo
 * real se corta mientras se siembran los movimientos.
 */
test.beforeEach(reiniciarMock);

/** Marca la pagina: si se recarga, la marca desaparece. */
const marcarPagina = (page: Page) =>
  page.evaluate(() => ((window as unknown as { __sinRecargar: boolean }).__sinRecargar = true));
const sigueSinRecargar = (page: Page) =>
  page.evaluate(() => (window as unknown as { __sinRecargar?: boolean }).__sinRecargar === true);

/** Lo que el navegador dispara al desbloquear la pantalla. */
const volverAPrimerPlano = (page: Page) =>
  page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });

/** Cuenta las lecturas de saldo que salen de la pagina. */
function contarLecturasDeSaldo(page: Page) {
  const cuenta = { total: 0 };
  page.on("request", (peticion) => {
    if (peticion.url().includes("/rest/v1/rpc/resumen_beats")) cuenta.total++;
  });
  return cuenta;
}

const filasDeRegalo = (page: Page) =>
  page.locator("section[aria-label='Historial de Beats']").getByText("Regalo Latidos");

async function esperarCanal(id: string, cuantos = 1) {
  await expect
    .poll(async () => (await canalesDe(id)).canales, { timeout: 30_000 })
    .toBe(cuantos);
}

test.describe("Inicio", () => {
  test("al volver a primer plano el saldo cambia sin recargar", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await expect(numeroDeBeats(page)).toHaveText("5");
    await marcarPagina(page);

    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 30 });
    await volverAPrimerPlano(page);

    await expect(numeroDeBeats(page)).toHaveText("35");
    await expect(page.getByRole("link", { name: "Ver mis Beats. Tienes 35 Beats" })).toBeVisible();
    expect(await sigueSinRecargar(page)).toBe(true);
  });

  test("al recuperar la red tambien", async ({ page, context }) => {
    const { id } = await cuentaConId(page);
    await marcarPagina(page);

    await cortarRed(context);
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 12 });
    await volverRed(context);

    await expect(numeroDeBeats(page)).toHaveText("17");
    expect(await sigueSinRecargar(page)).toBe(true);
  });

  test("como mucho una lectura cada 5 s, sin perder el ultimo regreso", async ({ page }) => {
    const { id } = await cuentaConId(page);
    const lecturas = contarLecturasDeSaldo(page);

    // Se espera la respuesta: sembrar antes podria colarse en esta lectura.
    const primera = page.waitForResponse((r) => r.url().includes("/rest/v1/rpc/resumen_beats"));
    await volverAPrimerPlano(page);
    await primera;
    expect(lecturas.total).toBe(1);

    // Tres regresos seguidos dentro de los 5 s: uno solo queda pendiente.
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 10 });
    await volverAPrimerPlano(page);
    await volverAPrimerPlano(page);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForTimeout(1500);
    expect(lecturas.total).toBe(1);

    // Al cumplirse el intervalo sale esa lectura pendiente, y solo esa.
    await expect.poll(() => lecturas.total, { timeout: 8000 }).toBe(2);
    await expect(numeroDeBeats(page)).toHaveText("15");
    await page.waitForTimeout(1500);
    expect(lecturas.total).toBe(2);
  });
});

test.describe("Beats", () => {
  test("al volver, el saldo y la fila nueva aparecen una sola vez", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await abrirBeats(page);
    await esperarCanal(id);
    await marcarPagina(page);

    await ponerTiempoRealCaido(true);
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 30 });
    await volverAPrimerPlano(page);

    await expect(numeroDeBeats(page)).toHaveText("35");
    await expect(filasDeRegalo(page)).toHaveCount(1);
    expect(await sigueSinRecargar(page)).toBe(true);

    // Un segundo regreso no duplica nada.
    await page.waitForTimeout(5200);
    await volverAPrimerPlano(page);
    await page.waitForTimeout(1500);
    await expect(filasDeRegalo(page)).toHaveCount(1);
    await expect(numeroDeBeats(page)).toHaveText("35");
    await ponerTiempoRealCaido(false);
  });

  test("lo que llega por el canal y por el refresco no se repite", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await abrirBeats(page);
    await esperarCanal(id);

    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 20 });
    await expect(numeroDeBeats(page)).toHaveText("25");
    await expect(filasDeRegalo(page)).toHaveCount(1);

    await volverAPrimerPlano(page);
    await page.waitForTimeout(1500);
    await expect(filasDeRegalo(page)).toHaveCount(1);
    await expect(numeroDeBeats(page)).toHaveText("25");
  });

  test("si el canal se cae, se vuelve a suscribir solo y se pone al dia", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await abrirBeats(page);
    await esperarCanal(id);
    await marcarPagina(page);

    await ponerTiempoRealCaido(true);
    await esperarCanal(id, 0);
    // Llega mientras el canal esta caido: por el canal ya no va a llegar.
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 30 });
    await page.waitForTimeout(1500);
    await expect(numeroDeBeats(page)).toHaveText("5");
    await ponerTiempoRealCaido(false);

    // Un solo canal de nuevo, sin recargar, y lo perdido aparece.
    await esperarCanal(id, 1);
    await expect(numeroDeBeats(page)).toHaveText("35");
    await expect(filasDeRegalo(page)).toHaveCount(1);

    // Y lo nuevo vuelve a llegar en vivo.
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 5 });
    await expect(numeroDeBeats(page)).toHaveText("40");
    await expect(filasDeRegalo(page)).toHaveCount(2);
    expect(await sigueSinRecargar(page)).toBe(true);
    // Sin canales de sobra.
    await page.waitForTimeout(1000);
    expect((await canalesDe(id)).canales).toBe(1);
  });

  test("sin red, la copia y el aviso amarillo siguen igual al volver", async ({ page, context }) => {
    await cuentaConId(page);
    await abrirBeats(page);

    await cortarRed(context);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    const aviso = page.locator("[data-aviso-beats]");
    await expect(aviso).toBeVisible();
    await volverAPrimerPlano(page);
    await page.waitForTimeout(1500);
    await expect(aviso).toBeVisible();
    await expect(numeroDeBeats(page)).toHaveText("5");
    await volverRed(context);
    await expect(aviso).toHaveCount(0);
  });
});
