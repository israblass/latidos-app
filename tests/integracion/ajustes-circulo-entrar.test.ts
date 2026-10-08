import { expect, test, type Page } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { abrirBeats, cuentaConId } from "../ayudantes/beats";
import { reiniciarMock } from "../ayudantes/mock";

/**
 * Ajustes v2.13.0: la regla del circulo con flecha, "Ver historial"
 * deslizable, la pantalla de Entrar "heroe", "Cómo ganar" sin flecha y Beats
 * sin el "?".
 */
test.beforeEach(reiniciarMock);

const RAIZ = join(__dirname, "..", "..");

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

test("el circulo con flecha es solo del boton deslizable", { tag: "@rapido" }, () => {
  // Ningun componente fuera de BotonDeslizar pinta el circulo con flecha.
  const usos = archivos(join(RAIZ, "src"))
    .filter((ruta) => !ruta.endsWith(join("ui", "boton-deslizar.tsx")))
    .filter((ruta) => /CirculoFlecha|circulo-flecha|boton--flecha/.test(readFileSync(ruta, "utf8")))
    .map((ruta) => relative(RAIZ, ruta));
  expect(usos).toEqual([]);
});

test.describe("a 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Inicio: Ver historial es un deslizable navy con la manija a la izquierda", async ({ page }) => {
    await cuentaConId(page);
    const ver = page.getByRole("button", { name: "Desliza para ver tu historial" });
    const control = page.locator("[data-boton-deslizar]").filter({ has: ver });
    await expect(control).toHaveClass(/deslizar--navy/);
    await expect(control.locator(".deslizar__etiqueta")).toHaveText("Ver historial");
    const caja = (await control.boundingBox())!;
    const manija = (await ver.boundingBox())!;
    expect(manija.x - caja.x).toBeLessThan(12);
    // Ancho completo dentro de la tarjeta de "Actividad reciente".
    const tarjeta = (await page
      .locator("main div.rounded-\\[28px\\]")
      .filter({ has: control })
      .boundingBox())!;
    expect(caja.x).toBeGreaterThan(tarjeta.x);
    expect(caja.x + caja.width).toBeLessThan(tarjeta.x + tarjeta.width);
    expect(caja.width).toBeGreaterThan(tarjeta.width - 48);
    // Con el teclado tambien se activa.
    await ver.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/beats");
  });

  test("Beats: sin el '?' de la cabecera y Cómo ganar sin flecha", async ({ page }) => {
    await cuentaConId(page);
    await abrirBeats(page);
    await expect(page.getByRole("button", { name: "¿Cómo gano Beats?" })).toHaveCount(0);
    const comoGanar = page.getByRole("button", { name: "Cómo ganar" });
    await expect(comoGanar.locator("svg")).toHaveCount(0);
    await expect(comoGanar).toHaveClass(/vidrio-amarillo/);
  });

  test("Entrar: heroe, una tarjeta, Entrar tap amarillo y Crear cuenta blanco", async ({ page }) => {
    await page.goto("/entrar");
    const heroe = page.locator("[data-heroe-entrar]");
    await expect(heroe).toHaveAttribute("alt", "");
    await expect(heroe).toHaveAttribute("src", /corazon-audifonos/);
    const h = (await heroe.boundingBox())!;
    expect(h.width).toBeCloseTo(168, 0);
    expect(h.x + h.width / 2).toBeCloseTo(195, 0);
    expect(h.y).toBeCloseTo(96, -1);
    const titulo = page.getByRole("heading", { level: 1, name: "Qué bueno verte de nuevo" });
    await expect(titulo).toHaveCSS("font-size", "36px");
    await expect(titulo).toHaveCSS("text-transform", "uppercase");

    // Una sola tarjeta con los dos campos.
    const tarjeta = page.locator(".entrar-tarjeta");
    await expect(tarjeta).toHaveCount(1);
    await expect(tarjeta.getByLabel("Correo")).toBeVisible();
    await expect(tarjeta.getByLabel("Contraseña", { exact: true })).toBeVisible();
    await expect(tarjeta.getByRole("button", { name: "Mostrar contraseña" })).toBeVisible();
    await expect(tarjeta).toHaveCSS("border-radius", "28px");
    await expect(tarjeta.getByLabel("Correo")).toHaveCSS("font-size", "20px");
    await expect(tarjeta.getByLabel("Correo")).toHaveCSS("caret-color", "rgb(0, 144, 255)");
    await tarjeta.getByLabel("Correo").focus();
    expect(await tarjeta.evaluate((el) => getComputedStyle(el).boxShadow)).toContain(
      "rgb(0, 144, 255) 0px 0px 0px 2px",
    );
    await expect(page.getByText(/Olvidaste/)).toHaveCount(0);

    // Entrar: tap, sin circulo, apagado hasta llenar los dos campos.
    const entrar = page.getByRole("button", { name: "Entrar" });
    await expect(entrar).toHaveClass(/vidrio-amarillo/);
    await expect(entrar.locator(".circulo-flecha, .circulo-navy")).toHaveCount(0);
    await expect(entrar.locator("svg")).toHaveCount(1);
    expect((await entrar.boundingBox())!.height).toBe(64);
    await expect(entrar).toHaveAttribute("aria-disabled", "true");
    await tarjeta.getByLabel("Correo").fill("maria@correo.com");
    await expect(entrar).toHaveAttribute("aria-disabled", "true");
    await tarjeta.getByLabel("Contraseña", { exact: true }).fill("secreta1");
    await expect(entrar).toHaveAttribute("aria-disabled", "false");

    // Crear cuenta: boton de vidrio blanco, sin flecha, a ~34px del borde de abajo.
    const crear = page.getByRole("link", { name: "Crear cuenta" });
    await expect(crear).toHaveClass(/vidrio/);
    await expect(crear).not.toHaveClass(/vidrio-amarillo/);
    await expect(crear.locator("svg")).toHaveCount(0);
    const c = (await crear.boundingBox())!;
    expect(c.height).toBe(64);
    expect(844 - (c.y + c.height)).toBeCloseTo(34, -1);
    await expect(page.getByText("¿Todavía no tienes cuenta?")).toHaveCSS("font-size", "15px");

    // Dos capas con desenfoque: la tarjeta y Entrar.
    const capas = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("body *")).filter((el) => {
          const f = getComputedStyle(el).backdropFilter;
          return f && f !== "none";
        }).length,
    );
    expect(capas).toBe(2);
  });
});

/** Simula el teclado abierto: el visualViewport queda a la mitad de la ventana. */
async function conTecladoAbierto(page: Page) {
  await page.addInitScript(() => {
    const falso = new EventTarget() as EventTarget & { height: number; width: number };
    Object.defineProperty(falso, "height", { get: () => window.innerHeight * 0.5 });
    Object.defineProperty(falso, "width", { get: () => window.innerWidth });
    Object.defineProperty(window, "visualViewport", { value: falso, configurable: true });
  });
}

for (const [ancho, alto] of [
  [390, 844],
  [375, 667],
] as const) {
  test(`Entrar a ${ancho}x${alto} con el teclado abierto: sin corazon, campos y Entrar a la vista`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: ancho, height: alto });
    await conTecladoAbierto(page);
    await page.goto("/entrar");
    await expect(page.locator("main.entrar")).toHaveAttribute("data-teclado", "");
    await expect(page.locator("[data-heroe-entrar]")).toBeHidden();
    const visible = alto * 0.5;
    for (const pieza of [page.getByLabel("Correo"), page.getByRole("button", { name: "Entrar" })]) {
      const caja = (await pieza.boundingBox())!;
      expect(caja.y + caja.height).toBeLessThanOrEqual(visible);
    }
  });
}
