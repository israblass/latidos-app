import { defineConfig } from "@playwright/test";

import base from "./playwright.config";

/**
 * Nivel 0 de la politica de pruebas (docs/pruebas.md): solo las pruebas
 * marcadas con el tag @rapido, que no abren navegador ni tocan Postgres
 * (reglas estaticas de diseño y funciones puras). Se levanta solo el mock de
 * Supabase, porque algunos archivos lo reinician antes de cada prueba; ni
 * Next ni Chromium arrancan.
 */
const servidores = Array.isArray(base.webServer) ? base.webServer : [];

export default defineConfig({
  ...base,
  grep: /@rapido/,
  retries: 0,
  reporter: "dot",
  webServer: servidores.filter((s) => s.command.includes("servidor-mock")),
});
