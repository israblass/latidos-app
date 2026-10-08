#!/usr/bin/env node
/**
 * Capturas de docs/capturas-* (no es una prueba; ver docs/pruebas.md).
 *
 *   npm run capturas                 # todas
 *   npm run capturas -- bienvenida   # solo las de tests/capturas/bienvenida.capturas.ts
 *
 * Cada archivo de tests/capturas escribe PNG en una carpeta temporal (SALIDA)
 * y aqui se pasan a webp en su carpeta de docs. Las comparaciones armadas a
 * mano (comparacion-*, *-antes/-despues) no se tocan.
 */
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

import { ENV_PRUEBA, correr } from "./comun.mjs";

const DESTINOS = {
  bienvenida: "docs/capturas-bienvenida",
  borde: "docs/capturas-bienvenida",
  inicio: "docs/capturas/inicio-vidrio-campana",
  beats: "docs/capturas/beats-dashboard",
  pulido: "docs/capturas/pulido-ilustraciones",
};

const pedidas = process.argv.slice(2);
const nombres = pedidas.length ? pedidas : Object.keys(DESTINOS);
const desconocidas = nombres.filter((n) => !DESTINOS[n]);
if (desconocidas.length) {
  console.error(`No hay capturas "${desconocidas.join(", ")}". Disponibles: ${Object.keys(DESTINOS).join(", ")}`);
  process.exit(2);
}

let fallo = 0;
for (const nombre of nombres) {
  const salida = mkdtempSync(join(tmpdir(), `capturas-${nombre}-`));
  const env = { ...process.env, ...ENV_PRUEBA, SALIDA: salida };
  const codigo = correr(
    "npx",
    ["playwright", "test", "-c", "playwright.capturas.config.ts", `tests/capturas/${nombre}.capturas.ts`],
    env,
  );
  if (codigo !== 0) {
    fallo = codigo;
  } else {
    const pngs = readdirSync(salida).filter((f) => f.endsWith(".png"));
    for (const png of pngs) {
      await sharp(join(salida, png))
        .webp({ quality: 80 })
        .toFile(join(DESTINOS[nombre], png.replace(/\.png$/, ".webp")));
    }
    console.log(`✓ ${nombre}: ${pngs.length} capturas en ${DESTINOS[nombre]}`);
  }
  rmSync(salida, { recursive: true, force: true });
}
process.exit(fallo);
