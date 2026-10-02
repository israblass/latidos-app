import { expect, test, type Page } from "@playwright/test";
import type { Pool } from "pg";

import {
  MARCA_KFC,
  abrirBeats,
  cuentaConId,
  lineaDelDia,
  lineasDeDias,
  numeroDeBeats,
} from "../ayudantes/beats";
import {
  MOTIVO_SIN_BASE,
  comoUsuario,
  crearUsuario,
  hayBaseDeDatos,
  prepararBase,
} from "../ayudantes/base-de-datos";
import { completarRegistro, confirmarCorreo, cuentaEnInicio } from "../ayudantes/cuenta";
import {
  canalesDe,
  cambiarBeatsDelQR,
  cambiarEstadoQR,
  cambiarMarca,
  movimientosDe,
  reiniciarMock,
  sembrarMovimiento,
  simularFalla,
} from "../ayudantes/mock";
import { QR } from "../ayudantes/qr";
import { cortarRed, volverRed } from "../ayudantes/red";
import { etiquetaDia, tituloDia } from "../../src/lib/beats/formato";

/**
 * T046 — criterios de aceptacion 1 a 33 de la spec de Beats y 12 a 12d de la
 * spec de registro (ajuste del 2026-09-29), uno por prueba y con el numero en
 * el nombre, para poder leer el estado de la spec en el reporte.
 *
 * Varios ya tienen pruebas mas detalladas en beats-historial, beats-como-ganar,
 * beats-en-vivo, beats-sin-conexion, lectura-beats y libro-movimientos; aqui se
 * comprueba cada criterio tal como esta escrito. Los que dependen de la base
 * (29 a 32) corren contra Postgres real y se saltan sin DATABASE_URL.
 */
test.beforeEach(reiniciarMock);

const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
const haceDias = (n: number) => {
  const [a, m, d] = hoy().split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d - n)).toISOString().slice(0, 10);
};
const barra = (page: Page) => page.getByRole("navigation", { name: "Principal" });
const botonComoGano = (page: Page) => page.getByRole("button", { name: "¿Cómo gano Beats?" });
const lineaGuia = (page: Page) => page.getByText("Escanea tu primer QR para sumar.");

async function prepararCopia(page: Page) {
  await abrirBeats(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => caches.open("latidos-shell-v10").then((c) => c.match("/beats")).then(Boolean)),
    )
    .toBe(true);
}

test.describe("spec de Beats", () => {
  test("1 — el tab Beats lleva a la pantalla y queda activo", async ({ page }) => {
    await cuentaEnInicio(page);
    const tab = barra(page).getByRole("link", { name: "Beats" });
    await tab.click();
    await page.waitForURL("**/beats");
    await expect(tab).toHaveAttribute("aria-current", "page");
  });

  test("2 — la card del contador de Inicio lleva a Beats", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.getByRole("link", { name: /Ver mis Beats/ }).click();
    await page.waitForURL("**/beats");
  });

  test("3 — la pantalla de exito del escaneo no tiene acceso a Beats", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await page.getByRole("button", { name: "Confirmar canje" }).click();
    await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
    await expect(page.locator("main a[href='/beats']")).toHaveCount(0);
  });

  test("4 — titulo, boton, contador sin animacion y linea del canje", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await expect(page.getByRole("heading", { name: "Beats", level: 1 })).toBeVisible();
    await expect(botonComoGano(page)).toBeVisible();
    await expect(numeroDeBeats(page)).toHaveText("5");
    await expect(page.locator("section[aria-label='Tu balance de Beats'] [aria-label$='Beats']")).toHaveCount(0);
    await expect(
      page.getByText("Pronto podrás cambiarlos por entradas al concierto, merch y cursos."),
    ).toBeVisible();
  });

  test("5 — el dia mas reciente abierto y los demas cerrados, en orden", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 2, marcaId: MARCA_KFC });
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 4, marcaId: MARCA_KFC });
    await abrirBeats(page);
    // Desde la v2.8.0 la etiqueta va en tipo oracion: "Hoy", "Ayer", "Martes 29 sept".
    await expect(lineasDeDias(page)).toHaveText([/^Hoy/, new RegExp(`^${tituloDia(haceDias(2))}`), new RegExp(`^${tituloDia(haceDias(4))}`)]);
    await expect(lineasDeDias(page).nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(lineasDeDias(page).nth(1)).toHaveAttribute("aria-expanded", "false");
    await expect(lineasDeDias(page).nth(2)).toHaveAttribute("aria-expanded", "false");
  });

  test("6 — la linea cerrada dice dia, movimientos y total neto", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 1, marcaId: MARCA_KFC, horaCaracas: 10 });
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 1, marcaId: MARCA_KFC, horaCaracas: 11 });
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 7, diasAtras: 6, marcaId: MARCA_KFC });
    await abrirBeats(page);
    // v2.8.0: "N movimientos · +total" (antes "+total · N escaneos").
    await expect(lineaDelDia(page, "AYER")).toHaveText(/^Ayer\s*2 movimientos · \+20$/);
    await expect(lineaDelDia(page, etiquetaDia(haceDias(6)))).toContainText("1 movimiento · +7");
    expect(etiquetaDia(haceDias(6))).not.toMatch(/20\d\d/); // sin año
  });

  test("7 — un dia solo con movimientos de Latidos cuenta sus movimientos y su total", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 4, diasAtras: 1 });
    await abrirBeats(page);
    await expect(lineaDelDia(page, "HOY")).toHaveText(/^Hoy\s*1 movimiento · \+5$/);
    await expect(lineaDelDia(page, "AYER")).toHaveText(/^Ayer\s*1 movimiento · \+4$/);
  });

  test("8 — abrir otro dia deja los dos abiertos", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 4, diasAtras: 1 });
    await abrirBeats(page);
    await lineaDelDia(page, "AYER").click();
    await expect(lineaDelDia(page, "HOY")).toHaveAttribute("aria-expanded", "true");
    await expect(lineaDelDia(page, "AYER")).toHaveAttribute("aria-expanded", "true");
  });

  test("9 — cada fila: icono, nombre, Beats con signo y hora de 12 h, de la mas reciente", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 1, marcaId: MARCA_KFC, horaCaracas: 13, minuto: 5 });
    await sembrarMovimiento({ usuarioId: id, tipo: "ajuste", beats: -2, diasAtras: 1, horaCaracas: 18, minuto: 45 });
    await abrirBeats(page);
    await lineaDelDia(page, "AYER").click();
    const filas = page.locator(`#dia-${haceDias(1)} li`);
    // v2.8.0: nombre y hora a la izquierda, Beats con signo a la derecha.
    await expect(filas.nth(0)).toHaveText(/Ajuste Latidos\s*6:45 pm\s*-2/);
    await expect(filas.nth(1)).toHaveText(/K\s*KFC\s*1:05 pm\s*\+10/);
    await expect(filas.nth(0).locator("img")).toHaveCount(1);
  });

  test("10 — tocar una fila no abre ningun detalle", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    const fila = page.locator(`#dia-${hoy()} li`).first();
    await expect(fila.locator("a, button")).toHaveCount(0);
    await fila.click();
    await expect(page).toHaveURL(/\/beats$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("11 — una marca sin logo muestra su inicial en un circulo", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, marcaId: MARCA_KFC });
    await abrirBeats(page);
    const circulo = page.locator(`#dia-${hoy()} li`).filter({ hasText: "KFC" }).locator("span.rounded-full").first();
    await expect(circulo).toHaveText("K");
  });

  test("12 — con el QR desactivado, sus filas siguen con su nombre", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, marcaId: MARCA_KFC });
    await cambiarEstadoQR(QR.sinLimite, "inactivo");
    await abrirBeats(page);
    await expect(page.locator(`#dia-${hoy()}`)).toContainText("KFC");
  });

  test("13 — una marca renombrada con logo nuevo se ve asi en filas viejas, mismos Beats", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 3, marcaId: MARCA_KFC });
    await cambiarMarca(MARCA_KFC, { nombre: "KFC Plaza", logo_url: "/favicon-32.png" });
    await abrirBeats(page);
    await lineaDelDia(page, etiquetaDia(haceDias(3))).click();
    const fila = page.locator(`#dia-${haceDias(3)} li`).first();
    await expect(fila).toContainText("KFC Plaza");
    await expect(fila).toContainText("+10");
    await expect(fila.locator("img[src='/favicon-32.png']")).toBeVisible();
  });

  test("14 — si el admin cambia los Beats del QR, los escaneos viejos conservan los suyos", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await page.getByRole("button", { name: "Confirmar canje" }).click();
    await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
    await cambiarBeatsDelQR(QR.sinLimite, 50);
    await abrirBeats(page);
    await expect(page.locator(`#dia-${hoy()} li`).filter({ hasText: "KFC" })).toContainText("+10");
    await expect(numeroDeBeats(page)).toHaveText("15");
  });

  test("15 — la bienvenida es 'Bienvenida a Latidos · +5' con el corazon en circulo amarillo", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    const fila = page.locator(`#dia-${hoy()} li`).filter({ hasText: "Bienvenida a Latidos" });
    await expect(fila).toContainText("+5");
    // v2.8.0: la bienvenida lleva su propio icono; los demas movimientos de
    // Latidos siguen con el de la app.
    const icono = fila.locator("[data-icono-bienvenida]");
    await expect(icono).toHaveCSS("background-color", "rgb(253, 251, 5)");
    await expect(icono).toHaveAttribute("aria-hidden", "true");
  });

  test("16 — sin escaneos: explicacion desplegada, linea guia y Escanear", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    const inicial = page.getByRole("region", { name: "Cómo empezar a sumar" });
    await expect(inicial.getByRole("heading", { name: "Cómo los ganas" })).toBeVisible();
    await expect(lineaGuia(page)).toBeVisible();
    await expect(inicial.getByRole("link", { name: "Escanear" })).toBeVisible();
  });

  test("17 — Escanear abre el escaner", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await page.getByRole("region", { name: "Cómo empezar a sumar" }).getByRole("link", { name: "Escanear" }).click();
    await page.waitForURL("**/escanear");
  });

  test("18 — tras el primer escaneo ya no esta la explicacion y el escaneo esta en su dia", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await page.getByRole("button", { name: "Confirmar canje" }).click();
    await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
    await abrirBeats(page);
    await expect(lineaGuia(page)).toHaveCount(0);
    await expect(page.locator(`#dia-${hoy()}`)).toContainText("KFC");
  });

  test("19 — la hoja muestra como ganar y en que cambiarlos, con sus Pronto", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await botonComoGano(page).click();
    const hoja = page.getByRole("dialog", { name: "¿Cómo gano Beats?" });
    await expect(hoja.locator("li[data-estado='disponible']")).toHaveText(/Escanea QR de marcas\s*Cada marca da distinto/);
    await expect(hoja.locator("li[data-estado='pronto']")).toHaveText([
      /Dona insumos.*Pronto/i,
      /Haz voluntariado.*Pronto/i,
      /Asiste a actividades.*Pronto/i,
      /Entradas al concierto.*Pronto/i,
      /Merch de Latidos.*Pronto/i,
      /Cursos universitarios.*Pronto/i,
    ]);
  });

  test("20 — tocar algo marcado Pronto no hace nada", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await botonComoGano(page).click();
    const pronto = page.locator("[role='dialog'] li[data-estado='pronto']");
    await expect(pronto.locator("a, button")).toHaveCount(0);
    await pronto.last().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page).toHaveURL(/\/beats$/);
  });

  test("21 — si el saldo cambia con la pantalla abierta: anima, agrega la fila y lo anuncia", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await abrirBeats(page);
    await expect.poll(async () => (await canalesDe(id)).canales).toBeGreaterThan(0);
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 12, horaCaracas: 23, minuto: 59 });
    await expect(numeroDeBeats(page)).toHaveText("17");
    await expect(page.locator(`#dia-${hoy()} li`).first()).toContainText("Regalo Latidos");
    await expect(page.locator("[data-anuncio-beats]")).toHaveText("Sumaste 12 Beats");
  });

  test("22 — con mas de 7 dias se cargan 7 y los siguientes al bajar", async ({ page }) => {
    const { id } = await cuentaConId(page);
    for (let d = 1; d <= 9; d++) {
      await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: d, marcaId: MARCA_KFC });
    }
    await abrirBeats(page);
    await expect(lineasDeDias(page)).toHaveCount(7);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(lineasDeDias(page)).toHaveCount(10);
  });

  test("23 — sin red y con datos guardados: lo guardado con el aviso y la hora", async ({ page, context }) => {
    await cuentaEnInicio(page);
    await prepararCopia(page);
    await cortarRed(context);
    await page.reload();
    await expect(numeroDeBeats(page)).toHaveText("5");
    await expect(page.locator("[data-aviso-beats]")).toHaveText(
      /^Sin conexión\. Así estaban tus Beats a las \d{1,2}:\d{2} (am|pm)\.$/,
    );
    await volverRed(context);
  });

  test("24 — al volver la señal se actualiza sola y el aviso desaparece", async ({ page, context }) => {
    const { id } = await cuentaConId(page);
    await prepararCopia(page);
    await cortarRed(context);
    await page.reload();
    await expect(page.locator("[data-aviso-beats]")).toBeVisible();
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 1 });
    await volverRed(context);
    await expect(numeroDeBeats(page)).toHaveText("6");
    await expect(page.locator("[data-aviso-beats]")).toHaveCount(0);
  });

  test("25 — sin red y sin datos guardados: pantalla completa de sin conexion", async ({ page, context }) => {
    await cuentaEnInicio(page);
    await prepararCopia(page);
    await page.evaluate(() => localStorage.clear());
    await cortarRed(context);
    await page.reload();
    await expect(page.getByRole("region", { name: "Sin conexión" })).toBeVisible();
    await volverRed(context);
  });

  test("26 — con red y carga fallida: lo guardado con 'No pudimos actualizar' y Reintentar", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await simularFalla("historial_beats", true);
    await page.reload();
    const aviso = page.locator("[data-aviso-beats='error']");
    await expect(aviso).toContainText("No pudimos actualizar.");
    await expect(aviso.getByRole("button", { name: "Reintentar" })).toBeVisible();
    await expect(page.getByText("Bienvenida a Latidos")).toBeVisible();
    await simularFalla("historial_beats", false);
  });

  test("27 — tras cerrar sesion, otra persona no ve los Beats guardados", async ({ page, context }) => {
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 61 }); // 66
    await abrirBeats(page);
    await expect(numeroDeBeats(page)).toHaveText("66");
    await context.clearCookies();
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await expect(numeroDeBeats(page)).toHaveText("5");
    expect(await page.evaluate((i) => localStorage.getItem(`latidos:beats:${i}`), id)).toBeNull();
  });

  test("28 — sin sesion o sin onboarding, redirige igual que Inicio", async ({ page }) => {
    await page.goto("/beats");
    await page.waitForURL("**/registro/confirma-tu-correo");
    await completarRegistro(page);
    await confirmarCorreo(page);
    await page.goto("/beats");
    await page.waitForURL("**/onboarding/pantalla-1");
  });

  test("33 — sumar Beats por una accion propia no dispara ninguna notificacion", async ({ page }) => {
    // Se espian las dos formas de mostrar una notificacion en la web.
    await page.addInitScript(() => {
      const w = window as unknown as { __notificaciones: number };
      w.__notificaciones = 0;
      const Original = window.Notification;
      if (Original) {
        window.Notification = new Proxy(Original, {
          construct(objetivo, args) {
            w.__notificaciones++;
            return new objetivo(...(args as [string]));
          },
        });
      }
      const mostrar = ServiceWorkerRegistration.prototype.showNotification;
      ServiceWorkerRegistration.prototype.showNotification = function (...args) {
        w.__notificaciones++;
        return mostrar.apply(this, args);
      };
    });
    const { id } = await cuentaConId(page);
    await abrirBeats(page);
    await expect.poll(async () => (await canalesDe(id)).canales).toBeGreaterThan(0);

    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await page.getByRole("button", { name: "Confirmar canje" }).click();
    await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
    await abrirBeats(page);
    expect(await page.evaluate(() => (window as unknown as { __notificaciones: number }).__notificaciones)).toBe(0);
    expect((await movimientosDe(id)).map((m) => m.tipo)).toEqual(["bienvenida", "escaneo"]);
  });
});

test.describe("spec de Beats, criterios de la base", () => {
  test.skip(!hayBaseDeDatos, MOTIVO_SIN_BASE);

  let pool: Pool;
  const BASE = "latidos_pruebas_criterios_beats";

  test.beforeAll(async () => {
    pool = await prepararBase(BASE);
  });
  test.afterAll(async () => {
    await pool?.end();
  });

  const consultarComo = async (id: string, sql: string, valores: unknown[] = []) => {
    let error: string | null = null;
    let filas: Record<string, unknown>[] = [];
    try {
      await comoUsuario(pool, id, async (consultar) => {
        filas = (await consultar(sql, valores)).rows;
      });
    } catch (e) {
      error = (e as Error).message;
    }
    return { error, filas };
  };

  test("29 — el saldo de cada cuenta coincide con la suma de sus movimientos", async () => {
    const id = await crearUsuario(pool, `c29-${Date.now()}@ejemplo.com`);
    await pool.query(`select public.registrar_movimiento_latidos($1, 'regalo', 9)`, [id]);
    await pool.query(`select public.registrar_movimiento_latidos($1, 'ajuste', -4)`, [id]);
    const { rows } = await pool.query(
      `select u.beats_balance, (select sum(beats) from public.movimientos_beats m where m.usuario_id = u.id)::int as suma
         from public.usuarios u`,
    );
    for (const fila of rows) expect(fila.beats_balance).toBe(fila.suma);
  });

  test("30 — un ajuste que dejaria el saldo bajo cero se rechaza sin crear nada", async () => {
    const id = await crearUsuario(pool, `c30-${Date.now()}@ejemplo.com`);
    const error = await pool
      .query(`select public.registrar_movimiento_latidos($1, 'ajuste', -6)`, [id])
      .then(() => null, (e: Error) => e.message);
    expect(error).toMatch(/saldo quedaria negativo/);
    const { rows } = await pool.query(`select count(*)::int as n from public.movimientos_beats where usuario_id = $1`, [id]);
    expect(rows[0].n).toBe(1);
  });

  test("31 — desde el dispositivo no se crea ni cambia un movimiento ni el saldo", async () => {
    const id = await crearUsuario(pool, `c31-${Date.now()}@ejemplo.com`);
    const intentos = [
      `insert into public.movimientos_beats (usuario_id, tipo, beats, dia_local) values ('${id}', 'regalo', 100, current_date)`,
      `update public.movimientos_beats set beats = 500 where usuario_id = '${id}'`,
      `delete from public.movimientos_beats where usuario_id = '${id}'`,
      `update public.usuarios set beats_balance = 999 where id = '${id}'`,
      `select * from public.registrar_movimiento_latidos('${id}', 'regalo', 100)`,
    ];
    for (const sql of intentos) await consultarComo(id, sql);
    const { rows } = await pool.query(
      `select u.beats_balance, (select json_agg(beats) from public.movimientos_beats where usuario_id = u.id) as beats
         from public.usuarios u where id = $1`,
      [id],
    );
    expect(rows[0]).toEqual({ beats_balance: 5, beats: [5] });
  });

  test("32 — al consultar movimientos, cada quien solo obtiene los suyos", async () => {
    const ana = await crearUsuario(pool, `c32a-${Date.now()}@ejemplo.com`);
    const beto = await crearUsuario(pool, `c32b-${Date.now()}@ejemplo.com`);
    await pool.query(`select public.registrar_movimiento_latidos($1, 'regalo', 50)`, [beto]);
    const { filas } = await consultarComo(ana, `select usuario_id from public.movimientos_beats`);
    expect(filas.map((f) => f.usuario_id)).toEqual([ana]);
  });
});

test.describe("spec de registro, ajuste del 2026-09-29", () => {
  test("12 — la primera llegada a Inicio muestra los Beats de bienvenida", async ({ page }) => {
    await cuentaEnInicio(page);
    await expect(page.locator("section[aria-label='Tu balance de Beats'] p.font-display")).toHaveText("5");
    await expect(page.getByText("Escanea un QR de marca para empezar a sumar.")).toHaveCount(0);
  });

  test("12b — al confirmar el correo se registra una unica bienvenida", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await page.reload();
    expect((await movimientosDe(id)).filter((m) => m.tipo === "bienvenida")).toEqual([
      expect.objectContaining({ beats: 5 }),
    ]);
    await abrirBeats(page);
    await expect(page.getByText("Bienvenida a Latidos")).toHaveCount(1);
  });

  test("12c — la card del contador de Inicio lleva a Beats", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.getByRole("link", { name: /Ver mis Beats/ }).click();
    await page.waitForURL("**/beats");
  });

  test("12d — el onboarding no promete montos y marca Pronto lo que no existe", async ({ page }) => {
    await completarRegistro(page);
    await confirmarCorreo(page);
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.waitForURL("**/pantalla-2");
    const escanear = page.locator("li[data-estado='disponible']");
    await expect(escanear).toHaveText(/Escanea QR de marcas\s*Cada marca da distinto\./);
    await expect(escanear).not.toContainText(/\+\d/);
    for (const titulo of ["Dona insumos", "Haz voluntariado", "Asiste a actividades"]) {
      await expect(page.locator("li").filter({ hasText: titulo })).toHaveAttribute("data-estado", "pronto");
    }
  });
});
