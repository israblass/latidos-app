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
/*
 * Sin esto, ni el modo sin red ni el enrutado de Playwright alcanzan a las
 * peticiones que hace el propio service worker: una prueba "sin red" seguiria
 * recibiendo la pagina desde el servidor y nunca ejercitaria las copias de
 * public/sw.js. Con la bandera, context.route() tambien las intercepta (ver
 * cortarRed en tests/ayudantes/red.ts). Es experimental en Playwright; si una
 * version futura la quita, las pruebas sin red de Beats lo van a delatar.
 */
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS ??= "1";

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

  projects: [
    { name: "movil", use: {} },
    /*
     * Safari: el vidrio tiene que verse en los iPhone. Solo con PROBAR_WEBKIT=1
     * (hace falta WebKit instalado: `npx playwright install webkit`) y solo
     * las pruebas del vidrio, que no dependen de la camara falsa de Chromium.
     */
    ...(process.env.PROBAR_WEBKIT
      ? [
          {
            name: "webkit",
            testMatch: /vidrio\.test\.ts/,
            use: { ...devices["iPhone 13"], launchOptions: { args: [] } },
          },
        ]
      : []),
  ],

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
