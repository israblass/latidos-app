import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { auditar, informe } from "../ayudantes/accesibilidad";
import { abrirBeats, cuentaConId } from "../ayudantes/beats";
import { cuentaEnInicio } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";
import { NAVY, NEGRO, aColor, contraste, filtrar, recetaDe, sobre } from "../ayudantes/vidrio";

/**
 * Menu inferior flotante (constitution §2, v2.4.0): pildora de vidrio separada
 * de los bordes, con la pestaña activa en su propia pildora amarilla que se
 * desliza. Mismas pestañas, rutas y visibilidad que antes.
 */
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(reiniciarMock);

const barra = (page: Page) => page.getByRole("navigation", { name: "Principal" });
const pildora = (page: Page) => barra(page).locator("[data-pildora-activa]");
const pestana = (page: Page, nombre: string) => barra(page).getByRole("link", { name: nombre });

/** Centro horizontal de la pildora y de una pestaña, para ver si coinciden. */
async function pildoraSobre(page: Page, nombre: string) {
  const p = (await pildora(page).boundingBox())!;
  const t = (await pestana(page, nombre).boundingBox())!;
  return Math.abs(p.x + p.width / 2 - (t.x + t.width / 2));
}

test("es una pildora flotante separada de los bordes, de 64px", async ({ page }) => {
  await cuentaEnInicio(page);
  const caja = (await barra(page).boundingBox())!;
  expect(Math.round(caja.x)).toBe(12);
  expect(Math.round(390 - (caja.x + caja.width))).toBe(12);
  expect(Math.round(844 - (caja.y + caja.height))).toBe(8);
  expect(Math.round(caja.height)).toBe(64);
  await expect(barra(page)).toHaveCSS("border-top-left-radius", "9999px");
  await expect(barra(page)).toHaveClass(/\bvidrio-barra\b/);

  // En pantallas anchas: 480px y centrada.
  await page.setViewportSize({ width: 1024, height: 768 });
  const ancha = (await barra(page).boundingBox())!;
  expect(Math.round(ancha.width)).toBe(480);
  expect(Math.round(ancha.x)).toBe(Math.round((1024 - 480) / 2));
});

test("las cinco pestañas de siempre, con etiqueta y area tactil", async ({ page }) => {
  await cuentaEnInicio(page);
  await expect(barra(page).getByRole("listitem")).toHaveCount(5);
  await expect(barra(page).getByRole("link")).toHaveText(["Inicio", "Escanear", "Beats", "Perfil"]);
  await expect(barra(page).getByRole("button", { name: "Pulso" })).toBeDisabled();

  for (const nombre of ["Inicio", "Escanear", "Beats", "Perfil"]) {
    const caja = (await pestana(page, nombre).boundingBox())!;
    expect(caja.width, nombre).toBeGreaterThanOrEqual(44);
    expect(caja.height, nombre).toBeGreaterThanOrEqual(44);
    const etiqueta = pestana(page, nombre).locator("span").last();
    await expect(etiqueta).toBeVisible();
    await expect(etiqueta).toHaveCSS("font-size", "11px");
  }

  // Activa: navy y en negrita sobre la pildora amarilla. Inactivas: gris.
  await expect(pestana(page, "Inicio")).toHaveAttribute("aria-current", "page");
  await expect(pestana(page, "Inicio")).toHaveCSS("color", "rgb(26, 35, 50)");
  await expect(pestana(page, "Inicio").locator("span").last()).toHaveCSS("font-weight", "700");
  // Gris de texto sobre vidrio (--vidrio-texto-tenue, #4A5160).
  await expect(pestana(page, "Beats")).toHaveCSS("color", "rgb(74, 81, 96)");
  await expect(pildora(page)).toHaveCSS("background-color", "rgb(253, 251, 5)");
  expect(await pildoraSobre(page, "Inicio")).toBeLessThanOrEqual(2);

  // El hueco de la insignia existe en el codigo, pero hoy no se ve ninguna.
  await expect(barra(page).locator("[data-insignia]")).toHaveCount(0);
});

test("navegar cambia aria-current y la pildora se desliza desde la pestaña anterior", async ({ page }) => {
  await cuentaEnInicio(page);
  await expect(pildora(page)).toHaveCSS("transition-duration", "0.25s");

  // Se graban las posiciones que toma la pildora durante la navegacion.
  await page.evaluate(() => {
    const w = window as unknown as { __posiciones: string[] };
    w.__posiciones = [];
    new MutationObserver(() => {
      const p = document.querySelector<HTMLElement>("[data-pildora-activa]");
      if (p) w.__posiciones.push(p.style.transform);
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
  });

  await pestana(page, "Beats").click();
  await page.waitForURL("**/beats");
  await expect(pestana(page, "Beats")).toHaveAttribute("aria-current", "page");
  await expect(pestana(page, "Inicio")).not.toHaveAttribute("aria-current", /.+/);
  await expect.poll(() => pildoraSobre(page, "Beats")).toBeLessThanOrEqual(2);
  const posiciones = await page.evaluate(() => (window as unknown as { __posiciones: string[] }).__posiciones);
  // Arranco en Inicio (0) y termino en Beats (3).
  expect(posiciones).toContain("translateX(0%)");
  expect(posiciones[posiciones.length - 1]).toBe("translateX(300%)");

  await pestana(page, "Perfil").click();
  await page.waitForURL("**/perfil");
  await expect(pestana(page, "Perfil")).toHaveAttribute("aria-current", "page");
  await expect.poll(() => pildoraSobre(page, "Perfil")).toBeLessThanOrEqual(2);

  await pestana(page, "Inicio").click();
  await page.waitForURL("**/inicio");
  await expect(pestana(page, "Inicio")).toHaveAttribute("aria-current", "page");
  await expect.poll(() => pildoraSobre(page, "Inicio")).toBeLessThanOrEqual(2);
});

test("con prefers-reduced-motion la pildora cambia sin animar", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await cuentaEnInicio(page);
  const duracion = await pildora(page).evaluate((p) => parseFloat(getComputedStyle(p).transitionDuration));
  expect(duracion).toBeLessThan(0.001);
});

test("foco visible: contorno navy de 2px con separacion", async ({ page }) => {
  await cuentaEnInicio(page);
  await pestana(page, "Beats").focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const enlace = pestana(page, "Beats");
  await expect(enlace).toBeFocused();
  await expect(enlace).toHaveCSS("outline-style", "solid");
  await expect(enlace).toHaveCSS("outline-width", "2px");
  await expect(enlace).toHaveCSS("outline-color", "rgb(26, 35, 50)");
  await expect(enlace).toHaveCSS("outline-offset", "2px");
});

/** El ultimo elemento del <main>, ya con la pagina al final. */
async function ultimoQuedaLibre(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  const ultimo = await page.evaluate(() => {
    const hijos = Array.from(document.querySelector("main")!.children).filter((h) => {
      const c = h.getBoundingClientRect();
      return c.height > 0 && getComputedStyle(h).position !== "absolute";
    });
    const c = hijos[hijos.length - 1].getBoundingClientRect();
    return { abajo: c.bottom, alto: innerHeight };
  });
  const caja = (await barra(page).boundingBox())!;
  return { abajoDelUltimo: ultimo.abajo, arribaDeLaBarra: caja.y };
}

test("al final de cada pantalla el ultimo elemento se ve completo, por encima de la barra", async ({ page }) => {
  await cuentaConId(page);
  for (const ruta of ["/inicio", "/beats", "/perfil"]) {
    if (ruta === "/beats") await abrirBeats(page);
    else await page.goto(ruta);
    const { abajoDelUltimo, arribaDeLaBarra } = await ultimoQuedaLibre(page);
    expect(abajoDelUltimo, ruta).toBeLessThanOrEqual(arribaDeLaBarra);
  }
});

test("contraste AA de la barra sobre el crema y sobre contenido oscuro que pase por debajo", async ({ page }) => {
  await cuentaEnInicio(page);
  const receta = await recetaDe(barra(page));
  const crema = aColor(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).rgb;
  const amarillo = aColor(await pildora(page).evaluate((p) => getComputedStyle(p).backgroundColor)).rgb;
  const gris = aColor(await pestana(page, "Beats").evaluate((a) => getComputedStyle(a).color)).rgb;
  expect(gris).toEqual(receta.textoTenue);
  const razones = {
    "gris sobre crema": contraste(gris, sobre(receta.tinte, filtrar(crema, receta.saturacion, receta.brillo))),
    // El peor caso posible: negro puro pasando por debajo (el filtro no lo aclara).
    "gris sobre negro": contraste(gris, sobre(receta.tinte, NEGRO)),
    "navy sobre amarillo": contraste(NAVY, amarillo),
  };
  for (const [caso, razon] of Object.entries(razones)) expect(razon, caso).toBeGreaterThanOrEqual(4.5);

  // Con el banner (azul) pasando por debajo de la barra: axe y la auditoria.
  const banner = page.getByRole("region", { name: "Anuncios" });
  const cajaBanner = (await banner.boundingBox())!;
  const cajaBarra = (await barra(page).boundingBox())!;
  await page.evaluate((y) => window.scrollTo(0, y), cajaBanner.y - cajaBarra.y + 20);
  await page.waitForTimeout(300);
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  const hallazgos = await auditar(page);
  expect(hallazgos, informe("barra sobre el banner", hallazgos)).toEqual([]);
});

test("se ve solo donde se veia: no en bienvenida, entrar, escaner ni sin conexion", async ({ page }) => {
  for (const ruta of ["/", "/entrar", "/registro/paso-1", "/sin-conexion"]) {
    await page.goto(ruta);
    await expect(barra(page), ruta).toHaveCount(0);
  }
  await cuentaEnInicio(page);
  await expect(barra(page)).toBeVisible();
  await page.goto("/escanear");
  await expect(barra(page)).toHaveCount(0);

  // Con una hoja abierta, la hoja queda encima: la barra no se puede tocar.
  await abrirBeats(page);
  await page.getByRole("button", { name: "¿Cómo gano Beats?" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const caja = (await barra(page).boundingBox())!;
  const encima = await page.evaluate(
    ([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest("nav[aria-label='Principal']")),
    [caja.x + caja.width / 2, caja.y + caja.height / 2],
  );
  expect(encima).toBe(false);
});

test("el componente no define vidrio propio: usa la clase central", () => {
  const codigo = readFileSync(
    join(__dirname, "..", "..", "src", "components", "navegacion", "tab-bar.tsx"),
    "utf8",
  );
  expect(codigo).not.toMatch(/backdrop-filter|backdropFilter|backdrop-blur|backdrop-saturate/);
  expect(codigo).not.toMatch(/rgba\(255,\s*255,\s*255/);
  expect(codigo).toContain('"vidrio-barra ');
});
