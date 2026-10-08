import { expect, test, type Page } from "@playwright/test";

import { cuentaConId } from "../ayudantes/beats";
import { cuentaEnInicio } from "../ayudantes/cuenta";
import { reiniciarMock, sembrarMovimiento } from "../ayudantes/mock";
import { cortarRed, volverRed } from "../ayudantes/red";

/**
 * Pulido de la v2.9.0: techo de nubes y circulos del pulso en el Inicio, y el
 * boton de deslizar de "Escanear QR".
 *
 * Solo Chromium: el gesto de arrastre y el vidrio hay que validarlos ademas
 * en un iPhone real (WebKit no esta disponible en este entorno).
 */
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(reiniciarMock);

const deslizar = (page: Page) => page.locator("[data-boton-deslizar]");
const circulo = (page: Page) =>
  page.getByRole("button", { name: "Escanear QR. Desliza o toca para abrir el escáner." });

/** Arrastra el circulo con el mouse hasta `fraccion` del recorrido. */
async function arrastrar(page: Page, fraccion: number) {
  const control = (await deslizar(page).boundingBox())!;
  const c = (await circulo(page).boundingBox())!;
  const recorrido = control.width - c.width - 16;
  const x0 = c.x + c.width / 2;
  const y = c.y + c.height / 2;
  await page.mouse.move(x0, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x0 + (recorrido * fraccion * i) / 10, y);
  await page.mouse.up();
}

test.describe("boton de deslizar", () => {
  test("arrastrar pasado el umbral navega a /escanear", async ({ page }) => {
    await cuentaEnInicio(page);
    await arrastrar(page, 0.95);
    await page.waitForURL("**/escanear**");
  });

  test("un arrastre corto regresa y no navega", async ({ page }) => {
    await cuentaEnInicio(page);
    await arrastrar(page, 0.5);
    // Regresa al inicio del recorrido y la etiqueta vuelve a verse.
    await expect
      .poll(() => circulo(page).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41))
      .toBe(0);
    await expect(deslizar(page).locator(".deslizar__etiqueta")).toHaveCSS("opacity", "1");
    await page.waitForTimeout(600);
    expect(new URL(page.url()).pathname).toBe("/inicio");
  });

  test("mientras arrastra, la etiqueta se desvanece y el tinte se llena", async ({ page }) => {
    await cuentaEnInicio(page);
    const c = (await circulo(page).boundingBox())!;
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
    await page.mouse.down();
    await page.mouse.move(c.x + c.width / 2 + 120, c.y + c.height / 2, { steps: 6 });
    const opacidad = Number(await deslizar(page).locator(".deslizar__etiqueta").evaluate((el) => getComputedStyle(el).opacity));
    expect(opacidad).toBeLessThan(1);
    const relleno = await deslizar(page).locator(".deslizar__relleno").evaluate((el) => el.getBoundingClientRect().width);
    expect(relleno).toBeGreaterThan(120);
    await page.mouse.up();
  });

  test("un toque simple en el circulo navega", async ({ page }) => {
    await cuentaEnInicio(page);
    await circulo(page).click();
    await page.waitForURL("**/escanear**");
  });

  test("un toque en la etiqueta tambien navega", async ({ page }) => {
    await cuentaEnInicio(page);
    const control = (await deslizar(page).boundingBox())!;
    await page.mouse.click(control.x + control.width * 0.6, control.y + control.height / 2);
    await page.waitForURL("**/escanear**");
  });

  test("Enter con el circulo enfocado navega, y Espacio tambien", async ({ page }) => {
    await cuentaEnInicio(page);
    await circulo(page).focus();
    await expect(circulo(page)).toBeFocused();
    // Foco visible: contorno azul.
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(circulo(page)).toHaveCSS("outline-color", "rgb(0, 144, 255)");
    await page.keyboard.press("Enter");
    await page.waitForURL("**/escanear**");

    await page.goto("/inicio");
    await circulo(page).focus();
    await page.keyboard.press(" ");
    await page.waitForURL("**/escanear**");
  });

  test("colores de paleta, area tactil y solo en Escanear QR", async ({ page }) => {
    await cuentaEnInicio(page);
    await expect(deslizar(page)).toHaveCount(1);
    await expect(deslizar(page)).toHaveCSS("background-color", "rgb(253, 251, 5)");
    await expect(deslizar(page)).toHaveCSS("height", "64px");
    await expect(circulo(page)).toHaveCSS("background-color", "rgb(26, 35, 50)");
    await expect(circulo(page)).toHaveCSS("touch-action", "none");
    const c = (await circulo(page).boundingBox())!;
    expect(c.width).toBeGreaterThanOrEqual(44);
    expect(c.height).toBeGreaterThanOrEqual(44);
    // Sin enlace arrastrable adentro.
    await expect(deslizar(page).locator("a")).toHaveCount(0);
    // "Ver historial" sigue siendo un enlace de toque.
    await expect(page.getByRole("link", { name: "Ver historial" })).toHaveCount(1);
  });

  test("con movimiento normal hay destello; con prefers-reduced-motion, no", async ({ page }) => {
    await cuentaEnInicio(page);
    const span = deslizar(page).locator(".deslizar__etiqueta span");
    expect(await span.evaluate((el) => getComputedStyle(el).animationName)).toBe("destello-deslizar");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await span.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    // El arrastre sigue funcionando.
    await arrastrar(page, 0.95);
    await page.waitForURL("**/escanear**");
  });
});

test.describe("boton de deslizar con el dedo", () => {
  test.use({ hasTouch: true, isMobile: true });

  type Cdp = Awaited<ReturnType<ReturnType<Page["context"]>["newCDPSession"]>>;

  // Una sola sesion para todo el gesto: el navegador lleva la cuenta del
  // toque en curso por sesion.
  const tocar = (cdp: Cdp, tipo: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
    cdp.send("Input.dispatchTouchEvent", { type: tipo, touchPoints: tipo === "touchEnd" ? [] : [{ x, y }] });

  test("deslizar con el dedo pasado el umbral navega; uno corto no", async ({ page }) => {
    await cuentaEnInicio(page);
    const control = (await deslizar(page).boundingBox())!;
    const c = (await circulo(page).boundingBox())!;
    const y = c.y + c.height / 2;
    const x0 = c.x + c.width / 2;
    const recorrido = control.width - c.width - 16;
    const cdp = await page.context().newCDPSession(page);

    // Corto: regresa y se queda en el Inicio.
    await tocar(cdp, "touchStart", x0, y);
    for (let i = 1; i <= 8; i++) await tocar(cdp, "touchMove", x0 + (recorrido * 0.4 * i) / 8, y);
    await tocar(cdp, "touchEnd", x0 + recorrido * 0.4, y);
    await page.waitForTimeout(700);
    expect(new URL(page.url()).pathname).toBe("/inicio");

    // Largo: llega a /escanear.
    await tocar(cdp, "touchStart", x0, y);
    for (let i = 1; i <= 8; i++) await tocar(cdp, "touchMove", x0 + (recorrido * 0.95 * i) / 8, y);
    await tocar(cdp, "touchEnd", x0 + recorrido * 0.95, y);
    await page.waitForURL("**/escanear**");
  });
});

test.describe("ilustraciones del Inicio", () => {
  test("techo de nubes y circulos: decorativos, con tamaño fijo y sin interceptar toques", async ({ page }) => {
    await cuentaEnInicio(page);
    const techo = page.locator("[data-techo-nubes]");
    const circulos = page.locator("[data-circulos-pulso]");
    for (const deco of [techo, circulos]) {
      await expect(deco).toHaveAttribute("aria-hidden", "true");
      await expect(deco).toHaveCSS("pointer-events", "none");
      const img = deco.locator("img");
      await expect(img).toHaveAttribute("alt", "");
      await expect(img).toHaveAttribute("width", /\d+/);
      await expect(img).toHaveAttribute("height", /\d+/);
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    }
    await expect(techo.locator("img")).toHaveAttribute("fetchpriority", "low");

    // La franja nace en el borde de arriba, mide 120px (sin zona segura) y
    // las pildoras van debajo.
    const caja = (await techo.boundingBox())!;
    expect(caja.y).toBe(0);
    expect(caja.height).toBe(120);
    expect(caja.width).toBe(390);
    const campana = (await page.getByRole("button", { name: "Notificaciones" }).boundingBox())!;
    expect(campana.y).toBeGreaterThanOrEqual(caja.y + caja.height);
    expect(await techo.evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage)).toContain(
      "linear-gradient",
    );

    // Un toque sobre los circulos llega a la tarjeta (enlace a Beats).
    const zona = (await circulos.boundingBox())!;
    const x = zona.x + zona.width - 30;
    const y = zona.y + zona.height / 2 + 10;
    const debajo = await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest("a")?.getAttribute("href"), [x, y]);
    expect(debajo).toBe("/beats");
    await page.mouse.click(x, y);
    await page.waitForURL("**/beats");
  });

  test("el techo y los circulos solo estan en el Inicio", async ({ page }) => {
    await cuentaEnInicio(page);
    for (const ruta of ["/beats", "/perfil"]) {
      await page.goto(ruta);
      await expect(page.locator("[data-techo-nubes], [data-circulos-pulso]")).toHaveCount(0);
    }
  });

  for (const ancho of [320, 360, 390, 430]) {
    test(`a ${ancho}px los anillos no cruzan la etiqueta ni el numero`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 844 });
      const { id } = await cuentaConId(page);
      // Tres cifras: 5 de bienvenida + 120.
      await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 120 });
      await page.reload();
      const tarjeta = page.locator("section[aria-label='Tu balance de Beats'] > a");
      await expect(tarjeta.locator("p.font-display")).toHaveText("125");
      const img = tarjeta.locator("[data-circulos-pulso] img");
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete)).toBe(true);
      const choques = await page.evaluate(() => {
        const t = document.querySelector("section[aria-label='Tu balance de Beats'] > a")!;
        const r = t.querySelector("[data-circulos-pulso] img")!.getBoundingClientRect();
        // El trazo ocupa del px 10 al 469 de un lienzo de 480: radio 0.478.
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const radio = r.width * 0.478;
        const textos = [
          Array.from(t.querySelectorAll("span")).find((s) => s.textContent === "Beats acumulados")!,
          t.querySelector("p.font-display")!,
        ];
        return textos
          .map((el) => {
            // Caja del texto, no del bloque: con un Range.
            const rango = document.createRange();
            rango.selectNodeContents(el);
            const b = rango.getBoundingClientRect();
            const px = Math.max(b.left, Math.min(cx, b.right));
            const py = Math.max(b.top, Math.min(cy, b.bottom));
            return { texto: el.textContent, distancia: Math.hypot(px - cx, py - cy) - radio };
          })
          .filter((c) => c.distancia < 0);
      });
      expect(choques).toEqual([]);
    });
  }

  test("sin red, las dos ilustraciones se sirven de lo guardado", async ({ page, context }) => {
    await cuentaEnInicio(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    // La primera carga no pasa por el service worker: la segunda guarda.
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await page.reload();
    const rutas = ["/ilustraciones/techo-nubes.webp", "/ilustraciones/circulos-pulso.webp"];
    await expect
      .poll(() =>
        page.evaluate(
          (lista) => caches.open("latidos-shell-v17").then((c) => Promise.all(lista.map((r) => c.match(r).then(Boolean)))),
          rutas,
        ),
      )
      .toEqual([true, true]);
    await cortarRed(context);
    const anchos = await page.evaluate(async (lista) => {
      const salida: number[] = [];
      for (const ruta of lista) {
        const img = new Image();
        img.src = `${ruta}`;
        await img.decode().catch(() => null);
        salida.push(img.naturalWidth);
      }
      return salida;
    }, rutas);
    expect(anchos).toEqual([860, 480]);
    await volverRed(context);
  });
});
