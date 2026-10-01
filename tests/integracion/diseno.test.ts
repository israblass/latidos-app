import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { abrirBeats, cuentaConId } from "../ayudantes/beats";
import { completarRegistro, confirmarCorreo, cuentaEnInicio } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";
import { NAVY, aColor, contraste, filtrar, recetaDe, sobre, type Rgb } from "../ayudantes/vidrio";

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
    // El filtro se define una sola vez (--vidrio-filtro) y se aplica en una
    // sola regla, con y sin prefijo; los demas backdrop-filter son los
    // apagados del modo sin transparencia y las condiciones de @supports.
    expect(css.match(/--vidrio-filtro:\s*blur\(/g)).toHaveLength(1);
    expect(css.match(/(?<![-(])backdrop-filter:\s*var\(--vidrio-filtro\)/g)).toHaveLength(1);
    expect(css.match(/(?<!\()-webkit-backdrop-filter:\s*var\(--vidrio-filtro\)/g)).toHaveLength(1);
    expect(css.match(/(?<![-(])backdrop-filter:\s*blur\(/g) ?? []).toHaveLength(0);
    expect(css.match(/(?<!\()-webkit-backdrop-filter:\s*blur\(/g) ?? []).toHaveLength(0);
    const bloque = css.slice(0, css.search(/--vidrio-filtro:\s*blur\(/));
    const selector = bloque.slice(bloque.lastIndexOf("}") + 1);
    expect(selector.replace(/\s+/g, " ")).toContain(".vidrio, .vidrio-barra, .vidrio-hoja {");

    // La receta pedida (v2.5.0), sin variaciones.
    expect(css).toContain("--vidrio-tinte-arriba: rgba(255, 255, 255, 0.62)");
    expect(css).toContain("--vidrio-tinte-abajo: rgba(255, 255, 255, 0.48)");
    expect(css).toContain("--vidrio-filtro: blur(24px) saturate(200%) brightness(1.04)");
    expect(css).toContain("--vidrio-borde: rgba(255, 255, 255, 0.75)");
    expect(css).toContain("inset 0 1.5px 0 rgba(255, 255, 255, 0.95)");
    expect(css).toContain("0 10px 30px rgba(26, 35, 50, 0.14), 0 2px 6px rgba(26, 35, 50, 0.08)");
    expect(css).toContain("border: 1px solid var(--vidrio-borde)");
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
    // Unica excepcion: la flecha del circulo navy de los botones con flecha
    // (.boton-primario .circulo-flecha). Es amarillo SOBRE NAVY, no sobre
    // crema ni blanco: ahi el contraste es de 15:1.
    const css = readFileSync(GLOBALS, "utf8");
    expect(css).toMatch(
      /\.boton-primario \.circulo-flecha,\s*\.boton-secundario \.circulo-flecha \{\s*@apply bg-texto-principal text-primario;/,
    );
    const permitidos = ["src/app/globals.css: text-primario"];
    const usos = archivos(SRC)
      .flatMap((ruta) => {
        const codigo = sinComentarios(readFileSync(ruta, "utf8"));
        return (codigo.match(/\b(text|border|ring|outline|decoration|stroke|divide)-primario\b/g) ?? []).map(
          (uso) => `${relative(RAIZ, ruta)}: ${uso}`,
        );
      });
    expect(usos).toEqual(permitidos);
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

/**
 * Superficie a partir de la cual una capa de vidrio cuenta para el limite de
 * dos. Los controles chicos (la capsula de puntos del banner, ~120x50) no
 * cuentan: es la excepcion documentada en globals.css y en la constitucion.
 */
const AREA_CAPA_GRANDE = 8000;

/** Capas grandes con desenfoque de fondo visibles ahora mismo. */
const capasDeVidrio = (page: Page) =>
  page.evaluate((minimo) =>
    Array.from(document.querySelectorAll("body *"))
      .filter((el) => {
        const estilo = getComputedStyle(el);
        const filtro = estilo.backdropFilter || estilo.getPropertyValue("-webkit-backdrop-filter");
        const caja = el.getBoundingClientRect();
        const visible = Math.max(0, Math.min(caja.bottom, innerHeight) - Math.max(caja.top, 0));
        return filtro && filtro !== "none" && caja.width > 0 && visible > 0 && caja.width * caja.height >= minimo;
      })
      .map((el) => (el.getAttribute("class") ?? "").split(" ").find((c) => c.startsWith("vidrio")) ?? el.tagName),
  AREA_CAPA_GRANDE);

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
    // La capsula de puntos del banner es vidrio, pero chica: no cuenta.
    const capsula = (await page.locator("[data-capsula-puntos]").boundingBox())!;
    expect(capsula.width * capsula.height).toBeLessThan(AREA_CAPA_GRANDE);

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
    // El pixel mas oscuro del cielo y el velo de la cabecera de Inicio.
    const cielo = await page.evaluate(async () => {
      const lum = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
        if (lum(px) < lum(oscuro)) oscuro = px;
      }
      return {
        oscuro,
        velo: getComputedStyle(document.querySelector("[data-cielo='cabecera'] .fondo-app__velo")!).backgroundColor,
        crema: getComputedStyle(document.body).backgroundColor,
      };
    });
    const receta = await recetaDe(page.locator("section[aria-label='Tu balance de Beats'] .vidrio"));
    const cieloConVelo = sobre(aColor(cielo.velo), cielo.oscuro as Rgb);
    // Lo que el vidrio deja ver: el cielo desenfocado, saturado y con brillo.
    const detras = filtrar(cieloConVelo, receta.saturacion, receta.brillo);
    const fondos = {
      cielo: sobre(receta.tinte, detras),
      crema: sobre(receta.tinte, filtrar(aColor(cielo.crema).rgb, receta.saturacion, receta.brillo)),
    };
    const resultado: Record<string, number> = {
      // El saludo va directo sobre el cielo, sin vidrio.
      "saludo navy sobre el cielo": contraste(NAVY, cieloConVelo),
    };
    for (const [f, fondo] of Object.entries(fondos)) {
      resultado[`navy sobre vidrio y ${f}`] = contraste(NAVY, fondo);
      resultado[`gris tenue sobre vidrio y ${f}`] = contraste(receta.textoTenue, fondo);
    }
    for (const [caso, razon] of Object.entries(resultado)) {
      expect(razon, caso).toBeGreaterThanOrEqual(4.5);
    }
  });
});
