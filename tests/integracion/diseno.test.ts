import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { abrirBeats, cuentaConId } from "../ayudantes/beats";
import { completarRegistro, confirmarCorreo, cuentaEnInicio } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";

/**
 * Design system v2.3.0: base crema, superficies blancas, regla del amarillo y
 * del azul, el cielo solo donde corresponde y el liquid glass definido en un
 * solo lugar.
 */
test.beforeEach(reiniciarMock);

const RAIZ = join(__dirname, "..", "..");
const SRC = join(RAIZ, "src");
const GLOBALS = join(SRC, "app", "globals.css");

/** Todos los archivos de codigo de src. */
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.(tsx?|css)$/.test(nombre) ? [ruta] : [];
  });
}

/** El codigo sin comentarios, para no contar lo que solo se menciona. */
const sinComentarios = (texto: string) =>
  texto
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/{\s*\/\*[\s\S]*?\*\/\s*}/g, "")
    .replace(/(^|[^:"'])\/\/.*$/gm, "$1");

test.describe("reglas en el codigo", () => {
  test("la receta del vidrio esta definida una sola vez, en globals.css", () => {
    const fuera = archivos(SRC)
      .filter((ruta) => ruta !== GLOBALS)
      .filter((ruta) =>
        /backdrop-filter|backdropFilter|backdrop-blur|backdrop-saturate|backdrop-brightness/.test(
          sinComentarios(readFileSync(ruta, "utf8")),
        ),
      )
      .map((ruta) => relative(RAIZ, ruta));
    expect(fuera, "backdrop-filter suelto fuera de las clases centrales").toEqual([]);

    const css = sinComentarios(readFileSync(GLOBALS, "utf8"));
    // Una sola declaracion con desenfoque de verdad (y su par con prefijo);
    // las demas son los apagados del modo sin transparencia.
    // (Se descartan las condiciones de @supports, que van entre parentesis.)
    expect(css.match(/(?<![-(])backdrop-filter:\s*blur\(/g)).toHaveLength(1);
    expect(css.match(/(?<!\()-webkit-backdrop-filter:\s*blur\(/g)).toHaveLength(1);
    const bloque = css.slice(0, css.search(/(?<![-(])backdrop-filter:\s*blur\(/));
    const selector = bloque.slice(bloque.lastIndexOf("}") + 1);
    expect(selector.replace(/\s+/g, " ")).toContain(".vidrio, .vidrio-barra, .vidrio-hoja {");

    // La receta pedida, sin variaciones.
    expect(css).toContain("--vidrio-fondo: rgba(255, 255, 255, 0.55)");
    expect(css).toContain("backdrop-filter: blur(20px) saturate(180%)");
    expect(css).toContain("border: 1px solid rgba(255, 255, 255, 0.65)");
    expect(css).toMatch(/@supports not \(\(backdrop-filter: blur\(1px\)\)/);
    expect(css).toMatch(/@media \(prefers-reduced-transparency: reduce\)/);

    // Los niveles viejos ya no existen.
    const viejos = archivos(SRC).filter((ruta) =>
      /vidrio-(sutil|medio|oscuro)/.test(sinComentarios(readFileSync(ruta, "utf8"))),
    );
    expect(viejos.map((r) => relative(RAIZ, r))).toEqual([]);
  });

  test("el crema #FFFFF5 se escribe solo en globals.css, el manifest y el theme-color", () => {
    const con = archivos(SRC)
      .filter((ruta) => /#fffff5/i.test(sinComentarios(readFileSync(ruta, "utf8"))))
      .map((ruta) => relative(RAIZ, ruta))
      .sort();
    expect(con).toEqual(["src/app/globals.css", "src/app/layout.tsx"]);
    const manifest = JSON.parse(readFileSync(join(RAIZ, "public", "manifest.json"), "utf8"));
    expect(manifest.theme_color).toBe("#FFFFF5");
    expect(manifest.background_color).toBe("#FFFFF5");
    expect(readFileSync(GLOBALS, "utf8").match(/--color-fondo:\s*#fffff5/gi)).toHaveLength(1);
    const tailwind = readFileSync(join(RAIZ, "tailwind.config.ts"), "utf8");
    expect(tailwind).toContain('fondo: "var(--color-fondo)"');
  });

  test("el amarillo nunca es color de texto, borde ni linea", () => {
    const usos = archivos(SRC)
      .flatMap((ruta) => {
        const codigo = sinComentarios(readFileSync(ruta, "utf8"));
        return (codigo.match(/\b(text|border|ring|outline|decoration|stroke|divide)-primario\b/g) ?? []).map(
          (uso) => `${relative(RAIZ, ruta)}: ${uso}`,
        );
      });
    expect(usos).toEqual([]);
  });
});

/** Colores en pantalla que rompen las reglas del amarillo y del azul. */
async function incumplimientosDeColor(page: Page) {
  return page.evaluate(() => {
    const AMARILLO = "rgb(253, 251, 5)";
    const AZULES = ["rgb(0, 144, 255)", "rgb(0, 112, 204)"];
    const salida: string[] = [];
    document.querySelectorAll("body *").forEach((el) => {
      const caja = el.getBoundingClientRect();
      if (!caja.width || !caja.height) return;
      const estilo = getComputedStyle(el);
      if (estilo.visibility === "hidden") return;
      const texto = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim());
      const nombre = `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}"`;
      if (texto && estilo.color === AMARILLO) salida.push(`texto amarillo: ${nombre}`);
      for (const lado of ["Top", "Right", "Bottom", "Left"] as const) {
        const ancho = parseFloat(estilo.getPropertyValue(`border-${lado.toLowerCase()}-width`));
        if (ancho > 0 && estilo.getPropertyValue(`border-${lado.toLowerCase()}-color`) === AMARILLO) {
          salida.push(`borde amarillo: ${nombre}`);
        }
      }
      if (texto && AZULES.includes(estilo.color)) {
        const tam = parseFloat(estilo.fontSize);
        const grande = tam >= 24 || (tam >= 18.66 && Number(estilo.fontWeight) >= 700);
        if (!grande) salida.push(`texto azul chico (${tam}px): ${nombre}`);
      }
    });
    return salida;
  });
}

/** Elementos con desenfoque de fondo visibles ahora mismo. */
const capasDeVidrio = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll("body *"))
      .filter((el) => {
        const estilo = getComputedStyle(el);
        const filtro = estilo.backdropFilter || estilo.getPropertyValue("-webkit-backdrop-filter");
        const caja = el.getBoundingClientRect();
        return filtro && filtro !== "none" && caja.width > 0 && caja.height > 0;
      })
      .map((el) => (el.getAttribute("class") ?? "").split(" ").find((c) => c.startsWith("vidrio")) ?? el.tagName),
  );

const fondoDelBody = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe("en pantalla", () => {
  test("Inicio: cielo solo en la cabecera, dos capas de vidrio y nada tapado por la barra", async ({ page }) => {
    await cuentaEnInicio(page);
    expect(await fondoDelBody(page)).toBe("rgb(255, 255, 245)");
    await expect(page.locator("[data-cielo]")).toHaveCount(1);
    await expect(page.locator("[data-cielo='cabecera']")).toHaveCount(1);

    const capas = await capasDeVidrio(page);
    expect(capas.length).toBeLessThanOrEqual(2);
    expect([...capas].sort()).toEqual(["vidrio", "vidrio-barra"]);

    // Lo ultimo de la pagina queda por encima de la barra al llegar al fondo.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const barra = await page.getByRole("navigation", { name: "Principal" }).boundingBox();
    const ultimo = await page.getByRole("list", { name: "Fases del programa" }).boundingBox();
    expect(ultimo!.y + ultimo!.height).toBeLessThanOrEqual(barra!.y);

    expect(await incumplimientosDeColor(page)).toEqual([]);
  });

  test("Beats y Perfil: crema solido, sin cielo; con la hoja abierta, dos capas", async ({ page }) => {
    await cuentaConId(page);
    await abrirBeats(page);
    expect(await fondoDelBody(page)).toBe("rgb(255, 255, 245)");
    await expect(page.locator("[data-cielo]")).toHaveCount(0);
    expect(await capasDeVidrio(page)).toEqual(["vidrio-barra"]);
    // Las tarjetas son blancas, no vidrio.
    const contador = page.locator("section[aria-label='Tu balance de Beats'] > div");
    await expect(contador).toHaveCSS("background-color", "rgb(255, 255, 255)");
    expect(await incumplimientosDeColor(page)).toEqual([]);

    await page.getByRole("button", { name: "¿Cómo gano Beats?" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const capas = await capasDeVidrio(page);
    expect(capas.length).toBeLessThanOrEqual(2);
    expect(capas).toContain("vidrio-hoja");
    expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.goto("/perfil");
    expect(await fondoDelBody(page)).toBe("rgb(255, 255, 245)");
    await expect(page.locator("[data-cielo]")).toHaveCount(0);
    expect(await incumplimientosDeColor(page)).toEqual([]);
  });

  test("bienvenida y onboarding llevan el cielo y una sola pieza de vidrio", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-cielo='pantalla']")).toHaveCount(1);
    expect(await capasDeVidrio(page)).toEqual(["vidrio"]);
    expect(await incumplimientosDeColor(page)).toEqual([]);
    expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);

    await completarRegistro(page);
    // El registro no lleva cielo.
    await expect(page.locator("[data-cielo]")).toHaveCount(0);
    await confirmarCorreo(page);
    await expect(page.locator("[data-cielo='pantalla']")).toHaveCount(1);
    expect(await capasDeVidrio(page)).toEqual(["vidrio"]);
    expect(await incumplimientosDeColor(page)).toEqual([]);
    expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  });

  test("el texto sobre el vidrio pasa AA contra el crema y contra el cielo mas oscuro", async ({ page }) => {
    await cuentaEnInicio(page);
    const resultado = await page.evaluate(async () => {
      const luminancia = ([r, g, b]: number[]) => {
        const c = (v: number) => {
          const n = v / 255;
          return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
      };
      const contraste = (a: number[], b: number[]) => {
        const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
        return (x + 0.05) / (y + 0.05);
      };
      const canales = (color: string) => (color.match(/[\d.]+/g) ?? []).map(Number);
      const sobre = (arriba: number[], alfa: number, abajo: number[]) =>
        arriba.slice(0, 3).map((c, i) => c * alfa + abajo[i] * (1 - alfa));

      // El pixel mas oscuro del cielo.
      const imagen = new Image();
      imagen.src = "/assets/fondos/fondo-splash-backdrop.webp";
      await imagen.decode();
      const lienzo = document.createElement("canvas");
      lienzo.width = imagen.naturalWidth;
      lienzo.height = imagen.naturalHeight;
      const ctx = lienzo.getContext("2d")!;
      ctx.drawImage(imagen, 0, 0);
      const datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height).data;
      let oscuro = [255, 255, 255];
      for (let i = 0; i < datos.length; i += 4) {
        const px = [datos[i], datos[i + 1], datos[i + 2]];
        if (luminancia(px) < luminancia(oscuro)) oscuro = px;
      }

      const velo = canales(getComputedStyle(document.querySelector(".fondo-app__velo")!).backgroundColor);
      const vidrio = canales(getComputedStyle(document.querySelector(".vidrio")!).backgroundColor);
      const crema = canales(getComputedStyle(document.body).backgroundColor);

      const cieloConVelo = sobre(velo, velo[3] ?? 1, oscuro);
      const fondos = {
        cielo: sobre(vidrio, vidrio[3], cieloConVelo),
        crema: sobre(vidrio, vidrio[3], crema),
      };
      const textos = { principal: [26, 35, 50], secundario: [86, 94, 109] };
      const salida: Record<string, number> = {};
      for (const [f, fondo] of Object.entries(fondos)) {
        for (const [t, texto] of Object.entries(textos)) salida[`${t} sobre ${f}`] = contraste(texto, fondo);
      }
      return salida;
    });
    for (const [caso, razon] of Object.entries(resultado)) {
      expect(razon, caso).toBeGreaterThanOrEqual(4.5);
    }
  });
});
