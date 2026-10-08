import { defineConfig } from "@playwright/test";

import base from "./playwright.config";

/**
 * Capturas de docs/capturas-* (npm run capturas). No son pruebas: viven en
 * tests/capturas y solo corren con este config, nunca con la suite.
 * scripts/pruebas/capturas.mjs fija SALIDA para cada archivo y pasa las
 * imagenes a webp en su carpeta de docs.
 */
export default defineConfig({
  ...base,
  testDir: "./tests/capturas",
  testMatch: "**/*.capturas.ts",
  retries: 0,
  reporter: "dot",
  projects: [{ name: "movil", use: {} }],
});
