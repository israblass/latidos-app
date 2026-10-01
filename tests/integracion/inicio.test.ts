import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { auditar, informe } from "../ayudantes/accesibilidad";
import { cuentaEnInicio } from "../ayudantes/cuenta";
import { ponerBanners, reiniciarMock, simularFalla } from "../ayudantes/mock";

/**
 * Inicio: carrusel de banners y "Qué es Latidos" con sus fases.
 *
 * Los banners salen de la tabla `banners` (en el mock, /rest/v1/banners). Pase
 * lo que pase con ella, el carrusel nunca queda vacio ni muestra un error: en
 * su lugar va el banner provisional dibujado en codigo.
 */
test.beforeEach(reiniciarMock);

const carrusel = (page: Page) => page.getByRole("region", { name: "Anuncios" });
const anuncioActivo = (page: Page) => carrusel(page).locator("[data-banner-activo]");
const punto = (page: Page, n: number, total: number) =>
  carrusel(page).getByRole("button", { name: `Ver anuncio ${n} de ${total}` });
const provisional = (page: Page) => carrusel(page).getByText("Anúnciate en Latidos");

/** Indice (desde 1) del punto marcado como actual. */
async function puntoActual(page: Page) {
  const etiqueta = await carrusel(page)
    .locator("button[aria-current='true']")
    .getAttribute("aria-label");
  return Number(/Ver anuncio (\d+)/.exec(etiqueta ?? "")?.[1]);
}

const imagenCargada = (page: Page, indice: number) =>
  carrusel(page)
    .locator("img")
    .nth(indice)
    .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);

test.describe("banners", () => {
  test("con filas: los tres banners en su orden, con alt y puntos", async ({ page }) => {
    await cuentaEnInicio(page);

    const imagenes = carrusel(page).locator("img");
    await expect(imagenes).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(imagenes.nth(i)).toHaveAttribute("alt", "Tu marca aquí");
      await expect.poll(() => imagenCargada(page, i)).toBe(true);
    }
    const fuentes = await imagenes.evaluateAll((nodos) =>
      nodos.map((n) => decodeURIComponent((n as HTMLImageElement).currentSrc)),
    );
    expect(fuentes[0]).toContain("tu-marca-aqui-corazon.webp");
    expect(fuentes[1]).toContain("tu-marca-aqui-donaciones.webp");
    expect(fuentes[2]).toContain("tu-marca-aqui-ecg.webp");

    await expect(carrusel(page).getByRole("button", { name: /Ver anuncio/ })).toHaveCount(3);
    expect(await puntoActual(page)).toBe(1);
    // Sin enlace, la tarjeta no se puede tocar.
    await expect(carrusel(page).getByRole("link")).toHaveCount(0);
    await expect(provisional(page)).toHaveCount(0);
  });

  test("sin filas: el banner provisional, sin puntos", async ({ page }) => {
    await ponerBanners([]);
    await cuentaEnInicio(page);

    await expect(provisional(page)).toBeVisible();
    await expect(carrusel(page).getByText("Tu marca aquí")).toBeVisible();
    await expect(carrusel(page).locator("img")).toHaveCount(0);
    await expect(carrusel(page).getByRole("button")).toHaveCount(0);
  });

  test("si la lectura falla: el provisional y ningun error a la vista", async ({ page }) => {
    await simularFalla("banners", true);
    await cuentaEnInicio(page);

    await expect(provisional(page)).toBeVisible();
    await expect(page.getByText(/error|No pudimos/i)).toHaveCount(0);
    // El resto de Inicio sigue en pie.
    await expect(page.getByRole("link", { name: /Ver mis Beats/ })).toBeVisible();
  });

  test("una imagen que no existe se cambia por el provisional", async ({ page }) => {
    await ponerBanners([
      { titulo: "Marca rota", imagen_url: "/banners/no-existe.webp" },
      { titulo: "Marca buena", imagen_url: "/banners/tu-marca-aqui-ecg.webp" },
    ]);
    await cuentaEnInicio(page);

    const primero = carrusel(page).getByRole("group", { name: "1 de 2" });
    await expect(primero.getByText("Anúnciate en Latidos")).toBeVisible();
    await expect(primero.locator("img")).toHaveCount(0);
    const segundo = carrusel(page).getByRole("group", { name: "2 de 2", includeHidden: true });
    await expect(segundo.locator("img")).toHaveAttribute("alt", "Marca buena");
  });

  test("sin imagen_url tambien va el provisional", async ({ page }) => {
    await ponerBanners([{ titulo: "Sin arte", imagen_url: null }]);
    await cuentaEnInicio(page);
    await expect(provisional(page)).toBeVisible();
  });

  test("con enlace, toda la tarjeta abre en otra pestaña", async ({ page }) => {
    await ponerBanners([
      {
        titulo: "Marca con enlace",
        imagen_url: "/banners/tu-marca-aqui-corazon.webp",
        enlace_url: "https://ejemplo.com/promo",
      },
    ]);
    await cuentaEnInicio(page);

    const enlace = carrusel(page).getByRole("link", { name: "Marca con enlace" });
    await expect(enlace).toHaveAttribute("href", "https://ejemplo.com/promo");
    await expect(enlace).toHaveAttribute("target", "_blank");
    await expect(enlace).toHaveAttribute("rel", "noopener noreferrer");
    // La tarjeta entera: el enlace ocupa todo el banner.
    const cajaEnlace = await enlace.boundingBox();
    const cajaBanner = await anuncioActivo(page).boundingBox();
    // Con 1 px de margen por el redondeo de subpixeles.
    expect(Math.abs(cajaEnlace!.width - cajaBanner!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(cajaEnlace!.height - cajaBanner!.height)).toBeLessThanOrEqual(1);
  });

  test("rota sola cada 5 s y se detiene mientras se toca", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.clock.install();
    await page.reload();
    await expect(carrusel(page).locator("img")).toHaveCount(3);
    expect(await puntoActual(page)).toBe(1);

    await page.clock.runFor(4000);
    expect(await puntoActual(page)).toBe(1);
    await page.clock.runFor(1100);
    await expect.poll(() => puntoActual(page)).toBe(2);
    await page.clock.runFor(5100);
    await expect.poll(() => puntoActual(page)).toBe(3);
    // Despues del ultimo vuelve al primero.
    await page.clock.runFor(5100);
    await expect.poll(() => puntoActual(page)).toBe(1);

    // Con el dedo encima no se mueve.
    const caja = (await anuncioActivo(page).boundingBox())!;
    await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await page.mouse.down();
    await page.clock.runFor(12000);
    expect(await puntoActual(page)).toBe(1);
    await page.mouse.up();
    await page.clock.runFor(5100);
    await expect.poll(() => puntoActual(page)).toBe(2);
  });

  test("se desliza con el dedo y con los puntos", async ({ page }) => {
    await cuentaEnInicio(page);
    await expect(carrusel(page).locator("img")).toHaveCount(3);

    const caja = (await anuncioActivo(page).boundingBox())!;
    const y = caja.y + caja.height / 2;
    await page.mouse.move(caja.x + caja.width - 20, y);
    await page.mouse.down();
    await page.mouse.move(caja.x + caja.width / 2, y, { steps: 6 });
    await page.mouse.move(caja.x + 20, y, { steps: 6 });
    await page.mouse.up();
    await expect.poll(() => puntoActual(page)).toBe(2);

    // Hacia el otro lado vuelve.
    await page.mouse.move(caja.x + 20, y);
    await page.mouse.down();
    await page.mouse.move(caja.x + caja.width - 20, y, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => puntoActual(page)).toBe(1);

    await punto(page, 3, 3).click();
    await expect.poll(() => puntoActual(page)).toBe(3);
  });

  test("con prefers-reduced-motion no rota sola", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await cuentaEnInicio(page);
    await page.clock.install();
    await page.reload();
    await expect(carrusel(page).locator("img")).toHaveCount(3);

    await page.clock.runFor(16000);
    expect(await puntoActual(page)).toBe(1);
    // A mano si cambia.
    await punto(page, 2, 3).click();
    await expect.poll(() => puntoActual(page)).toBe(2);
  });

  test("los banners no tocan los Beats", async ({ page }) => {
    await cuentaEnInicio(page);
    const contador = page.locator("section[aria-label='Tu balance de Beats'] p.font-display");
    await expect(contador).toHaveText("5");
    await punto(page, 2, 3).click();
    await anuncioActivo(page).click();
    await page.reload();
    await expect(contador).toHaveText("5");
  });
});

/** "Qué es Latidos" nace cerrado: se abre desde su acordeon (v2.6.0). */
async function abrirQueEsLatidos(page: Page) {
  const boton = page.getByRole("heading", { level: 2, name: /Qué es Latidos/ }).getByRole("button");
  if ((await boton.getAttribute("aria-expanded")) !== "true") await boton.click();
  await expect(boton).toHaveAttribute("aria-expanded", "true");
}

test.describe("Qué es Latidos", () => {
  test("parrafo y tres fases con su estado", async ({ page }) => {
    await cuentaEnInicio(page);
    await abrirQueEsLatidos(page);

    const seccion = page.getByRole("region", { name: "Qué es Latidos" });
    await expect(page.getByRole("heading", { level: 2, name: /Qué es Latidos/ })).toBeVisible();
    await expect(seccion).toContainText(
      "Latidos es el programa de la UCV que une a estudiantes, marcas y comunidad durante seis meses, de septiembre de 2026 a marzo de 2027.",
    );

    const fases = seccion.getByRole("list", { name: "Fases del programa" }).getByRole("listitem");
    await expect(fases).toHaveCount(3);
    await expect(fases.nth(0)).toContainText("Pulso");
    await expect(fases.nth(0)).toContainText("15 sept - 30 mar");
    await expect(fases.nth(0)).toContainText("En curso");
    await expect(fases.nth(0)).toContainText("terremoto de La Guaira");
    await expect(fases.nth(1)).toContainText("Empuje");
    await expect(fases.nth(1)).toContainText("18 dic 2026");
    await expect(fases.nth(1)).toContainText("Próximamente");
    await expect(fases.nth(1)).toContainText("Gaitazo y Misa de Acción de Gracias");
    await expect(fases.nth(2)).toContainText("Late Venezuela");
    await expect(fases.nth(2)).toContainText("23 al 27 mar 2027");
    await expect(fases.nth(2)).toContainText("Próximamente");
    await expect(fases.nth(2)).toContainText("concierto de cierre el 27 de marzo");
  });

  test("a 360 px se lee y la pagina no se desplaza de lado", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await cuentaEnInicio(page);
    await abrirQueEsLatidos(page);

    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho).toBeLessThanOrEqual(360);

    const primera = page.getByRole("list", { name: "Fases del programa" }).getByRole("listitem").first();
    const caja = (await primera.boundingBox())!;
    expect(caja.width).toBeGreaterThanOrEqual(240);
    // El texto no se sale de la tarjeta.
    const desborda = await primera.evaluate((li) => li.scrollWidth > li.clientWidth);
    expect(desborda).toBe(false);
  });

  test("orden: pildoras, saludo, contador, Escanear, banners y acordeones", async ({ page }) => {
    await cuentaEnInicio(page);
    const y = async (selector: ReturnType<Page["locator"]>) => (await selector.boundingBox())!.y;

    const pildoras = await y(page.getByRole("button", { name: "Cómo gano Beats" }));
    const saludo = await y(page.locator("[data-saludo]"));
    const contador = await y(page.getByRole("region", { name: "Tu balance de Beats" }));
    const escanear = await y(page.getByRole("main").getByRole("link", { name: "Escanear QR" }));
    const banners = await y(carrusel(page));
    const actividad = await y(page.getByRole("heading", { level: 2, name: /Actividad reciente/ }));
    const queEs = await y(page.getByRole("heading", { level: 2, name: /Qué es Latidos/ }));
    expect(pildoras).toBeLessThan(saludo);
    expect(saludo).toBeLessThan(contador);
    expect(contador).toBeLessThan(escanear);
    expect(escanear).toBeLessThan(banners);
    expect(banners).toBeLessThan(actividad);
    expect(actividad).toBeLessThan(queEs);
  });

  test("el contador sigue llevando a Beats", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.getByRole("link", { name: /Ver mis Beats/ }).click();
    await page.waitForURL("**/beats");
  });
});

test.describe("accesibilidad de Inicio", () => {
  test("axe sin violaciones y la auditoria propia limpia", async ({ page }) => {
    await cuentaEnInicio(page);
    await expect(carrusel(page).locator("img")).toHaveCount(3);

    const resultado = await new AxeBuilder({ page }).analyze();
    expect(
      resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
    ).toEqual([]);

    const hallazgos = await auditar(page);
    expect(hallazgos, informe("inicio con banners", hallazgos)).toEqual([]);
  });

  test("axe tambien con el banner provisional", async ({ page }) => {
    await ponerBanners([]);
    await cuentaEnInicio(page);
    await expect(provisional(page)).toBeVisible();
    const resultado = await new AxeBuilder({ page }).analyze();
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
  });
});
