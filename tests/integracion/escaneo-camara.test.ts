import { expect, test, type Browser } from "@playwright/test";

import { camaraCon, videoConQR } from "../ayudantes/camara";
import { cuentaEnInicio } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";
import { QR } from "../ayudantes/qr";
import { urlDeQR } from "../../src/lib/qr/contenido";

/**
 * Lectura con camara de verdad (dentro de lo que permite una prueba).
 *
 * Nace de un fallo que se escapo a todo lo demas: el escaner no leia los QR
 * impresos que genera `npm run qr:prueba`. Las pruebas anteriores usaban un QR
 * con el id pelado y ocupando media pantalla, y asi nunca se toco el problema.
 * Un QR con la URL entera tiene bastantes mas modulos, y al acercar el telefono
 * el codigo se sale de la zona que la libreria analiza.
 *
 * Por eso aqui se prueba lo que se imprime de verdad (la forma URL) y a varios
 * tamaños dentro del cuadro.
 */

const DOMINIO = "https://latidos-app.vercel.app";

/** Abre la app con la camara apuntando a ese QR. */
async function conCamara(browser: Browser, contenido: string, ocupacion: number) {
  const video = videoConQR({ contenido, ocupacion });
  const navegador = await browser.browserType().launch({
    args: camaraCon(video),
  });
  const contexto = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["camera"],
  });
  const pagina = await contexto.newPage();
  return { navegador, pagina };
}

test.beforeEach(reiniciarMock);

test.describe("lee el QR tal como se imprime (forma URL)", () => {
  // La forma URL es la que sale de `npm run qr:prueba -- --url`, y la que la
  // camara nativa del telefono tambien reconoce.
  for (const ocupacion of [0.45, 0.66, 0.8, 0.9]) {
    test(`ocupando el ${Math.round(ocupacion * 100)}% del visor`, async ({ browser }) => {
      const { navegador, pagina } = await conCamara(
        browser,
        urlDeQR(QR.sinLimite, DOMINIO),
        ocupacion,
      );
      await cuentaEnInicio(pagina);
      await pagina.goto("/escanear");

      // Reconocer un QR valido lleva a la pantalla de confirmacion.
      await pagina.waitForURL("**/escanear/confirmar**", { timeout: 25_000 });
      await expect(pagina.getByText("Vas a canjear el QR de")).toBeVisible();
      await expect(pagina.getByText("KFC")).toBeVisible();

      await navegador.close();
    });
  }

  test("tambien lee la forma de id pelado", async ({ browser }) => {
    const { navegador, pagina } = await conCamara(browser, QR.sinLimite, 0.55);
    await cuentaEnInicio(pagina);
    await pagina.goto("/escanear");

    await pagina.waitForURL("**/escanear/confirmar**", { timeout: 25_000 });
    await navegador.close();
  });
});

test("un QR de Latidos que no esta activo no culpa a la camara", async ({ browser }) => {
  // El fallo que costo la depuracion: la camara leia bien, el servidor
  // rechazaba el codigo, y el aviso decia "no pudimos leer el codigo, enfoca
  // bien". Eso manda a perseguir un problema de camara que no existe.
  const { navegador, pagina } = await conCamara(
    browser,
    urlDeQR(QR.inexistente, DOMINIO),
    0.55,
  );
  await cuentaEnInicio(pagina);
  await pagina.goto("/escanear");

  const aviso = pagina.getByRole("status").filter({ hasText: /codigo/i });
  await aviso.waitFor({ timeout: 25_000 });

  await expect(aviso).toContainText(/no esta activo/i);
  await expect(aviso).not.toContainText(/no pudimos leer/i);
  await expect(aviso).not.toContainText(/enfoca/i);

  // Y el escaner sigue vivo (spec, flujo alternativo 3).
  await expect(pagina.locator("video")).toBeVisible();
  await navegador.close();
});

test("un codigo que no es de Latidos tampoco llega a confirmacion", async ({ browser }) => {
  const { navegador, pagina } = await conCamara(browser, "esto no es de Latidos", 0.55);
  await cuentaEnInicio(pagina);
  await pagina.goto("/escanear");

  await pagina.waitForTimeout(6_000);
  await expect(pagina).toHaveURL(/\/escanear$/);
  await expect(pagina.locator("video")).toBeVisible();
  await navegador.close();
});
