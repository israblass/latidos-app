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

test.describe("reglas en el codigo", { tag: "@rapido" }, () => {
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
    // Unica excepcion: el circulo navy con icono amarillo (flecha de los
    // botones claros y chevron de los acordeones), definido una sola vez en
    // globals.css. Es amarillo SOBRE NAVY (15:1), nunca sobre crema ni blanco.
    const css = readFileSync(GLOBALS, "utf8");
    expect(css).toMatch(
      /\.boton-primario \.circulo-flecha,\s*\.boton-secundario \.circulo-flecha,\s*\.circulo-navy \{\s*@apply bg-texto-principal text-primario;/,
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

/**
 * Principio de paleta (constitution §2, v2.7.0): en src solo hay colores de la
 * paleta, opacos o con transparencia. Ningun otro hex ni rgb()/rgba().
 */
const PALETA: Record<string, string> = {
  "255,255,245": "crema #FFFFF5",
  "255,255,255": "blanco",
  "253,251,5": "amarillo #FDFB05",
  "0,144,255": "azul #0090FF",
  "26,35,50": "navy #1A2332",
  "86,94,109": "gris texto #565E6D",
  "245,247,250": "fondo secundario #F5F7FA",
  "13,17,23": "oscuro #0D1117",
};

/**
 * Excepcion documentada: los colores de una marca patrocinante. La linea que
 * lleve uno se marca con el comentario `paleta: marca patrocinante` y no se
 * revisa.
 */
const MARCA_PATROCINANTE = /paleta: marca patrocinante/;

const canales = (hex: string) => {
  const h = hex.slice(1);
  const largo = h.length === 3 || h.length === 4 ? 1 : 2;
  return [0, 1, 2].map((i) => parseInt(largo === 1 ? h[i] + h[i] : h.slice(i * 2, i * 2 + 2), 16)).join(",");
};

/** Los colores escritos en un archivo que no son de la paleta. */
function coloresFueraDePaleta(texto: string) {
  const codigo = sinComentarios(
    texto
      .split("\n")
      .filter((linea) => !MARCA_PATROCINANTE.test(linea))
      .join("\n"),
  );
  const fuera: string[] = [];
  for (const [hex] of Array.from(codigo.matchAll(/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi))) {
    if (!PALETA[canales(hex)]) fuera.push(hex);
  }
  for (const [, r, g, b] of Array.from(codigo.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/gi))) {
    if (!PALETA[`${r},${g},${b}`]) fuera.push(`rgb(${r}, ${g}, ${b})`);
  }
  return fuera;
}

test.describe("principio de paleta", { tag: "@rapido" }, () => {
  test("en src no hay colores escritos fuera de la paleta", () => {
    const fuera = archivos(SRC).flatMap((ruta) =>
      coloresFueraDePaleta(readFileSync(ruta, "utf8")).map((c) => `${relative(RAIZ, ruta)}: ${c}`),
    );
    expect(fuera).toEqual([]);
  });

  test("el detector encuentra un hex o un rgba fuera de paleta y respeta la excepcion de marca", () => {
    expect(coloresFueraDePaleta('const a = "#DDF3FB";')).toEqual(["#DDF3FB"]);
    expect(coloresFueraDePaleta("box-shadow: 0 1px 2px rgba(16, 24, 40, 0.1);")).toEqual(["rgb(16, 24, 40)"]);
    expect(coloresFueraDePaleta('const b = "#fdfb05"; const c = "rgba(0, 144, 255, 0.12)";')).toEqual([]);
    expect(coloresFueraDePaleta("const d = '#fff';")).toEqual([]);
    // Lo que solo se menciona en un comentario no cuenta.
    expect(coloresFueraDePaleta("/* antes era #4A5160 */")).toEqual([]);
    expect(coloresFueraDePaleta('const kfc = "#E4002B"; // paleta: marca patrocinante')).toEqual([]);
  });

  test("los tokens fuera de paleta del PR #8 ya no existen", () => {
    const tailwind = sinComentarios(readFileSync(join(RAIZ, "tailwind.config.ts"), "utf8"));
    for (const viejo of ["#DDF3FB", "#EAF6FB", "#F0F2F5", "#C9D1DE", "celeste", "gris-chip"]) {
      expect(tailwind, viejo).not.toContain(viejo);
    }
    // El texto sobre navy volvio en la v2.8.0 (hero navy de Beats) y se fue
    // en la v2.9.0 con la tarjeta de vidrio: ya no queda nada sobre navy.
    expect(tailwind).not.toContain("sobre-navy");
    const usos = archivos(SRC).filter((ruta) =>
      /\b(bg|text|border)-(celeste|celeste-claro|gris-chip|texto-sobre-navy)\b|--inicio-cielo/.test(
        sinComentarios(readFileSync(ruta, "utf8")),
      ),
    );
    expect(usos.map((r) => relative(RAIZ, r))).toEqual([]);
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
  test("Inicio: degradado de marca sin foto, una capa de vidrio grande y nada tapado por la barra", async ({ page }) => {
    await cuentaEnInicio(page);
    expect(await fondoDelBody(page)).toBe("rgb(255, 255, 245)");
    // El cielo de foto quedo solo en bienvenida y onboarding (v2.6.0).
    await expect(page.locator("[data-cielo]")).toHaveCount(0);
    const fondo = page.locator(".fondo-inicio");
    await expect(fondo).toHaveCount(1);
    await expect(fondo).toHaveAttribute("aria-hidden", "true");
    expect(await fondo.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("radial-gradient");
    expect(await fondo.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("none");

    // Dos capas grandes: la tarjeta de Beats (vidrio desde la v2.7.0) y la
    // barra.
    const capas = await capasDeVidrio(page);
    expect(capas).toEqual(["vidrio", "vidrio-barra"]);
    // La capsula de puntos del banner es vidrio, pero chica: no cuenta.
    const capsula = (await page.locator("[data-capsula-puntos]").boundingBox())!;
    expect(capsula.width * capsula.height).toBeLessThan(AREA_CAPA_GRANDE);

    // Lo ultimo de la pagina queda por encima de la barra al llegar al fondo.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const barra = await page.getByRole("navigation", { name: "Principal" }).boundingBox();
    const ultimo = await page.locator("main > *").last().boundingBox();
    expect(ultimo!.y + ultimo!.height).toBeLessThanOrEqual(barra!.y);

    expect(await incumplimientosDeColor(page)).toEqual([]);

    // Con la hoja de notificaciones abierta no se pasa de dos: la hoja es
    // blanca y opaca.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole("button", { name: "Notificaciones" }).click();
    await expect(page.getByRole("dialog", { name: "Notificaciones" })).toBeVisible();
    const conHoja = await capasDeVidrio(page);
    expect(conHoja.length).toBeLessThanOrEqual(2);
    expect(conHoja).not.toContain("vidrio-hoja");
    await expect(page.getByRole("dialog", { name: "Notificaciones" })).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
  });

  // v2.9.0: Beats tambien tiene su tarjeta de vidrio sobre el degradado.
  for (const caso of [
    { pantalla: "Inicio", ruta: "/inicio", selector: "section[aria-label='Tu balance de Beats'] > a" },
    { pantalla: "Beats", ruta: "/beats", selector: "section[aria-label='Tu balance de Beats']" },
  ])
  test(`${caso.pantalla}: el texto de la tarjeta de vidrio pasa AA sobre el degradado real`, async ({ page }) => {
    await cuentaEnInicio(page);
    if (caso.ruta === "/beats") await abrirBeats(page);
    const tarjeta = page.locator(caso.selector);
    await expect(tarjeta).toBeVisible();
    const receta = await recetaDe(tarjeta);
    // Lo que hay detras: se esconde la tarjeta y se mira el pixel mas oscuro
    // de esa zona del degradado.
    const caja = (await tarjeta.boundingBox())!;
    await tarjeta.evaluate((el: HTMLElement) => (el.style.visibility = "hidden"));
    const captura = await page.screenshot({ clip: caja });
    await tarjeta.evaluate((el: HTMLElement) => (el.style.visibility = ""));
    const oscuro = await page.evaluate(async (b64) => {
      const imagen = new Image();
      imagen.src = `data:image/png;base64,${b64}`;
      await imagen.decode();
      const lienzo = document.createElement("canvas");
      lienzo.width = imagen.naturalWidth;
      lienzo.height = imagen.naturalHeight;
      const ctx = lienzo.getContext("2d")!;
      ctx.drawImage(imagen, 0, 0);
      const datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height).data;
      const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
      let px = [255, 255, 255];
      for (let i = 0; i < datos.length; i += 4) {
        if (lum(datos[i], datos[i + 1], datos[i + 2]) < lum(px[0], px[1], px[2])) {
          px = [datos[i], datos[i + 1], datos[i + 2]];
        }
      }
      return px;
    }, captura.toString("base64"));
    const fondo = sobre(receta.tinte, filtrar(oscuro as Rgb, receta.saturacion, receta.brillo));
    const gris = aColor(
      await tarjeta.getByText("Beats acumulados").evaluate((el) => getComputedStyle(el).color),
    ).rgb;
    expect(gris).toEqual([86, 94, 109]);
    expect(contraste(gris, fondo), "gris sobre la tarjeta").toBeGreaterThanOrEqual(4.5);
    expect(contraste(NAVY, fondo), "navy sobre la tarjeta").toBeGreaterThanOrEqual(4.5);
    // Y sin el vidrio, el peor pixel del degradado tambien da AA (el tinte
    // solo aclara).
    expect(contraste(gris, oscuro as Rgb), "gris sobre el degradado").toBeGreaterThanOrEqual(4.5);
  });

  test("Beats y Perfil: sin cielo ni vidrio propio; con la hoja abierta, dos capas", async ({ page }) => {
    await cuentaConId(page);
    await abrirBeats(page);
    expect(await fondoDelBody(page)).toBe("rgb(255, 255, 245)");
    await expect(page.locator("[data-cielo]")).toHaveCount(0);
    // v2.8.0: Beats lleva el mismo degradado de marca del Inicio (una sola
    // definicion). v2.9.0: dos capas grandes, la tarjeta unificada y la barra.
    await expect(page.locator(".fondo-inicio")).toHaveCount(1);
    expect(await capasDeVidrio(page)).toEqual(["vidrio", "vidrio-barra"]);
    // Las demas tarjetas (marcas, historial) siguen blancas opacas.
    await expect(page.locator("section[aria-label='Historial de Beats'] > div")).toHaveCSS("background-color", "rgb(255, 255, 255)");
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

  test("bienvenida: degradado sin cielo y dos capas (los botones); onboarding: cielo y una pieza de vidrio", async ({ page }) => {
    // v2.10.0: la bienvenida deja el cielo y la card de vidrio. Fondo de
    // marca (.fondo-inicio) y dos capas grandes: los dos botones de deslizar.
    await page.goto("/");
    await expect(page.locator("[data-cielo]")).toHaveCount(0);
    await expect(page.locator(".fondo-inicio")).toHaveCount(1);
    expect(await capasDeVidrio(page)).toEqual(["vidrio", "vidrio"]);
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
    // Desde la v2.10.0 el vidrio sobre el cielo vive solo en el onboarding
    // (la bienvenida y el Inicio usan el degradado de marca).
    await completarRegistro(page);
    await confirmarCorreo(page);
    await expect(page.locator("[data-cielo='pantalla']")).toHaveCount(1);
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
        velo: getComputedStyle(document.querySelector("[data-cielo='pantalla'] .fondo-app__velo")!).backgroundColor,
        crema: getComputedStyle(document.body).backgroundColor,
      };
    });
    const receta = await recetaDe(page.locator("main .vidrio").first());
    const cieloConVelo = sobre(aColor(cielo.velo), cielo.oscuro as Rgb);
    // Lo que el vidrio deja ver: el cielo desenfocado, saturado y con brillo.
    const detras = filtrar(cieloConVelo, receta.saturacion, receta.brillo);
    const fondos = {
      cielo: sobre(receta.tinte, detras),
      crema: sobre(receta.tinte, filtrar(aColor(cielo.crema).rgb, receta.saturacion, receta.brillo)),
    };
    const resultado: Record<string, number> = {
      // Texto navy directo sobre el cielo, sin vidrio.
      "navy sobre el cielo": contraste(NAVY, cieloConVelo),
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
