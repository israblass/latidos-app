import { expect, test } from "@playwright/test";

import { cuentaEnInicio } from "../ayudantes/cuenta";
import { estadoDelQR, reiniciarMock, sembrarEscaneo, ultimoUsuario } from "../ayudantes/mock";
import { QR } from "../ayudantes/qr";

/**
 * T062 — los cuatro escenarios de friccion del escaneo.
 * Cubre los flujos alternativos 1, 2, 3 y 4, y los criterios 20, 21, 22 y 23.
 */
test.beforeEach(reiniciarMock);

test.describe("1. el QR ya se escaneo hoy", () => {
  test("avisa como logro cumplido, no como restriccion", async ({ page }) => {
    // Criterio 20: el mensaje enmarca lo ya logrado, sin sonar a castigo.
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await page.getByRole("button", { name: "Confirmar canje" }).click();
    await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();

    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);

    await expect(page.getByText(/Ya sumaste con esta marca hoy/)).toBeVisible();
    // No llega a la confirmacion ni otorga nada.
    await expect(page.getByRole("button", { name: "Confirmar canje" })).toHaveCount(0);
  });

  test("el escaneo de otro dia no bloquea el de hoy", async ({ page }) => {
    // El limite se reinicia a medianoche, no a las 24 horas exactas.
    await cuentaEnInicio(page);
    const { id } = await ultimoUsuario();
    await sembrarEscaneo({ usuarioId: id as string, qrMarcaId: QR.sinLimite, diasAtras: 2 });

    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await expect(page.getByRole("button", { name: "Confirmar canje" })).toBeVisible();
  });

  test("el escaneo de otra persona no cuenta contra el mio", async ({ page }) => {
    await cuentaEnInicio(page);
    const { id } = await ultimoUsuario();
    await sembrarEscaneo({ usuarioId: "00000000-0000-4000-8000-0000000000ff", qrMarcaId: QR.sinLimite });
    expect(id).not.toBe("00000000-0000-4000-8000-0000000000ff");

    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await expect(page.getByRole("button", { name: "Confirmar canje" })).toBeVisible();
  });
});

test.describe("2. el QR alcanzo su limite total", () => {
  test("el mensaje es neutro y no menciona limites", async ({ page }) => {
    // Criterio 21: sin "se acabo" ni "llegaste tarde", para no dejar a la
    // persona incomoda parada frente al stand de la marca.
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.agotado}`);

    await expect(page.getByText(/Este codigo ya no esta activo/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmar canje" })).toHaveCount(0);

    // Solo el texto visible: textContent del body arrastraria el payload RSC
    // de los <script>, donde si aparecen los nombres de campo internos.
    const visible = await page.locator("main").innerText();
    expect(visible).not.toMatch(/limite|se acabo|agotado|tarde/i);
  });

  test("no otorga Beats ni mueve el contador", async ({ page }) => {
    await cuentaEnInicio(page);
    const antes = await estadoDelQR(QR.agotado);
    await page.goto(`/escanear/confirmar?qr=${QR.agotado}`);
    await expect(page.getByText(/ya no esta activo/)).toBeVisible();

    const despues = await estadoDelQR(QR.agotado);
    expect(despues.qr.escaneos_totales_contador).toBe(antes.qr.escaneos_totales_contador);
    await page.goto("/inicio");
    await expect(page.locator("section[aria-label='Tu balance de Beats']")).toContainText("0");
  });
});

test.describe("3. el QR es invalido o ilegible", () => {
  test("un QR desactivado por el admin no se puede canjear", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.inactivo}`);
    await expect(page.getByRole("button", { name: "Confirmar canje" })).toHaveCount(0);
  });

  test("un id que no existe no se puede canjear", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.inexistente}`);
    await expect(page.getByRole("button", { name: "Confirmar canje" })).toHaveCount(0);
  });

  test("el endpoint de validacion rechaza texto que no es un QR de Latidos", async ({
    page,
    request,
  }) => {
    // Criterio 22 a nivel de contrato. El caso con camara de verdad vive en
    // escaneo-camara.test.ts.
    await cuentaEnInicio(page);
    const cookies = await page.context().cookies();
    const cabecera = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    for (const contenido of ["hola mundo", "https://otra-app.com/x", "12345"]) {
      const respuesta = await request.post("/api/qr/validar", {
        headers: { cookie: cabecera, "Content-Type": "application/json" },
        data: { contenido },
      });
      expect(respuesta.status()).toBe(200);
      expect(await respuesta.json()).toMatchObject({ valido: false, motivo: "qr_invalido" });
    }
  });
});

test.describe("4. sin conexion", () => {
  test("avisa y no cuelga la interfaz ni procesa nada en segundo plano", async ({
    page,
    context,
  }) => {
    // Criterio 23 y verificacion V023.
    await cuentaEnInicio(page);
    const antes = await estadoDelQR(QR.sinLimite);
    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await expect(page.getByRole("button", { name: "Confirmar canje" })).toBeVisible();

    await context.setOffline(true);
    await page.getByRole("button", { name: "Confirmar canje" }).click();

    await expect(page.getByText(/conexion/i).first()).toBeVisible();
    // La interfaz sigue respondiendo: hay salida.
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeEnabled();

    // Nada se proceso a espaldas de la persona.
    await context.setOffline(false);
    const despues = await estadoDelQR(QR.sinLimite);
    expect(despues.escaneos).toBe(antes.escaneos);
    expect(despues.qr.escaneos_totales_contador).toBe(antes.qr.escaneos_totales_contador);
  });

  test("al volver la señal se puede reintentar y el canje sale", async ({ page, context }) => {
    await cuentaEnInicio(page);
    await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
    await context.setOffline(true);
    await page.getByRole("button", { name: "Confirmar canje" }).click();
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();

    await context.setOffline(false);
    await page.getByRole("button", { name: "Reintentar" }).click();
    await page.getByRole("button", { name: "Confirmar canje" }).click();
    await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
  });
});
