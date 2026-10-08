import { expect, test, type Page } from "@playwright/test";

import { enmascararCedula, enmascararTelefono, iniciales, latiendoDesde } from "../../src/lib/perfil/formato";
import { cuentaConId } from "../ayudantes/beats";
import { cerrarSesionDesdePerfil, datosDeRegistro } from "../ayudantes/cuenta";
import { reiniciarMock, sembrarEscaneo } from "../ayudantes/mock";

/**
 * Perfil v1 (constitution §2, v2.11.0): solo lectura con los datos que ya
 * existen, "Pronto" para lo que no tiene flujo, banner al pie y cerrar sesion
 * con confirmacion.
 */
test.beforeEach(reiniciarMock);

test.describe("formatos", () => {
  test("iniciales: primera del nombre y primera del apellido", { tag: "@rapido" }, () => {
    expect(iniciales("Israel", "Maita")).toBe("IM");
    expect(iniciales(" ángel ", "ñúñez")).toBe("ÁÑ");
    expect(iniciales("Maria", "")).toBe("M");
  });

  test("cedula: la letra si la hay y los ultimos 4 digitos", { tag: "@rapido" }, () => {
    expect(enmascararCedula("V-12345678")).toEqual({
      visible: "V-••••5678",
      leida: "Cédula terminada en 5 6 7 8",
    });
    expect(enmascararCedula("e 8.123.456").visible).toBe("E-••••3456");
    expect(enmascararCedula("21537993").visible).toBe("••••7993");
  });

  test("telefono: 4 primeros y 4 ultimos digitos", { tag: "@rapido" }, () => {
    expect(enmascararTelefono("04241231977")).toEqual({
      visible: "0424 ••• 1977",
      leida: "Teléfono terminado en 1 9 7 7",
    });
    expect(enmascararTelefono("+58 (414) 123-4567").visible).toBe("5841 ••• 4567");
  });

  test("Latiendo desde: mes en minuscula, en hora de Caracas", { tag: "@rapido" }, () => {
    expect(latiendoDesde("2026-10-08T15:00:00Z")).toBe("Latiendo desde octubre 2026");
    // 1 de noviembre a las 02:00 UTC es todavia 31 de octubre en Caracas.
    expect(latiendoDesde("2026-11-01T02:00:00Z")).toBe("Latiendo desde octubre 2026");
    expect(latiendoDesde(null)).toBeNull();
    expect(latiendoDesde("no es fecha")).toBeNull();
  });
});

const barra = (page: Page) => page.getByRole("navigation", { name: "Principal" });

test.describe("pantalla", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("muestra nombre, chip del tipo, numeros y datos enmascarados", async ({ page }) => {
    const datos = datosDeRegistro({ telefono: "04241231977" });
    const { id } = await cuentaConId(page, datos);
    await sembrarEscaneo({ usuarioId: id, qrMarcaId: "b2000000-0000-4000-8000-000000000001" });
    await sembrarEscaneo({ usuarioId: id, qrMarcaId: "b2000000-0000-4000-8000-000000000002" });
    await page.goto("/perfil");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Maria Rodriguez");
    await expect(page.locator(".perfil-avatar")).toHaveText("MR");
    await expect(page.locator("[data-tipo-usuario]")).toHaveText("Estudiante UCV");
    await expect(page.getByText(/^Latiendo desde [a-z]+ \d{4}$/)).toBeVisible();

    // Beats = saldo (5 de bienvenida); Escaneos = los suyos; Canjes aun sin flujo.
    const numeros = page.getByRole("region", { name: "Tus números" });
    await expect(numeros.locator("[data-numero='Beats'] p").first()).toHaveText("5");
    await expect(numeros.locator("[data-numero='Escaneos'] p").first()).toHaveText("2");
    await expect(numeros.locator("[data-numero='Canjes'] p").first()).toHaveText("—sin datos todavía");

    const cedula = page.getByRole("definition").filter({ hasText: "V-••••5678" });
    await expect(cedula).toHaveAttribute("aria-label", "Cédula terminada en 5 6 7 8");
    const telefono = page.getByRole("definition").filter({ hasText: "0424 ••• 1977" });
    await expect(telefono).toHaveAttribute("aria-label", "Teléfono terminado en 1 9 7 7");
    await expect(page.getByRole("definition").filter({ hasText: datos.correo })).toBeVisible();
    // Ni el numero completo en pantalla ni "Editar": v1 es solo lectura.
    await expect(page.getByText("12345678")).toHaveCount(0);
    await expect(page.getByText("Editar")).toHaveCount(0);

    // Ningun boton de deslizar y la pestaña Perfil activa.
    await expect(page.locator("[data-boton-deslizar]")).toHaveCount(0);
    await expect(barra(page).getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");
  });

  test("Mis canjes y los ajustes sin pantalla van atenuados, con Pronto y sin tap", async ({ page }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    for (const nombre of ["Mis canjes", "Notificaciones", "Ayuda y contacto", "Términos y privacidad"]) {
      const fila = page.locator("[data-pronto]").filter({ hasText: nombre });
      await expect(fila, nombre).toHaveAttribute("aria-disabled", "true");
      await expect(fila, nombre).toHaveAttribute("role", "link");
      await expect(fila, nombre).not.toHaveAttribute("href");
      await expect(fila, nombre).toContainText("Pronto");
      await expect(fila, nombre).toHaveCSS("opacity", "0.55");
    }
    // Playwright no toca lo que esta aria-disabled: se fuerza para ver que no navega.
    await page.locator("[data-pronto]").filter({ hasText: "Mis canjes" }).click({ force: true });
    await expect(page).toHaveURL(/\/perfil$/);
  });

  test("Historial de Beats lleva a Beats", async ({ page }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    await page.getByRole("link", { name: /Historial de Beats/ }).click();
    await page.waitForURL("**/beats");
  });

  test("Cerrar sesión pide confirmación: Cancelar se queda, confirmar sale", async ({ page }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    await page.getByRole("main").getByRole("button", { name: "Cerrar sesión" }).click();
    const hoja = page.getByRole("dialog", { name: "¿Cerrar sesión?" });
    await expect(hoja).toBeVisible();
    // Los botones de la hoja son tap: sin circulo navy.
    await expect(hoja.locator(".circulo-flecha, .circulo-navy")).toHaveCount(0);
    await hoja.getByRole("button", { name: "Cancelar" }).click();
    await expect(hoja).toHaveCount(0);
    await expect(page).toHaveURL(/\/perfil$/);

    await cerrarSesionDesdePerfil(page);
    await page.waitForURL((url) => url.pathname === "/");
    await page.goto("/perfil");
    await page.waitForURL((url) => url.pathname === "/");
  });

  test("Eliminar mi cuenta solo informa", async ({ page }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Eliminar mi cuenta" }).click();
    const hoja = page.getByRole("dialog", { name: "Eliminar mi cuenta" });
    await expect(hoja).toContainText("Para eliminar tu cuenta escríbenos a soporte.");
    await hoja.getByRole("button", { name: "Entendido" }).click();
    await expect(hoja).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Maria Rodriguez");
  });

  test("como mucho dos capas con desenfoque: el avatar y la barra", async ({ page }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    const capas = await page.evaluate(() =>
      Array.from(document.querySelectorAll("body *"))
        .filter((el) => {
          const e = getComputedStyle(el);
          const filtro = e.backdropFilter || e.getPropertyValue("-webkit-backdrop-filter");
          return filtro && filtro !== "none";
        })
        .map((el) => el.className.toString()),
    );
    expect(capas).toHaveLength(2);
    expect(capas[0]).toContain("perfil-avatar");
    expect(capas[1]).toContain("vidrio-barra");
  });
});

test("a 375x667 todo se recorre y lo ultimo queda completo sobre la barra", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await cuentaConId(page);
  await page.goto("/perfil");
  // El banner tambien se ve en pantallas bajas: aqui la pagina se desplaza.
  await expect(page.locator("[data-banner-aliado='perfil-pie']")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  const ultimo = (await page.getByRole("button", { name: "Eliminar mi cuenta" }).boundingBox())!;
  const caja = (await barra(page).boundingBox())!;
  expect(ultimo.y + ultimo.height).toBeLessThanOrEqual(caja.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
