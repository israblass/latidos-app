import { defineConfig, devices } from "@playwright/test";

/**
 * Suite de integracion de Fase 6.
 *
 * Por defecto levanta la app contra el mock de Supabase (tests/servidor-mock),
 * porque el Supabase real no es alcanzable desde CI y porque una suite que
 * depende de una base compartida se vuelve inestable en cuanto dos corridas se
 * cruzan. Para apuntar a un despliegue de verdad: URL_BASE=https://... y
 * las pruebas que escriben en la base se saltan solas.
 */
const URL_BASE = process.env.URL_BASE || "http://localhost:3000";
const URL_MOCK = process.env.URL_MOCK || "http://localhost:54321";
const CONTRA_DESPLIEGUE = Boolean(process.env.URL_BASE);

export default defineConfig({
  testDir: "./tests/integracion",
  testMatch: "**/*.test.ts",
  // Estado global compartido (el mock tiene una sola semilla): en serie.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: URL_BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Un telefono de gama media, que es el escenario real del evento.
    ...devices["Pixel 5"],
    launchOptions: {
      args: [
        // Camara falsa: sin esto el visor nunca recibe imagen y cualquier
        // prueba que espere al lector se queda colgada.
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    },
  },

  projects: [{ name: "movil", use: {} }],

  // Contra un despliegue no se levanta nada local.
  webServer: CONTRA_DESPLIEGUE
    ? undefined
    : [
        {
          command: "node tests/servidor-mock/index.js",
          url: `${URL_MOCK}/prueba/ultimo-enlace`,
          reuseExistingServer: !process.env.CI,
          stdout: "pipe",
        },
        {
          command: "npm run dev",
          url: URL_BASE,
          reuseExistingServer: !process.env.CI,
          env: {
            NEXT_PUBLIC_SUPABASE_URL: URL_MOCK,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-de-prueba",
            ZONA_HORARIA: "America/Caracas",
          },
        },
      ],
});
