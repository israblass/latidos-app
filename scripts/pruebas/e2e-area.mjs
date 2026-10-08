#!/usr/bin/env node
/**
 * Nivel 1 (docs/pruebas.md): Playwright solo de los specs indicados.
 *
 *   npm run test:e2e:area -- tests/integracion/bienvenida.test.ts [otros...]
 *
 * Solo Chromium (proyecto "movil"), sin reintentos y con reporter "line".
 * Postgres se levanta solo si alguno de esos specs lo usa. Sin archivos no
 * corre nada: para la suite completa esta `npm run test:completo`.
 */
import { existsSync } from "node:fs";

import { ENV_PRUEBA, asegurarPostgres, correr, necesitanPostgres } from "./comun.mjs";

const args = process.argv.slice(2);
// Los specs son los argumentos .ts; lo demas (--grep "...", --headed...) pasa
// tal cual a Playwright, con sus valores.
const esSpec = (a) => !a.startsWith("-") && a.endsWith(".ts");
const archivos = args.filter(esSpec);
const opciones = args.filter((a) => !esSpec(a));

if (archivos.length === 0) {
  console.error("Uso: npm run test:e2e:area -- tests/integracion/<archivo>.test.ts [...]");
  console.error("Sin archivos no se corre nada (la suite completa es npm run test:completo).");
  process.exit(2);
}
const faltan = archivos.filter((f) => !existsSync(f));
if (faltan.length) {
  console.error(`No existen: ${faltan.join(", ")}`);
  process.exit(2);
}

const env = { ...process.env, ...ENV_PRUEBA };
if (necesitanPostgres(archivos)) {
  const url = asegurarPostgres();
  if (url) env.DATABASE_URL = url;
} else {
  // Ninguno de estos specs usa la base: que no se conecte a nada.
  delete env.DATABASE_URL;
}

process.exit(
  correr("npx", ["playwright", "test", ...archivos, "--project=movil", "--retries=0", "--reporter=line", ...opciones], env),
);
