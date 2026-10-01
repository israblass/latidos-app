import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Icono de la app: el manifest es valido, cada icono declarado existe en el
 * servidor (200) y mide lo que dice medir, y el <head> apunta a los favicons
 * y al apple-touch-icon nuevos, sin restos de los viejos.
 */

const RAIZ = join(__dirname, "..", "..");

/** Ancho y alto de un PNG, leidos de su cabecera IHDR. */
function medidasPng(bytes: Buffer) {
  expect(bytes.subarray(1, 4).toString("ascii"), "no es un PNG").toBe("PNG");
  return { ancho: bytes.readUInt32BE(16), alto: bytes.readUInt32BE(20) };
}

test("el manifest es valido y cada icono existe con el tamaño declarado", async ({ request }) => {
  const respuesta = await request.get("/manifest.json");
  expect(respuesta.status()).toBe(200);
  const manifest = await respuesta.json();

  for (const campo of ["name", "short_name", "start_url", "display", "theme_color", "background_color"]) {
    expect(manifest[campo], campo).toBeTruthy();
  }
  expect(manifest.theme_color).toBe("#FFFFF5");
  expect(manifest.background_color).toBe("#FFFFF5");

  const iconos: { src: string; sizes: string; type: string; purpose: string }[] = manifest.icons;
  expect(iconos.map((i) => `${i.src} ${i.purpose}`)).toEqual([
    "/icons/icon-192.png any",
    "/icons/icon-512.png any",
    "/icons/icon-maskable-192.png maskable",
    "/icons/icon-maskable-512.png maskable",
  ]);

  for (const icono of iconos) {
    expect(icono.src.startsWith("/"), `${icono.src} con ruta absoluta`).toBe(true);
    expect(icono.type).toBe("image/png");
    const archivo = await request.get(icono.src);
    expect(archivo.status(), icono.src).toBe(200);
    const { ancho, alto } = medidasPng(await archivo.body());
    expect(`${ancho}x${alto}`, icono.src).toBe(icono.sizes);
  }
});

test("favicons y apple-touch-icon del head existen y miden lo que dicen", async ({ page, request }) => {
  await page.goto("/");
  const enlaces = await page.evaluate(() =>
    Array.from(document.querySelectorAll("link[rel='icon'], link[rel='apple-touch-icon']")).map((l) => ({
      rel: l.getAttribute("rel"),
      href: new URL((l as HTMLLinkElement).href).pathname,
      sizes: l.getAttribute("sizes"),
    })),
  );
  expect(enlaces).toEqual([
    { rel: "icon", href: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    { rel: "icon", href: "/favicon-32.png", sizes: "32x32" },
    { rel: "icon", href: "/favicon-16.png", sizes: "16x16" },
    { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
  ]);

  for (const enlace of enlaces) {
    const archivo = await request.get(enlace.href);
    expect(archivo.status(), enlace.href).toBe(200);
    if (enlace.href.endsWith(".png")) {
      const { ancho, alto } = medidasPng(await archivo.body());
      expect(`${ancho}x${alto}`, enlace.href).toBe(enlace.sizes);
    }
  }
  expect(await page.evaluate(() => document.querySelector("meta[name='theme-color']")?.getAttribute("content"))).toBe(
    "#FFFFF5",
  );
});

test("cada icono vive en un solo lugar: los viejos ya no estan", async ({ request }) => {
  for (const viejo of [
    "/icon-16.png",
    "/icon-32.png",
    "/icon-192.png",
    "/icon-512.png",
    "/icon-maskable-192.png",
    "/icon-maskable-512.png",
  ]) {
    expect((await request.get(viejo)).status(), viejo).toBe(404);
    expect(existsSync(join(RAIZ, "public", viejo)), viejo).toBe(false);
  }
  // Ni el favicon de src/app ni archivos icon/apple-icon de Next que choquen.
  for (const archivo of ["favicon.ico", "icon.png", "icon.ico", "apple-icon.png"]) {
    expect(existsSync(join(RAIZ, "src", "app", archivo)), archivo).toBe(false);
  }
  // El service worker precachea las rutas nuevas.
  const sw = readFileSync(join(RAIZ, "public", "sw.js"), "utf8");
  expect(sw).toContain('"/icons/icon-192.png"');
  expect(sw).toContain('"/icons/icon-512.png"');
  expect(sw).not.toMatch(/"\/icon-(192|512)\.png"/);
});
