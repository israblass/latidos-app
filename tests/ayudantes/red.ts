import type { BrowserContext } from "@playwright/test";

/**
 * Sin red de verdad, tambien para el service worker.
 *
 * `setOffline` solo corta a la pagina (y pone navigator.onLine en false); las
 * peticiones del service worker siguen llegando al servidor. Por eso ademas se
 * aborta toda peticion del contexto, lo que con la bandera
 * PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS (playwright.config.ts) incluye
 * las del service worker.
 */
const abortar = (ruta: import("@playwright/test").Route) => ruta.abort("internetdisconnected");

export async function cortarRed(context: BrowserContext) {
  await context.setOffline(true);
  await context.route("**/*", abortar);
}

export async function volverRed(context: BrowserContext) {
  await context.unroute("**/*", abortar);
  await context.setOffline(false);
}
