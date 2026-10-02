import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { auditar, informe } from "../ayudantes/accesibilidad";
import { abrirBeats, cuentaConId, numeroDeBeats } from "../ayudantes/beats";
import {
  completarRegistro,
  confirmarCorreo,
  cuentaEnInicio,
  datosDeRegistro,
  type DatosDeRegistro,
} from "../ayudantes/cuenta";
import {
  canalesDe,
  cierresDeSesion,
  reiniciarMock,
  sembrarMovimiento,
  simularFalla,
} from "../ayudantes/mock";

/**
 * Entrar y salir: /entrar, el Perfil minimo y "Cerrar sesión".
 *
 * Corre contra el mock, que implementa signInWithPassword (/auth/v1/token con
 * grant_type=password) y /auth/v1/logout con la forma de Supabase.
 */
test.beforeEach(reiniciarMock);

const MENSAJE_CREDENCIALES = "El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.";
const MENSAJE_SIN_CONEXION = "Sin conexión. Conéctate a internet e intenta de nuevo.";

const botonEntrar = (page: Page) => page.getByRole("button", { name: /^(Entrar|Entrando…)$/ });
const alerta = (page: Page) => page.getByRole("alert").filter({ hasText: /./ });

/** Rellena y envia el formulario de /entrar. */
async function entrarCon(page: Page, correo: string, contrasena: string) {
  if (!page.url().endsWith("/entrar")) await page.goto("/entrar");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(contrasena);
  await botonEntrar(page).click();
}

/** Una cuenta completa (confirmada y con el onboarding visto), ya sin sesion. */
async function cuentaSinSesion(page: Page): Promise<DatosDeRegistro> {
  const datos = await cuentaEnInicio(page);
  await page.context().clearCookies();
  return datos;
}

const clavesDeBeats = (page: Page) =>
  page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("latidos:beats:")));

test.describe("entrar", () => {
  test("la bienvenida lleva a Entrar con 'Ya tengo cuenta'", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Ya tengo cuenta" }).click();
    await page.waitForURL("**/entrar");
    await expect(page.getByRole("heading", { name: "Entrar", level: 1 })).toBeVisible();
    // Y desde Entrar se puede ir a crear una cuenta.
    await page.getByRole("link", { name: "Crear cuenta" }).click();
    await page.waitForURL("**/registro/paso-1");
  });

  test("con correo y contraseña correctos llega a Inicio", async ({ page }) => {
    const datos = await cuentaSinSesion(page);
    await entrarCon(page, datos.correo, datos.contrasena);
    await page.waitForURL("**/inicio");
    await expect(page.getByText(datos.nombre)).toBeVisible();
    await expect(page.locator("section[aria-label='Tu balance de Beats'] p.font-display")).toHaveText("5");
  });

  test("si no ha visto el onboarding, llega al onboarding", async ({ page }) => {
    const datos = await completarRegistro(page);
    await confirmarCorreo(page); // deja la sesion en el onboarding, sin verlo
    await page.context().clearCookies();
    await entrarCon(page, datos.correo, datos.contrasena);
    await page.waitForURL("**/onboarding/pantalla-1");
  });

  test("correo inexistente y contraseña equivocada dan el mismo mensaje", async ({ page }) => {
    const datos = await cuentaSinSesion(page);

    await entrarCon(page, datos.correo, "otra-contrasena");
    await expect(alerta(page)).toHaveText(MENSAJE_CREDENCIALES);
    const conContrasenaMala = await alerta(page).textContent();

    await entrarCon(page, "nadie-tiene-este@ejemplo.com", datos.contrasena);
    await expect(alerta(page)).toHaveText(MENSAJE_CREDENCIALES);
    expect(await alerta(page).textContent()).toBe(conContrasenaMala);
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("una cuenta sin confirmar recibe la indicacion de confirmar el correo", async ({ page }) => {
    const datos = await completarRegistro(page);
    await entrarCon(page, datos.correo, datos.contrasena);
    await expect(alerta(page)).toHaveText("Confirma tu correo para entrar. Busca el enlace que te enviamos.");
  });

  test("sin conexion, lo dice claro", async ({ page, context }) => {
    const datos = await cuentaSinSesion(page);
    await page.goto("/entrar");
    await context.setOffline(true);
    await entrarCon(page, datos.correo, datos.contrasena);
    await expect(alerta(page)).toHaveText(MENSAJE_SIN_CONEXION);
    await context.setOffline(false);
  });

  test("si la peticion no llega aunque el telefono crea tener red, tambien", async ({ page }) => {
    const datos = await cuentaSinSesion(page);
    await page.route("**/auth/v1/token**", (ruta) => ruta.abort("internetdisconnected"));
    await entrarCon(page, datos.correo, datos.contrasena);
    await expect(alerta(page)).toHaveText(MENSAJE_SIN_CONEXION);
  });

  test("cualquier otro fallo: 'No pudimos entrar. Intenta de nuevo.'", async ({ page }) => {
    const datos = await cuentaSinSesion(page);
    await simularFalla("auth:token", true);
    await entrarCon(page, datos.correo, datos.contrasena);
    await expect(alerta(page)).toHaveText("No pudimos entrar. Intenta de nuevo.");
    await simularFalla("auth:token", false);
  });

  test("un correo mal escrito se marca antes de enviar nada", async ({ page }) => {
    let pedidos = 0;
    page.on("request", (r) => {
      if (r.url().includes("/auth/v1/token")) pedidos++;
    });
    await entrarCon(page, "maria@", "secreta1");
    const correo = page.getByLabel("Correo");
    await expect(correo).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Revisa tu correo: le falta algo.")).toBeVisible();
    await expect(correo).toBeFocused();
    expect(pedidos).toBe(0);
  });

  test("mientras se envia, el boton muestra la carga y no envia dos veces", async ({ page }) => {
    const datos = await cuentaSinSesion(page);
    let pedidos = 0;
    await page.route("**/auth/v1/token**", async (ruta) => {
      pedidos++;
      await new Promise((r) => setTimeout(r, 1200));
      await ruta.continue();
    });
    await page.goto("/entrar");
    await page.getByLabel("Correo").fill(datos.correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(datos.contrasena);
    await botonEntrar(page).click();
    await expect(botonEntrar(page)).toHaveText("Entrando…");
    await expect(botonEntrar(page)).toHaveAttribute("aria-disabled", "true");
    // Playwright no hace clic en un boton con aria-disabled: se fuerza, que es
    // lo que haria un dedo impaciente.
    await botonEntrar(page).click({ force: true });
    await page.keyboard.press("Enter");
    await page.waitForURL("**/inicio");
    expect(pedidos).toBe(1);
  });

  test("mostrar u ocultar la contraseña", async ({ page }) => {
    await page.goto("/entrar");
    const campo = page.getByLabel("Contraseña", { exact: true });
    const alternar = page.getByRole("button", { name: "Mostrar contraseña" });
    await campo.fill("secreta1");
    await expect(campo).toHaveAttribute("type", "password");
    await expect(alternar).toHaveAttribute("aria-pressed", "false");
    await alternar.click();
    await expect(campo).toHaveAttribute("type", "text");
    await expect(alternar).toHaveAttribute("aria-pressed", "true");
    await alternar.click();
    await expect(campo).toHaveAttribute("type", "password");
  });

  test("con sesion abierta, Entrar manda a Inicio", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.goto("/entrar");
    await page.waitForURL("**/inicio");
  });
});

test.describe("perfil", () => {
  test("sin sesion, Perfil vuelve a la bienvenida", async ({ page }) => {
    await page.goto("/perfil");
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByRole("link", { name: "Ya tengo cuenta" })).toBeVisible();
  });

  test("el tab Perfil lleva al correo de la persona y al boton de cerrar sesion", async ({ page }) => {
    const datos = await cuentaEnInicio(page);
    const tab = page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Perfil" });
    await tab.click();
    await page.waitForURL("**/perfil");
    await expect(tab).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Perfil", level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: "Tu cuenta" })).toContainText(datos.correo);
    await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  });

  test("sin el onboarding visto, Perfil manda al onboarding como Inicio", async ({ page }) => {
    await completarRegistro(page);
    await confirmarCorreo(page);
    await page.goto("/perfil");
    await page.waitForURL("**/onboarding/pantalla-1");
  });
});

test.describe("cerrar sesion", () => {
  test("borra toda la copia de Beats, cierra el canal, va a la bienvenida y atras no muestra datos", async ({
    page,
  }) => {
    // Cuenta cada borrado de una clave de Beats y cada error de consola: la
    // limpieza tiene que ocurrir una sola vez por clave y sin errores.
    await page.addInitScript(() => {
      const w = window as unknown as { __borrados: string[] };
      w.__borrados = JSON.parse(sessionStorage.getItem("__borrados") || "[]");
      const original = Storage.prototype.removeItem;
      Storage.prototype.removeItem = function (clave: string) {
        if (clave.startsWith("latidos:beats:")) {
          w.__borrados.push(clave);
          sessionStorage.setItem("__borrados", JSON.stringify(w.__borrados));
        }
        return original.call(this, clave);
      };
    });
    // Errores de consola solo durante el cierre de sesion. Antes y despues
    // hay ruido que no es del cierre: los logos externos de la bienvenida (que
    // este entorno bloquea) y el 401 esperado de la guardia de Beats al volver.
    const errores: string[] = [];
    let mirando = false;
    page.on("console", (m) => {
      if (mirando && m.type() === "error") errores.push(m.text());
    });
    page.on("pageerror", (e) => {
      if (mirando) errores.push(String(e));
    });

    const { id, datos } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 36 }); // saldo 41
    await abrirBeats(page);
    await expect(numeroDeBeats(page)).toHaveText("41");
    await expect.poll(async () => (await canalesDe(id)).canales).toBeGreaterThan(0);

    // Una copia de otra cuenta que paso antes por este navegador.
    await page.evaluate(() =>
      localStorage.setItem("latidos:beats:otra-cuenta", JSON.stringify({ version: 1, usuario_id: "otra-cuenta" })),
    );
    await expect.poll(() => clavesDeBeats(page)).toHaveLength(2);
    const antes = await clavesDeBeats(page);

    const barra = page.getByRole("navigation", { name: "Principal" });
    await barra.getByRole("link", { name: "Perfil" }).click();
    await page.waitForURL("**/perfil");
    await expect(page.getByText(datos.correo)).toBeVisible();

    mirando = true;
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.waitForURL((url) => url.pathname === "/");
    await page.waitForLoadState("load");
    mirando = false;
    expect(errores.filter((e) => !e.includes("ERR_TUNNEL_CONNECTION_FAILED")), errores.join("\n")).toEqual([]);

    expect(await clavesDeBeats(page)).toEqual([]);
    expect(await canalesDe(id)).toEqual({ canales: 0 });
    // Solo este dispositivo: el cierre llego a Supabase con scope=local.
    expect((await cierresDeSesion()).cierres).toEqual([{ usuario: id, alcance: "local" }]);
    const cookies = await page.context().cookies();
    expect(cookies.filter((c) => c.name.startsWith("sb-")).map((c) => c.name)).toEqual([]);

    // Cada clave se borro una sola vez: no hubo doble limpieza.
    const borrados = await page.evaluate(() => (window as unknown as { __borrados: string[] }).__borrados);
    expect([...borrados].sort()).toEqual([...antes].sort());

    // Atras: ninguna pantalla protegida con los datos de la sesion cerrada.
    await page.goBack();
    await page.waitForLoadState("load");
    await expect(page.getByText(datos.correo)).toHaveCount(0);
    await expect(page.getByText("41")).toHaveCount(0);
    await expect(page).not.toHaveURL(/\/(perfil|beats|inicio)$/);
  });

  test("cerrar sesion en un telefono no cierra la de otro", async ({ page, browser }) => {
    const { id, datos } = await cuentaConId(page);

    // La misma cuenta, abierta en otro dispositivo.
    const otro = await browser.newContext({ ...test.info().project.use });
    const otroTelefono = await otro.newPage();
    await entrarCon(otroTelefono, datos.correo, datos.contrasena);
    await otroTelefono.waitForURL("**/inicio");

    await page.goto("/perfil");
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.waitForURL((url) => url.pathname === "/");
    expect((await cierresDeSesion()).cierres).toEqual([{ usuario: id, alcance: "local" }]);

    // Este telefono quedo sin sesion...
    await page.goto("/perfil");
    await page.waitForURL((url) => url.pathname === "/");

    // ...y el otro sigue dentro, tambien despues de recargar.
    await otroTelefono.goto("/perfil");
    await expect(otroTelefono.getByText(datos.correo)).toBeVisible();
    await otroTelefono.reload();
    await expect(otroTelefono.getByText(datos.correo)).toBeVisible();
    await otro.close();
  });

  test("otra cuenta que entra en el mismo navegador no ve nada de la anterior", async ({ page, browser }) => {
    // La segunda cuenta se crea aparte, en otro contexto.
    const otro = await browser.newContext({ ...test.info().project.use });
    const otraPagina = await otro.newPage();
    const segunda = await cuentaEnInicio(otraPagina, datosDeRegistro());
    await otro.close();

    const { id, datos: primera } = await cuentaConId(page);
    await sembrarMovimiento({ usuarioId: id, tipo: "regalo", beats: 72 }); // saldo 77
    await abrirBeats(page);
    await expect(numeroDeBeats(page)).toHaveText("77");

    await page.goto("/perfil");
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.waitForURL((url) => url.pathname === "/");

    // Se graba todo numero que llegue a pintarse en el contador.
    await page.addInitScript(() => {
      const vistos: string[] = [];
      (window as unknown as { __vistos: string[] }).__vistos = vistos;
      new MutationObserver(() => {
        document
          .querySelectorAll("section[aria-label='Tu balance de Beats'] p.font-display")
          .forEach((n) => vistos.push(n.textContent ?? ""));
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });

    await entrarCon(page, segunda.correo, segunda.contrasena);
    await page.waitForURL("**/inicio");
    await abrirBeats(page);
    await expect(numeroDeBeats(page)).toHaveText("5");
    await page.goto("/perfil");
    await expect(page.getByText(segunda.correo)).toBeVisible();
    await expect(page.getByText(primera.correo)).toHaveCount(0);

    const vistos = await page.evaluate(() => (window as unknown as { __vistos: string[] }).__vistos);
    expect(vistos).not.toContain("77");
  });

  test("la copia de /beats del service worker no lleva datos de nadie", async ({ page }) => {
    const datos = await cuentaEnInicio(page);
    await abrirBeats(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await page.reload();
    await expect(numeroDeBeats(page)).toBeVisible();

    const copia = await page.evaluate(async () => {
      const cache = await caches.open("latidos-shell-v10");
      const respuesta = await cache.match("/beats");
      return respuesta ? respuesta.text() : null;
    });
    expect(copia).not.toBeNull();
    expect(copia).not.toContain(datos.correo);
    expect(copia).not.toContain(datos.nombre);
    // Y ninguna otra respuesta guardada es una pantalla con sesion.
    const guardadas = await page.evaluate(async () =>
      (await (await caches.open("latidos-shell-v10")).keys()).map((r) => new URL(r.url).pathname),
    );
    expect(guardadas.filter((ruta) => /^\/(inicio|perfil|onboarding|escanear|api|auth)/.test(ruta))).toEqual([]);
  });
});

test.describe("accesibilidad", () => {
  const sinViolaciones = async (page: Page, pantalla: string) => {
    const resultado = await new AxeBuilder({ page }).analyze();
    const resumen = resultado.violations.map(
      (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`,
    );
    expect(resumen, `axe en ${pantalla}`).toEqual([]);
    const hallazgos = await auditar(page);
    expect(hallazgos, informe(pantalla, hallazgos)).toEqual([]);
  };

  test("Entrar, vacia y con error", async ({ page }) => {
    await page.goto("/entrar");
    await sinViolaciones(page, "entrar");
    await entrarCon(page, "nadie@ejemplo.com", "mala-contrasena");
    await expect(alerta(page)).toBeVisible();
    await sinViolaciones(page, "entrar con error");
  });

  test("Perfil", async ({ page }) => {
    await cuentaEnInicio(page);
    await page.goto("/perfil");
    await sinViolaciones(page, "perfil");
  });

  test("Entrar se recorre con teclado en orden y el error no se lleva el foco", async ({ page }) => {
    await page.goto("/entrar");
    const orden: string[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      orden.push(
        await page.evaluate(() => {
          const el = document.activeElement as HTMLInputElement | null;
          return el?.getAttribute("aria-label") || el?.labels?.[0]?.textContent || el?.textContent?.trim() || "";
        }),
      );
    }
    expect(orden).toEqual([
      "Volver a la bienvenida",
      "Correo",
      "Contraseña",
      "Mostrar contraseña",
      "Entrar",
      "Crear cuenta",
    ]);

    // Con el teclado: escribe, envia con Enter desde el boton.
    await page.getByLabel("Correo").fill("nadie@ejemplo.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("mala-contrasena");
    await botonEntrar(page).focus();
    await page.keyboard.press("Enter");
    // El error esta en una region que los lectores de pantalla anuncian solos,
    // y el foco se queda en el boton: no se pierde.
    const region = page.locator("p[role='alert']");
    await expect(region).toHaveText(MENSAJE_CREDENCIALES);
    await expect(botonEntrar(page)).toBeFocused();
  });
});
