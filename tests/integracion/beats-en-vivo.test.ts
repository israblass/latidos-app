import { expect, test, type Page } from "@playwright/test";

import { abrirBeats, cuentaConId, lineaDelDia, lineasDeDias, numeroDeBeats } from "../ayudantes/beats";
import {
  canalesDe,
  moverMovimientos,
  ponerTiempoRealCaido,
  reiniciarMock,
  sembrarMovimiento,
} from "../ayudantes/mock";
import { QR } from "../ayudantes/qr";
import { insertarMovimiento } from "../../src/lib/beats/insertar-movimiento";

/**
 * T038 — actualizacion en vivo (Fase 4, V020 a V023).
 *
 * El mock habla el protocolo de Supabase Realtime (tests/servidor-mock/
 * tiempo-real.js), asi que aqui se ejercita el cliente real de realtime-js de
 * punta a punta. Lo que el mock no puede demostrar es la publicacion de
 * Postgres ni la RLS del canal: eso solo se comprueba con Supabase real.
 */
test.beforeEach(reiniciarMock);

const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
const anuncio = (page: Page) => page.locator("[data-anuncio-beats]");

/** Espera a que la pantalla este suscrita al canal en vivo. */
async function esperarCanal(id: string) {
  await expect.poll(async () => (await canalesDe(id)).canales, { timeout: 10_000 }).toBeGreaterThan(0);
}

/** Guarda cada valor que muestra el contador, para ver si hubo animacion. */
async function grabarContador(page: Page) {
  await page.evaluate(() => {
    const valores: string[] = [];
    (window as unknown as { __valores: string[] }).__valores = valores;
    const numero = document.querySelector("section[aria-label='Tu balance de Beats'] p.font-display");
    if (!numero) return;
    valores.push(numero.textContent ?? "");
    new MutationObserver(() => valores.push(numero.textContent ?? "")).observe(numero, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });
}
const valoresGrabados = (page: Page) =>
  page.evaluate(() => (window as unknown as { __valores: string[] }).__valores);

test("un escaneo desde otra sesion anima el contador, agrega la fila y lo anuncia", async ({
  page,
  browser,
}) => {
  // V020 y criterio 21.
  const { id } = await cuentaConId(page);
  await abrirBeats(page);
  await esperarCanal(id);
  await grabarContador(page);

  // La misma cuenta en otro "telefono": misma sesion, otra pestaña.
  const otroContexto = await browser.newContext({
    ...test.info().project.use,
    storageState: await page.context().storageState(),
  });
  const otra = await otroContexto.newPage();
  await otra.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await otra.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(otra.getByText(/Sumaste 10 Beats/)).toBeVisible();
  await otroContexto.close();

  await expect(numeroDeBeats(page)).toHaveText("15");
  await expect(page.locator(`#dia-${hoy()}`)).toContainText("KFC");
  await expect(lineaDelDia(page, "HOY")).toContainText("2 movimientos · +15");
  await expect(anuncio(page)).toHaveText("Sumaste 10 Beats");

  // Paso por valores intermedios: animo, no salto.
  const valores = await valoresGrabados(page);
  expect(valores[0]).toBe("5");
  expect(valores.some((v) => Number(v) > 5 && Number(v) < 15), valores.join(",")).toBe(true);

  // Y con el primer escaneo se va el estado inicial.
  await expect(page.getByText("Escanea tu primer QR para sumar.")).toHaveCount(0);
});

test("un regalo registrado por el equipo aparece igual", async ({ page }) => {
  // V020: la misma via que usaria registrar_movimiento_latidos desde el editor.
  const { id } = await cuentaConId(page);
  await abrirBeats(page);
  await esperarCanal(id);

  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 20, horaCaracas: 23, minuto: 59 });

  await expect(numeroDeBeats(page)).toHaveText("25");
  const filas = page.locator(`#dia-${hoy()} li`);
  await expect(filas.first()).toContainText("Regalo Latidos");
  await expect(filas.first()).toContainText("+20");
  await expect(anuncio(page)).toHaveText("Sumaste 20 Beats");
  // Un regalo no es un escaneo: el estado inicial sigue.
  await expect(page.getByText("Escanea tu primer QR para sumar.")).toBeVisible();
});

test("un ajuste que resta se anuncia como descuento", async ({ page }) => {
  const { id } = await cuentaConId(page);
  await abrirBeats(page);
  await esperarCanal(id);
  await sembrarMovimiento({ usuarioId: id, tipo: "ajuste", beats: -3, horaCaracas: 23, minuto: 59 });
  await expect(numeroDeBeats(page)).toHaveText("2");
  await expect(anuncio(page)).toHaveText("Se descontaron 3 Beats");
});

test("un movimiento de un dia que no estaba crea el dia arriba y abierto", async ({ page }) => {
  // Criterio 21 y spec §8.5.
  const { id } = await cuentaConId(page);
  await moverMovimientos(id, 3); // la bienvenida pasa a hace 3 dias: no hay HOY
  await abrirBeats(page);
  await expect(lineasDeDias(page)).toHaveCount(1);
  await expect(lineaDelDia(page, "HOY")).toHaveCount(0);
  await esperarCanal(id);

  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 7 });

  await expect(lineasDeDias(page)).toHaveCount(2);
  await expect(lineasDeDias(page).first()).toContainText("Hoy");
  await expect(lineasDeDias(page).first()).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(`#dia-${hoy()}`)).toContainText("Regalo Latidos");
});

test.describe("con movimiento reducido", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("el numero cambia sin animar", async ({ page }) => {
    // V021.
    const { id } = await cuentaConId(page);
    await abrirBeats(page);
    await esperarCanal(id);
    await grabarContador(page);

    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 40, horaCaracas: 23, minuto: 59 });
    await expect(numeroDeBeats(page)).toHaveText("45");
    await page.waitForTimeout(1200);

    const valores = await valoresGrabados(page);
    expect(valores.filter((v) => v !== "5" && v !== "45"), valores.join(",")).toEqual([]);
    await expect(anuncio(page)).toHaveText("Sumaste 40 Beats");
  });
});

test("si el canal se cae no aparece ningun error, y al reentrar esta al dia", async ({ page }) => {
  // V022 y spec §8.6.
  const { id } = await cuentaConId(page);
  await abrirBeats(page);
  await esperarCanal(id);

  await ponerTiempoRealCaido(true);
  await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 20 });
  await page.waitForTimeout(2000);

  // Sin el canal no llego nada, y tampoco un error.
  await expect(numeroDeBeats(page)).toHaveText("5");
  await expect(page.getByText(/No pudimos|error/i)).toHaveCount(0);
  await expect(page.getByRole("alert").filter({ hasText: /./ })).toHaveCount(0);

  await ponerTiempoRealCaido(false);
  const barra = page.getByRole("navigation", { name: "Principal" });
  await barra.getByRole("link", { name: "Inicio" }).click();
  await page.waitForURL("**/inicio");
  await barra.getByRole("link", { name: "Beats" }).click();
  await page.waitForURL("**/beats");
  await expect(numeroDeBeats(page)).toHaveText("25");
});

test("los movimientos de otra cuenta no llegan", async ({ page, browser }) => {
  // V023.
  const { id: mia } = await cuentaConId(page);
  await abrirBeats(page);
  await esperarCanal(mia);

  const otroContexto = await browser.newContext({ ...test.info().project.use });
  const otra = await otroContexto.newPage();
  const { id: ajena } = await cuentaConId(otra);
  await otroContexto.close();

  await sembrarMovimiento({ usuarioId: ajena, tipo: "regalo", beats: 99 });
  await page.waitForTimeout(1500);

  await expect(numeroDeBeats(page)).toHaveText("5");
  await expect(anuncio(page)).toHaveText("");
  await expect(page.getByText("Regalo Latidos")).toHaveCount(0);
});

test.describe("insertarMovimiento (sin pantalla)", { tag: "@rapido" }, () => {
  const mov = (id: string, beats: number, hora: string, tipo: "escaneo" | "regalo" = "escaneo") => ({
    id,
    tipo,
    beats,
    ocurrido_en: `2026-09-29T${hora}:00Z`,
    marca: null,
  });
  const dia = (fecha: string, ...movimientos: ReturnType<typeof mov>[]) => ({
    dia_local: fecha,
    total_neto: movimientos.reduce((t, m) => t + m.beats, 0),
    escaneos: movimientos.filter((m) => m.tipo === "escaneo").length,
    movimientos,
  });

  test("entra en su dia por hora y recalcula total y conteo", () => {
    const dias = [dia("2026-09-29", mov("a", 10, "20:00"), mov("b", 5, "10:00"))];
    const r = insertarMovimiento(dias, "2026-09-29", mov("c", 3, "15:00", "regalo"), false);
    expect(r?.diaNuevo).toBe(false);
    expect(r?.dias[0].movimientos.map((m) => m.id)).toEqual(["a", "c", "b"]);
    expect(r?.dias[0].total_neto).toBe(18);
    expect(r?.dias[0].escaneos).toBe(2);
  });

  test("un dia nuevo se crea en su lugar, arriba si es el mas reciente", () => {
    const dias = [dia("2026-09-27", mov("a", 5, "10:00"))];
    const r = insertarMovimiento(dias, "2026-09-29", mov("b", 10, "12:00"), false);
    expect(r?.diaNuevo).toBe(true);
    expect(r?.dias.map((d) => d.dia_local)).toEqual(["2026-09-29", "2026-09-27"]);
  });

  test("no duplica un movimiento que ya estaba", () => {
    const dias = [dia("2026-09-29", mov("a", 10, "20:00"))];
    const r = insertarMovimiento(dias, "2026-09-29", mov("a", 10, "20:00"), false);
    expect(r?.dias[0].movimientos).toHaveLength(1);
    expect(r?.dias[0].total_neto).toBe(10);
  });

  test("un dia mas viejo que lo cargado espera a su lote", () => {
    const dias = [dia("2026-09-29", mov("a", 10, "20:00"))];
    expect(insertarMovimiento(dias, "2026-09-01", mov("b", 1, "01:00"), true)).toBeNull();
    expect(insertarMovimiento(dias, "2026-09-01", mov("b", 1, "01:00"), false)?.diaNuevo).toBe(true);
  });
});
