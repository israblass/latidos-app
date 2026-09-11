import { expect, test, type Browser, type Page } from "@playwright/test";

import { completarRegistro, confirmarCorreo, cuentaEnInicio } from "../ayudantes/cuenta";
import { estadoDelQR, ponerModoEvento, reiniciarMock, cambiarBeatsDelQR } from "../ayudantes/mock";
import { MARCA, QR } from "../ayudantes/qr";

/**
 * T068 / V026 — los 24 criterios de aceptacion de la spec, uno por uno.
 *
 * Existe aparte de las demas suites a proposito, aunque se solape con ellas:
 * es el recorrido de aceptacion, y tiene que poder leerse contra la spec sin
 * traducir nada.
 *
 * Tres criterios no se pueden cerrar aqui y estan marcados en su titulo. El
 * dialogo de instalacion de iOS solo existe en Safari real, el de Android solo
 * lo dispara Chrome de verdad, y el permiso de camara de un telefono no se
 * puede reproducir con una camara falsa. Esos van en la lista de comprobacion
 * manual del README.
 */

const UA_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const UA_ANDROID =
  "Mozilla/5.0 (Linux; Android 13; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Mobile Safari/537.36";

const contadorDeBeats = (page: Page) =>
  page.locator("section[aria-label='Tu balance de Beats']");

test.beforeEach(reiniciarMock);

test("01 — llegar desde cualquier canal muestra la misma bienvenida", async ({ browser }) => {
  // No hay contenido por canal de origen: un QR fisico, un link de WhatsApp y
  // la web informativa desembocan en la misma pantalla.
  const rutas = ["/", "/?utm_source=qr-fisico", "/?utm_source=whatsapp", "/?ref=web"];
  const vistas: string[] = [];

  for (const ruta of rutas) {
    // Un contexto limpio por ruta: el prompt de instalacion recuerda si ya
    // insistio en esta sesion, y reusar el contexto haria que la segunda
    // visita se viera distinta por esa razon y no por el canal de origen.
    const contexto = await browser.newContext();
    const pagina = await contexto.newPage();
    await pagina.goto(ruta, { waitUntil: "networkidle" });
    await expect(pagina.getByRole("heading", { level: 1 })).toBeVisible();

    // Se compara el bloque de bienvenida y el CTA, no el pie de creditos: los
    // logos institucionales vienen del Storage de Supabase y, si tardan o
    // fallan, ImagenMarca muestra su texto de respaldo. Eso cambia el innerText
    // por razones de red, no por el canal de origen.
    vistas.push(
      [
        await pagina.getByRole("heading", { level: 1 }).innerText(),
        await pagina.getByText(/Participa, suma Beats/).innerText(),
        await pagina.getByRole("link", { name: /Registrarme/ }).innerText(),
      ].join("|"),
    );
    await contexto.close();
  }

  expect(new Set(vistas).size, `la bienvenida cambia segun el canal: ${JSON.stringify(vistas)}`).toBe(1);
});

test("02 — en iOS aparece el modal con los pasos de instalacion, descartable", async ({
  browser,
}) => {
  // Parcial: se comprueba nuestro modal con el user agent de iOS. El dialogo
  // nativo de Safari no existe (iOS no expone API de instalacion) y el flujo
  // real hay que verlo en un iPhone.
  const contexto = await browser.newContext({ userAgent: UA_IOS });
  const pagina = await contexto.newPage();
  await pagina.goto("/");

  await expect(pagina.getByText(/Para instalar Latidos/i)).toBeVisible();
  await expect(pagina.getByText(/Compartir/)).toBeVisible();
  await expect(pagina.getByText(/pantalla de inicio/i)).toBeVisible();
  await expect(pagina.getByText(/Agregar/).first()).toBeVisible();

  await pagina.getByRole("button", { name: /Entendido|Cerrar/ }).first().click();
  await expect(pagina.getByText(/Para instalar Latidos/i)).toHaveCount(0);
  await contexto.close();
});

test("03 — en Android aparece el boton nativo de instalacion, descartable", async ({
  browser,
}) => {
  // Parcial: Chromium headless no emite beforeinstallprompt, asi que se emite
  // el evento igual que lo haria el navegador para comprobar nuestra reaccion.
  const contexto = await browser.newContext({ userAgent: UA_ANDROID });
  const pagina = await contexto.newPage();
  await pagina.addInitScript(() => {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const evento = new Event("beforeinstallprompt") as Event & {
          prompt?: () => Promise<void>;
          userChoice?: Promise<{ outcome: string }>;
        };
        evento.prompt = async () => {
          (window as unknown as Record<string, unknown>).__dialogoNativo = true;
        };
        evento.userChoice = Promise.resolve({ outcome: "accepted" });
        window.dispatchEvent(evento);
      }, 300);
    });
  });
  await pagina.goto("/");

  const instalar = pagina.getByRole("button", { name: "Instalar", exact: true });
  await expect(instalar).toBeVisible();
  await instalar.click();
  expect(await pagina.evaluate(() => (window as unknown as Record<string, unknown>).__dialogoNativo)).toBe(true);
  await contexto.close();
});

test("04 — descartar el prompt no impide registrarse", async ({ browser }) => {
  const contexto = await browser.newContext({ userAgent: UA_IOS });
  const pagina = await contexto.newPage();
  await pagina.goto("/");
  await pagina.getByRole("button", { name: /Entendido|Cerrar/ }).first().click();

  // El boton de registro sigue accesible y funciona.
  await pagina.getByRole("link", { name: /Registrarme/ }).click();
  await pagina.waitForURL("**/registro/paso-1");
  await expect(pagina.getByLabel("Cedula")).toBeVisible();
  await contexto.close();
});

test("05 — los pasos del registro van en el orden de la spec", async ({ page }) => {
  const esperado = ["Cedula", "Nombre", "Telefono", "Correo", null, "Contrasena"];
  await page.goto("/registro/paso-1");

  await expect(page.getByLabel("Cedula")).toBeVisible();
  await page.getByLabel("Cedula").fill("V-12345678");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-2");

  await expect(page.getByLabel("Nombre")).toBeVisible();
  await expect(page.getByLabel("Apellido")).toBeVisible();
  await page.getByLabel("Nombre").fill("Maria");
  await page.getByLabel("Apellido").fill("Rodriguez");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-3");

  await expect(page.getByLabel("Telefono")).toBeVisible();
  await page.getByLabel("Telefono").fill("04141234567");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-4");

  await expect(page.getByLabel("Correo")).toBeVisible();
  await page.getByLabel("Correo").fill("maria@ejemplo.com");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-5");

  // Paso 5: tipo de usuario, seleccion unica entre tres.
  await expect(page.getByRole("radio")).toHaveCount(3);
  await page.getByRole("radio", { name: /Estudiante UCV/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-6");

  await expect(page.getByLabel("Contrasena")).toBeVisible();
  expect(esperado).toHaveLength(6);
});

test("06 — cerrar la app a mitad del registro vacia el formulario", async ({ page }) => {
  await page.goto("/registro/paso-1");
  await page.getByLabel("Cedula").fill("V-12345678");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-2");
  await page.getByLabel("Nombre").fill("Maria");

  await page.reload();

  await expect(page).toHaveURL(/paso-1/);
  await expect(page.getByLabel("Cedula")).toHaveValue("");
});

test("07 — completar los 6 pasos crea la cuenta y deja la sesion iniciada", async ({ page }) => {
  // Matiz sobre la spec: con la confirmacion de correo activada en Supabase, la
  // sesion arranca al abrir el enlace del correo, no al tocar "Crear cuenta".
  const datos = await completarRegistro(page);
  await expect(page.getByText(/Confirma tu correo/i)).toBeVisible();

  await confirmarCorreo(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");

  // La sesion persiste: otra pestaña del mismo dispositivo entra sin reautenticar.
  const otra = await page.context().newPage();
  await otra.goto("/inicio");
  await expect(otra.getByText(datos.nombre)).toBeVisible();
  await otra.close();
});

test("08 — la cuenta recien creada ve el onboarding antes de Inicio", async ({ page }) => {
  await completarRegistro(page);
  await confirmarCorreo(page);
  await expect(page).toHaveURL(/onboarding\/pantalla-1/);
});

test("09 — saltar desde la primera pantalla lleva directo a Inicio", async ({ page }) => {
  await completarRegistro(page);
  await confirmarCorreo(page);
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");
  await expect(page).toHaveURL(/\/inicio/);
});

test("10 — visto una vez, el onboarding no vuelve a mostrarse", async ({ page }) => {
  await cuentaEnInicio(page);
  await page.goto("/onboarding/pantalla-1");
  await expect(page).toHaveURL(/\/inicio/);
});

test("11 — el permiso de avisos se plantea durante el onboarding", async ({ page }) => {
  await completarRegistro(page);
  await confirmarCorreo(page);
  await page.goto("/onboarding/pantalla-3");
  await expect(page.getByText("Avisos del programa")).toBeVisible();
});

test("12 — Inicio muestra el contador de Beats en cero", async ({ page }) => {
  await cuentaEnInicio(page);
  await expect(contadorDeBeats(page)).toContainText("0");
});

test("13 — PARCIAL: el escaner pide permiso de camara antes de activarse", async ({
  page,
  context,
}) => {
  // Lo que si se comprueba aqui: la app llama a getUserMedia, que es lo que
  // dispara el dialogo del navegador. El dialogo en si lo pinta el sistema
  // operativo y no se puede ver desde una prueba automatizada.
  await cuentaEnInicio(page);
  await context.grantPermissions(["camera"]);

  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__pidioCamara = false;
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = (restricciones) => {
      (window as unknown as Record<string, unknown>).__pidioCamara = true;
      return original(restricciones);
    };
  });

  await page.goto("/escanear");
  await page.locator("video").waitFor({ state: "visible", timeout: 15_000 });
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__pidioCamara)).toBe(true);
});

test("14 — el QR se reconoce sin boton de captura", async ({ page, context }) => {
  await cuentaEnInicio(page);
  await context.grantPermissions(["camera"]);
  await page.goto("/escanear");
  await page.locator("video").waitFor({ state: "visible", timeout: 15_000 });

  // No existe ningun control de captura en la pantalla.
  await expect(page.getByRole("button", { name: /captur|tomar|foto/i })).toHaveCount(0);
});

test("15 — un QR valido muestra la confirmacion sin otorgar Beats todavia", async ({ page }) => {
  await cuentaEnInicio(page);
  const antes = await estadoDelQR(QR.sinLimite);

  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await expect(page.getByText("Vas a canjear el QR de")).toBeVisible();
  await expect(page.getByText(MARCA.sinLimite)).toBeVisible();
  await expect(page.getByText("+10")).toBeVisible();

  const despues = await estadoDelQR(QR.sinLimite);
  expect(despues.escaneos).toBe(antes.escaneos);
  await page.goto("/inicio");
  await expect(contadorDeBeats(page)).toContainText("0");
});

test("16 — confirmar otorga los Beats y muestra el contador subiendo", async ({ page }) => {
  await cuentaEnInicio(page);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();

  await expect(page.getByText(/Sumaste 10 Beats de KFC/)).toBeVisible();
  // El contador anima de 0 a 10 y termina en el valor final.
  const marcador = page.locator("[aria-label*='Beats']").first();
  await expect.poll(() => marcador.textContent(), { timeout: 5_000 }).toMatch(/10/);
});

test("17 — cancelar no otorga Beats ni gasta cupo diario ni total", async ({ page }) => {
  await cuentaEnInicio(page);
  const antes = await estadoDelQR(QR.sinLimite);

  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.waitForURL("**/escanear");

  const despues = await estadoDelQR(QR.sinLimite);
  expect(despues.escaneos).toBe(antes.escaneos);
  expect(despues.qr.escaneos_totales_contador).toBe(antes.qr.escaneos_totales_contador);

  // El cupo diario tampoco se gasto: se puede canjear ahora mismo.
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await expect(page.getByRole("button", { name: "Confirmar canje" })).toBeVisible();
});

test("18 — con modo evento activo el cierre invita a seguir escaneando", async ({ page }) => {
  await cuentaEnInicio(page);
  await ponerModoEvento(true);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();

  await expect(page.getByText(/hay mas marcas cerca/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Seguir escaneando" })).toBeVisible();
});

test("19 — con modo evento inactivo el cierre es simple", async ({ page }) => {
  await cuentaEnInicio(page);
  await ponerModoEvento(false);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();

  await expect(page.getByRole("button", { name: "Seguir escaneando" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Volver a Inicio" })).toBeVisible();
});

test("20 — el QR ya escaneado hoy avisa como logro, sin llegar a confirmacion", async ({
  page,
}) => {
  await cuentaEnInicio(page);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/Sumaste 10 Beats/)).toBeVisible();
  const trasPrimero = await estadoDelQR(QR.sinLimite);

  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await expect(page.getByText(/Ya sumaste con esta marca hoy/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar canje" })).toHaveCount(0);

  const trasSegundo = await estadoDelQR(QR.sinLimite);
  expect(trasSegundo.escaneos).toBe(trasPrimero.escaneos);
});

test("21 — el QR con limite alcanzado da un mensaje neutro, sin confirmacion", async ({
  page,
}) => {
  await cuentaEnInicio(page);
  await page.goto(`/escanear/confirmar?qr=${QR.agotado}`);

  await expect(page.getByText(/Este codigo ya no esta activo/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar canje" })).toHaveCount(0);

  const visible = await page.locator("main").innerText();
  expect(visible).not.toMatch(/limite|se acabo|agotado|tarde/i);
});

test("22 — un codigo ilegible invita a enfocar mejor y el escaner sigue activo", async ({
  page,
  context,
  request,
}) => {
  await cuentaEnInicio(page);
  await context.grantPermissions(["camera"]);

  // El contrato: cualquier cosa que no sea un QR de Latidos da qr_invalido.
  const cookies = await context.cookies();
  const cabecera = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const respuesta = await request.post("/api/qr/validar", {
    headers: { cookie: cabecera, "Content-Type": "application/json" },
    data: { contenido: "esto no es un QR de Latidos" },
  });
  expect(await respuesta.json()).toMatchObject({ valido: false, motivo: "qr_invalido" });

  // Y la pantalla del escaner mantiene el visor vivo para reintentar.
  await page.goto("/escanear");
  await page.locator("video").waitFor({ state: "visible", timeout: 15_000 });
  await expect(page.getByText(/Enfoca el QR de la marca/)).toBeVisible();
});

test("23 — sin conexion sugiere reintentar y no procesa nada en segundo plano", async ({
  page,
  context,
}) => {
  await cuentaEnInicio(page);
  const antes = await estadoDelQR(QR.sinLimite);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);

  await context.setOffline(true);
  await page.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(page.getByText(/conexion/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();

  await context.setOffline(false);
  const despues = await estadoDelQR(QR.sinLimite);
  expect(despues.escaneos).toBe(antes.escaneos);
  expect(despues.qr.escaneos_totales_contador).toBe(antes.qr.escaneos_totales_contador);
});

test("24 — cambiar los Beats de un QR impreso aplica al siguiente canje", async ({
  page,
  browser,
}) => {
  await cuentaEnInicio(page);
  await page.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await expect(page.getByText("+10")).toBeVisible();

  // El admin sube los Beats sin tocar el codigo fisico.
  await cambiarBeatsDelQR(QR.sinLimite, 35);

  const contexto = await browser.newContext();
  const otra = await contexto.newPage();
  await cuentaEnInicio(otra);
  await otra.goto(`/escanear/confirmar?qr=${QR.sinLimite}`);
  await expect(otra.getByText("+35")).toBeVisible();
  await otra.getByRole("button", { name: "Confirmar canje" }).click();
  await expect(otra.getByText(/Sumaste 35 Beats/)).toBeVisible();
  await contexto.close();
});
