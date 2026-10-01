import { expect, test } from "@playwright/test";

import {
  MARCA_KFC,
  MARCA_PEPSI,
  abrirBeats,
  cuentaConId,
  lineaDelDia,
  lineasDeDias,
  numeroDeBeats,
} from "../ayudantes/beats";
import { completarRegistro, confirmarCorreo, cuentaEnInicio } from "../ayudantes/cuenta";
import {
  cambiarBeatsDelQR,
  cambiarEstadoQR,
  cambiarMarca,
  reiniciarMock,
  sembrarMovimiento,
} from "../ayudantes/mock";
import { QR } from "../ayudantes/qr";
import { etiquetaDia } from "../../src/lib/beats/formato";

/**
 * T026 — pantalla de Beats con historial (Fase 2, V011 a V015).
 *
 * Corre contra el mock, que reimplementa historial_beats(); la version SQL se
 * prueba contra Postgres en lectura-beats.test.ts.
 */
test.beforeEach(reiniciarMock);

/** YYYY-MM-DD de hace `n` dias en Caracas. */
const haceDias = (n: number) => {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
  const [a, m, d] = hoy.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d - n)).toISOString().slice(0, 10);
};

test.describe("como se llega", () => {
  test("el tab Beats abre la pantalla y queda activo", async ({ page }) => {
    // V011 y criterio 1.
    await cuentaEnInicio(page);
    const tab = page.getByRole("navigation", { name: "Principal" }).getByRole("link", {
      name: "Beats",
    });
    await tab.click();
    await page.waitForURL("**/beats");
    await expect(tab).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Beats", level: 1 })).toBeVisible();
  });

  test("la card del contador de Inicio abre Beats", async ({ page }) => {
    // V011 y criterio 2.
    await cuentaEnInicio(page);
    await page.getByRole("link", { name: /Ver mis Beats/ }).click();
    await page.waitForURL("**/beats");
    await expect(numeroDeBeats(page)).toHaveText("5");
  });

  test("la pantalla de exito del escaneo no lleva a Beats", async ({ page }) => {
    // Criterio 3: fuera de la barra inferior, nada en el exito enlaza a Beats.
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await page.getByRole("button", { name: "Confirmar canje" }).click();
    await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
    await expect(page.locator("main a[href='/beats']")).toHaveCount(0);
  });
});

test.describe("guardia", () => {
  test("sin sesion redirige como Inicio", async ({ page }) => {
    // V012 y criterio 28.
    await page.goto("/beats");
    await page.waitForURL("**/registro/confirma-tu-correo");
  });

  test("sin el onboarding visto redirige al onboarding", async ({ page }) => {
    await completarRegistro(page);
    await confirmarCorreo(page);
    await page.goto("/beats");
    await page.waitForURL("**/onboarding/pantalla-1");
  });
});

test.describe("pantalla", () => {
  test("titulo, contador sin animacion de entrada y recordatorio del canje", async ({ page }) => {
    // Criterio 4.
    await cuentaEnInicio(page);
    await abrirBeats(page);
    await expect(page.getByRole("heading", { name: "Beats", level: 1 })).toBeVisible();
    // El numero aparece ya en su valor: no pasa por el contador animado.
    await expect(numeroDeBeats(page)).toHaveText("5");
    await expect(page.locator("section[aria-label='Tu balance de Beats'] [aria-label$='Beats']")).toHaveCount(0);
    await expect(
      page.getByText("Pronto podrás cambiarlos por entradas al concierto, merch y cursos."),
    ).toBeVisible();
  });

  test("ni Inicio ni Beats se desplazan de lado", async ({ page }) => {
    // El halo del contador se salia de la pantalla: la animacion de latido
    // pisaba el translate que lo centra.
    const anchoSobrante = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await cuentaEnInicio(page);
    expect(await anchoSobrante()).toBe(0);
    await abrirBeats(page);
    expect(await anchoSobrante()).toBe(0);
    await page.getByRole("button", { name: "¿Cómo gano Beats?" }).click();
    expect(await anchoSobrante()).toBe(0);
  });

  test("HOY abierto, los demas cerrados, con etiquetas, totales y conteos", async ({ page }) => {
    // V013, criterios 5, 6, 7 y 15.
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 1, marcaId: MARCA_KFC });
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 5, diasAtras: 5, marcaId: MARCA_PEPSI, horaCaracas: 10 });
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 5, marcaId: MARCA_KFC, horaCaracas: 11 });
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 3, diasAtras: 5, horaCaracas: 12 });

    await abrirBeats(page);
    await expect(numeroDeBeats(page)).toHaveText("33");

    const etiquetaVieja = etiquetaDia(haceDias(5));
    expect(etiquetaVieja).toMatch(/^[A-ZÁÉÍÓÚ]+ \d{1,2} [A-Z]+$/);
    await expect(lineasDeDias(page)).toHaveCount(3);
    await expect(lineasDeDias(page).nth(0)).toContainText("HOY");
    await expect(lineasDeDias(page).nth(1)).toContainText("AYER");
    await expect(lineasDeDias(page).nth(2)).toContainText(etiquetaVieja);

    // Hoy solo tiene la bienvenida: total sin conteo de escaneos.
    await expect(lineaDelDia(page, "HOY")).toHaveText(/HOY\s*\+5$/);
    await expect(lineaDelDia(page, "AYER")).toContainText("+10 · 1 escaneo");
    await expect(lineaDelDia(page, etiquetaVieja)).toContainText("+18 · 2 escaneos");

    await expect(lineaDelDia(page, "HOY")).toHaveAttribute("aria-expanded", "true");
    await expect(lineaDelDia(page, "AYER")).toHaveAttribute("aria-expanded", "false");
    await expect(lineaDelDia(page, etiquetaVieja)).toHaveAttribute("aria-expanded", "false");

    // La bienvenida, con el icono de Latidos.
    const hoy = page.locator(`#dia-${haceDias(0)}`);
    await expect(hoy).toContainText("Bienvenida a Latidos");
    await expect(hoy).toContainText("+5");
    await expect(hoy.locator("img[src*='icon-512']")).toHaveCount(1);
  });

  test("abrir un dia no cierra otro, y las filas no se tocan", async ({ page }) => {
    // Criterios 8, 9 y 10.
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 1, marcaId: MARCA_KFC, horaCaracas: 9 });
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 5, diasAtras: 1, marcaId: MARCA_PEPSI, horaCaracas: 18 });
    await abrirBeats(page);

    await lineaDelDia(page, "AYER").click();
    await expect(lineaDelDia(page, "AYER")).toHaveAttribute("aria-expanded", "true");
    await expect(lineaDelDia(page, "HOY")).toHaveAttribute("aria-expanded", "true");

    const ayer = page.locator(`#dia-${haceDias(1)}`);
    // De la mas reciente a la mas antigua, con hora de 12 horas.
    await expect(ayer.locator("li").nth(0)).toContainText("Pepsi");
    await expect(ayer.locator("li").nth(0)).toContainText("6:00 pm");
    await expect(ayer.locator("li").nth(1)).toContainText("KFC");
    await expect(ayer.locator("li").nth(1)).toContainText("9:00 am");

    // Nada dentro de las filas es interactivo.
    await expect(ayer.locator("a, button")).toHaveCount(0);
    await ayer.locator("li").first().click();
    await expect(page).toHaveURL(/\/beats$/);
    await expect(lineaDelDia(page, "AYER")).toHaveAttribute("aria-expanded", "true");

    // Y se vuelve a cerrar.
    await lineaDelDia(page, "AYER").click();
    await expect(lineaDelDia(page, "AYER")).toHaveAttribute("aria-expanded", "false");
    await expect(ayer).toBeHidden();
  });

  test("una marca sin logo muestra su inicial", async ({ page }) => {
    // V014 y criterio 11.
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, marcaId: MARCA_KFC });
    await abrirBeats(page);
    const fila = page.locator(`#dia-${haceDias(0)} li`).filter({ hasText: "KFC" });
    await expect(fila.locator("span[aria-hidden='true']").first()).toHaveText("K");
  });

  test("QR desactivado y marca renombrada: nombre y logo nuevos, Beats originales", async ({
    page,
  }) => {
    // V014, criterios 12, 13 y 14.
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 2, marcaId: MARCA_KFC });

    await cambiarEstadoQR(QR.sinLimite, "inactivo");
    await cambiarBeatsDelQR(QR.sinLimite, 50);
    await cambiarMarca(MARCA_KFC, { nombre: "KFC Venezuela", logo_url: "/favicon-32.png" });

    await abrirBeats(page);
    const linea = lineaDelDia(page, etiquetaDia(haceDias(2)));
    await expect(linea).toContainText("+10 · 1 escaneo");
    await linea.click();

    const fila = page.locator(`#dia-${haceDias(2)} li`).first();
    await expect(fila).toContainText("KFC Venezuela");
    await expect(fila).toContainText("+10");
    await expect(fila.locator("img[src='/favicon-32.png']")).toBeVisible();
  });
});

test.describe("hora en Caracas aunque el telefono este en otra zona", () => {
  test.use({ timezoneId: "Asia/Tokyo" });

  test("un movimiento de las 9:30 pm de ayer sigue siendo de AYER", async ({ page }) => {
    // En Tokio ya es el dia siguiente: si el formato usara la zona del
    // telefono, la fila saltaria a HOY y la hora diria 10:30 am.
    const { id } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: 1, marcaId: MARCA_KFC, horaCaracas: 21, minuto: 30 });
    await abrirBeats(page);

    await lineaDelDia(page, "AYER").click();
    await expect(page.locator(`#dia-${haceDias(1)}`)).toContainText("9:30 pm");
  });
});

test("con 20 dias se cargan 7, luego 7 mas al bajar, y al final nada mas", async ({ page }) => {
  // V015 y criterio 22.
  const { id } = await cuentaConId(page);
  for (let dia = 1; dia <= 19; dia++) {
    await sembrarMovimiento({ usuarioId: id, tipo: "escaneo", beats: 10, diasAtras: dia, marcaId: MARCA_KFC });
  }

  // Solo los pedidos de la pantalla de Beats: desde la v2.6.0 el Inicio
  // tambien lee el lote mas reciente (actividad y chip de la semana).
  const pedidos: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/rpc/historial_beats") && new URL(r.frame().url()).pathname === "/beats") {
      pedidos.push(r.postData() ?? "");
    }
  });

  await abrirBeats(page);
  await expect(lineasDeDias(page)).toHaveCount(7);

  const bajar = () => page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await bajar();
  await expect(lineasDeDias(page)).toHaveCount(14);
  await bajar();
  await expect(lineasDeDias(page)).toHaveCount(20);

  // Ya no hay mas: seguir bajando no pide nada.
  await bajar();
  await page.waitForTimeout(800);
  expect(pedidos).toHaveLength(3);
  expect(JSON.parse(pedidos[1]).p_antes_de).toBe(haceDias(6));
  await expect(lineasDeDias(page).last()).toContainText(etiquetaDia(haceDias(19)));
});
