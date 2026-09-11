import { expect, test } from "@playwright/test";

import { cuentaEnInicio } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";

/**
 * T067 — carga de la pantalla de escaneo y apertura de camara.
 *
 * La constitution §9 pone el objetivo en menos de 3 segundos en 4G.
 *
 * Solo corre con PROBAR_RENDIMIENTO=1 y contra un build de produccion
 * (`npm run rendimiento`). Medir sobre `next dev` no diria nada: el servidor de
 * desarrollo compila cada ruta la primera vez que se pide y sirve el bundle sin
 * minificar, asi que daria numeros mucho peores que los reales.
 *
 * Lo que se mide es la parte que nos toca: red, JavaScript y el momento en que
 * la app pide la camara. El encendido fisico de la camara de un telefono de
 * verdad no se puede medir aqui — la camara falsa de Chromium arranca al
 * instante — asi que ese tramo queda fuera y hay que comprobarlo a mano.
 */

const ACTIVA = process.env.PROBAR_RENDIMIENTO === "1";
const OBJETIVO_MS = 3_000;

/** Perfil 4G conservador, mas cerca de una red movil real que del ideal. */
const RED_4G = {
  offline: false,
  downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
  uploadThroughput: (3 * 1024 * 1024) / 8, // 3 Mbps
  latency: 70, // ms de ida y vuelta
};

test.describe("rendimiento en 4G", () => {
  test.skip(!ACTIVA, "Corre con: npm run rendimiento");

  test.beforeEach(reiniciarMock);

  /**
   * Deja una sesion iniciada y devuelve un contexto NUEVO que la hereda pero
   * arranca con la cache vacia.
   *
   * Hace falta separarlos: si se mide en el mismo contexto donde se acaba de
   * registrar la cuenta, los bundles ya estan en cache y el numero sale
   * precioso y falso. Lo que interesa es la primera visita de alguien parado
   * frente al stand.
   */
  async function sesionConCacheFria(browser: import("@playwright/test").Browser) {
    const registro = await browser.newContext();
    const paginaRegistro = await registro.newPage();
    await cuentaEnInicio(paginaRegistro);
    const estado = await registro.storageState();
    await registro.close();

    const contexto = await browser.newContext({
      storageState: estado,
      permissions: ["camera"],
    });
    return contexto;
  }

  async function frenarA4G(
    contexto: import("@playwright/test").BrowserContext,
    pagina: import("@playwright/test").Page,
  ) {
    const cdp = await contexto.newCDPSession(pagina);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", RED_4G);
    return cdp;
  }

  test("la pantalla de escaneo carga y pide la camara en menos de 3s", async ({ browser }) => {
    const contexto = await sesionConCacheFria(browser);
    const pagina = await contexto.newPage();
    await frenarA4G(contexto, pagina);

    const arranque = Date.now();
    await pagina.goto("/escanear", { waitUntil: "commit" });

    // El visor con imagen de verdad es la señal de "ya puedo escanear".
    const visor = pagina.locator("video");
    await visor.waitFor({ state: "visible", timeout: 20_000 });
    await expect
      .poll(
        () => visor.evaluate((el: HTMLVideoElement) => el.videoWidth > 0 && !el.paused),
        { timeout: 20_000 },
      )
      .toBe(true);

    const transcurrido = Date.now() - arranque;
    console.log(`[rendimiento] escaneo listo (cache fria, 4G) en ${transcurrido} ms`);

    // transferSize del Resource Timing: bytes reales por la red, ya comprimidos.
    // content-length no sirve, porque la mayoria de las respuestas de Next van
    // en chunks y no lo traen.
    const recursos = await pagina.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((e) => ({
          tipo: (e as PerformanceResourceTiming).initiatorType,
          bytes: (e as PerformanceResourceTiming).transferSize,
        }))
        .filter((r) => r.bytes > 0),
    );
    const kb = Math.round(recursos.reduce((t, r) => t + r.bytes, 0) / 1024);
    const porTipo = new Map<string, number>();
    for (const r of recursos) porTipo.set(r.tipo, (porTipo.get(r.tipo) ?? 0) + r.bytes);
    console.log(`[rendimiento] baja ~${kb} KB en ${recursos.length} recursos`);
    for (const [tipo, total] of Array.from(porTipo.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`[rendimiento]   ${tipo}: ${Math.round(total / 1024)} KB`);
    }

    await contexto.close();

    expect(
      transcurrido,
      `la pantalla de escaneo tardo ${transcurrido} ms en 4G con cache fria`,
    ).toBeLessThan(OBJETIVO_MS);
    // A 4 Mbps, 1 MB son ya ~2s solo de transferencia.
    expect(kb, `la pantalla de escaneo baja ${kb} KB`).toBeLessThan(1024);
  });

  test("Inicio tambien entra en el objetivo", async ({ browser }) => {
    // Es la pantalla a la que se vuelve despues de cada canje.
    const contexto = await sesionConCacheFria(browser);
    const pagina = await contexto.newPage();
    await frenarA4G(contexto, pagina);

    const arranque = Date.now();
    await pagina.goto("/inicio", { waitUntil: "commit" });
    await pagina.locator("section[aria-label='Tu balance de Beats']").waitFor({ timeout: 20_000 });
    const transcurrido = Date.now() - arranque;

    console.log(`[rendimiento] Inicio listo (cache fria, 4G) en ${transcurrido} ms`);
    await contexto.close();
    expect(transcurrido).toBeLessThan(OBJETIVO_MS);
  });

  test("la bienvenida, que es la primera pantalla de todas", async ({ browser }) => {
    // Quien llega por el QR fisico entra por aqui, sin nada en cache.
    const contexto = await browser.newContext();
    const pagina = await contexto.newPage();
    await frenarA4G(contexto, pagina);

    const arranque = Date.now();
    await pagina.goto("/", { waitUntil: "commit" });
    await pagina.getByRole("link", { name: /Registrarme/ }).waitFor({ timeout: 20_000 });
    const transcurrido = Date.now() - arranque;

    console.log(`[rendimiento] bienvenida lista (cache fria, 4G) en ${transcurrido} ms`);
    await contexto.close();
    expect(transcurrido).toBeLessThan(OBJETIVO_MS);
  });
});
