import { expect, test } from "@playwright/test";

import { completarRegistro, confirmarCorreo, datosDeRegistro } from "../ayudantes/cuenta";
import { reiniciarMock } from "../ayudantes/mock";

/**
 * T059 — flujo completo de registro (6 pasos).
 * Cubre los criterios de aceptacion 5, 6 y 7 de la spec.
 */
test.beforeEach(reiniciarMock);

test("los 6 pasos van en el orden que manda la spec", async ({ page }) => {
  await page.goto("/registro/paso-1");

  // Criterio 5: cedula, nombre y apellido, telefono, correo, tipo, contrasena.
  await expect(page.getByText("Paso 1 de 6")).toBeVisible();
  await expect(page.getByLabel("Cédula")).toBeVisible();
  await page.getByLabel("Cédula").fill("V-12345678");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-2");
  await expect(page.getByLabel("Nombre")).toBeVisible();
  await expect(page.getByLabel("Apellido")).toBeVisible();
  await page.getByLabel("Nombre").fill("Maria");
  await page.getByLabel("Apellido").fill("Rodriguez");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-3");
  await expect(page.getByLabel("Teléfono")).toBeVisible();
  await page.getByLabel("Teléfono").fill("04141234567");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-4");
  await expect(page.getByLabel("Correo")).toBeVisible();
  await page.getByLabel("Correo").fill("maria@ejemplo.com");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-5");
  // Criterio 3 de reglas de negocio: exactamente tres opciones.
  await expect(page.getByRole("radio")).toHaveCount(3);
  await page.getByRole("radio", { name: /Estudiante UCV/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.waitForURL("**/paso-6");
  await expect(page.getByText("Paso 6 de 6")).toBeVisible();
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
});

test("completar los 6 pasos crea la cuenta y pide confirmar el correo", async ({ page }) => {
  // Criterio 7. La sesion no arranca aqui: con la confirmacion de correo
  // activada en Supabase, primero hay que abrir el enlace.
  await completarRegistro(page);
  await expect(page.getByText(/Revisa tu correo/i)).toBeVisible();
});

test("sin confirmar el correo no hay sesion", async ({ page }) => {
  await completarRegistro(page);
  await page.goto("/inicio");
  // Sin sesion, Inicio no se abre.
  await expect(page).not.toHaveURL(/\/inicio/);
});

test("confirmar el correo inicia la sesion y lleva al onboarding", async ({ page }) => {
  // Criterio 8: la cuenta recien creada aterriza en el onboarding.
  const datos = await completarRegistro(page);
  await confirmarCorreo(page);
  await expect(page).toHaveURL(/\/onboarding\/pantalla-1/);

  await page.getByRole("button", { name: "Saltar" }).click();
  await page.waitForURL("**/inicio");
  await expect(page.getByText(datos.nombre)).toBeVisible();
});

test("cerrar la app a mitad del registro borra lo avanzado", async ({ page }) => {
  // Criterio 6 y regla de negocio 1: el formulario vive solo en memoria.
  await page.goto("/registro/paso-1");
  await page.getByLabel("Cédula").fill("V-12345678");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-2");

  await page.reload();

  await expect(page).toHaveURL(/\/registro\/paso-1/);
  await expect(page.getByLabel("Cédula")).toHaveValue("");
});

test("no se puede avanzar el paso del tipo sin elegir una opcion", async ({ page }) => {
  await page.goto("/registro/paso-1");
  await page.getByLabel("Cédula").fill("V-12345678");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-2");
  await page.getByLabel("Nombre").fill("Maria");
  await page.getByLabel("Apellido").fill("Rodriguez");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-3");
  await page.getByLabel("Teléfono").fill("04141234567");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-4");
  await page.getByLabel("Correo").fill("maria@ejemplo.com");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/paso-5");

  // El boton queda deshabilitado hasta elegir: no hay forma de pasar de aqui.
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
  await page.getByRole("radio", { name: /Egresado/ }).click();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
});

test.describe("validacion: solo sintaxis, ningun padron", () => {
  // Regla de negocio 2: nada se contrasta contra un registro oficial.
  test("una cedula inventada pasa sin chistar", async ({ page }) => {
    await completarRegistro(page, datosDeRegistro({ cedula: "V-00000000" }));
    await expect(page.getByText(/Revisa tu correo/i)).toBeVisible();
  });

  test("el telefono si revisa sintaxis basica", async ({ page }) => {
    await page.goto("/registro/paso-1");
    await page.getByLabel("Cédula").fill("V-12345678");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-2");
    await page.getByLabel("Nombre").fill("Maria");
    await page.getByLabel("Apellido").fill("Rodriguez");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-3");

    await page.getByLabel("Teléfono").fill("no-son-digitos");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/paso-3/);
  });

  test("el correo si revisa que tenga arroba", async ({ page }) => {
    await page.goto("/registro/paso-1");
    await page.getByLabel("Cédula").fill("V-12345678");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-2");
    await page.getByLabel("Nombre").fill("Maria");
    await page.getByLabel("Apellido").fill("Rodriguez");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-3");
    await page.getByLabel("Teléfono").fill("04141234567");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/paso-4");

    await page.getByLabel("Correo").fill("sin-arroba.com");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/paso-4/);
  });
});

/**
 * Rediseño visual del registro (constitution §2, v2.10.2): banners "Aliado",
 * boton tap siempre tocable y "Crear cuenta" sin deslizar ni doble envio.
 */
type Paso = 1 | 2 | 3 | 4 | 5 | 6;

/** Avanza por el registro hasta dejar la pantalla en el paso pedido. */
async function llegarAlPaso(page: import("@playwright/test").Page, destino: Paso) {
  const datos = datosDeRegistro();
  await page.goto("/registro/paso-1");
  const continuar = () => page.getByRole("button", { name: "Continuar" }).click();
  const pasos: Array<() => Promise<void>> = [
    async () => {
      await page.getByLabel("Cédula").fill(datos.cedula);
      await continuar();
    },
    async () => {
      await page.getByLabel("Nombre").fill(datos.nombre);
      await page.getByLabel("Apellido").fill(datos.apellido);
      await continuar();
    },
    async () => {
      await page.getByLabel("Teléfono").fill(datos.telefono);
      await continuar();
    },
    async () => {
      await page.getByLabel("Correo").fill(datos.correo);
      await continuar();
    },
    async () => {
      await page.getByRole("radio", { name: datos.tipo }).click();
      await continuar();
    },
  ];
  for (let paso = 1; paso < destino; paso++) {
    await pasos[paso - 1]();
    await page.waitForURL(`**/paso-${paso + 1}`);
  }
  await expect(page.getByText(`Paso ${destino} de 6`)).toBeVisible();
  return datos;
}

test.describe("rediseño del registro", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("banner Aliado en los pasos 1, 3 y 4 y en Revisa tu correo; no en 2, 5 ni 6", async ({ page }) => {
    const datos = datosDeRegistro();
    const banner = page.locator("[data-banner-aliado]");
    const conBanner: Record<Paso, boolean> = { 1: true, 2: false, 3: true, 4: true, 5: false, 6: false };
    await page.goto("/registro/paso-1");
    const acciones: Record<Paso, () => Promise<void>> = {
      1: () => page.getByLabel("Cédula").fill(datos.cedula),
      2: async () => {
        await page.getByLabel("Nombre").fill(datos.nombre);
        await page.getByLabel("Apellido").fill(datos.apellido);
      },
      3: () => page.getByLabel("Teléfono").fill(datos.telefono),
      4: () => page.getByLabel("Correo").fill(datos.correo),
      5: () => page.getByRole("radio", { name: datos.tipo }).click(),
      6: () => page.getByLabel("Contraseña", { exact: true }).fill(datos.contrasena),
    };
    for (const paso of [1, 2, 3, 4, 5, 6] as Paso[]) {
      await expect(page.getByText(`Paso ${paso} de 6`)).toBeVisible();
      if (conBanner[paso]) {
        await expect(banner).toBeVisible();
        await expect(banner).toHaveAttribute("data-banner-aliado", `registro-paso-${paso}`);
        await expect(banner.getByText("Aliado")).toBeVisible();
        const caja = (await banner.boundingBox())!;
        expect(caja.width).toBeLessThanOrEqual(330.5);
        expect(caja.width / caja.height).toBeCloseTo(2, 1);
      } else {
        await expect(banner).toHaveCount(0);
      }
      await acciones[paso]();
      await page.getByRole("button", { name: paso === 6 ? "Crear cuenta" : "Continuar" }).click();
      if (paso < 6) await page.waitForURL(`**/paso-${paso + 1}`);
    }
    await page.waitForURL("**/confirma-tu-correo");
    await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();
    await expect(banner).toHaveAttribute("data-banner-aliado", "registro-revisa-correo");
    await expect(banner).toBeVisible();
  });

  test("con el teclado abierto el banner se oculta", async ({ page }) => {
    await page.goto("/registro/paso-1");
    const banner = page.locator("[data-banner-aliado]");
    await expect(banner).toBeVisible();
    // El visualViewport no se puede encoger en Chromium de escritorio: se
    // simula el del teclado (60% de la ventana) y se avisa con resize.
    await page.evaluate(() => {
      const vista = window.visualViewport!;
      Object.defineProperty(vista, "height", { configurable: true, get: () => window.innerHeight * 0.6 });
      vista.dispatchEvent(new Event("resize"));
    });
    await expect(banner).toBeHidden();
  });

  test("en el registro no hay botones de deslizar: todo es tap", async ({ page }) => {
    await llegarAlPaso(page, 6);
    await expect(page.locator("[data-boton-deslizar]")).toHaveCount(0);
    await expect(page.locator("[data-boton-vidrio]")).toHaveCount(1);
  });

  test("los botones tap no llevan circulo: texto centrado y flecha a su derecha", async ({ page }) => {
    for (const paso of [1, 5, 6] as Paso[]) {
      await llegarAlPaso(page, paso);
      const boton = page.locator("[data-boton-vidrio]");
      await expect(boton.locator(".circulo-flecha")).toHaveCount(0);
      const texto = (await boton.locator("span").first().boundingBox())!;
      const flecha = (await boton.locator("[data-flecha-boton]").boundingBox())!;
      const caja = (await boton.boundingBox())!;
      expect(flecha.width).toBeCloseTo(22, 0);
      expect(Math.round(flecha.x - (texto.x + texto.width))).toBe(10);
      // El conjunto texto + flecha, centrado en la pildora.
      const centro = (texto.x + flecha.x + flecha.width) / 2;
      expect(Math.abs(centro - (caja.x + caja.width / 2))).toBeLessThanOrEqual(1);
      expect(caja.height).toBeGreaterThanOrEqual(64);
    }
  });

  test("el punto del ECG queda en x = paso * 57; en el paso 6, al final del trazo", async ({ page }) => {
    // Centro del punto, en unidades del viewBox (-6 0 354 30).
    const xDelPunto = () =>
      page.evaluate(() => {
        const lienzo = document.querySelector(".registro-ecg-lienzo")!.getBoundingClientRect();
        const punto = document.querySelector("[data-ecg-punto] circle")!.getBoundingClientRect();
        return ((punto.left + punto.width / 2 - lienzo.left) / lienzo.width) * 354 - 6;
      });
    const progreso = page.getByRole("progressbar", { name: "Progreso del registro" });
    for (const paso of [1, 3, 6] as Paso[]) {
      await llegarAlPaso(page, paso);
      await expect(progreso).toHaveAttribute("aria-valuenow", String(paso));
      await expect(progreso).toHaveAttribute("data-paso", String(paso));
      await expect(progreso).toHaveAttribute("data-progreso-x", String(paso * 57));
      await expect.poll(xDelPunto).toBeCloseTo(paso * 57, 0);
    }
    // En el paso 6 el punto cae sobre el final del trazo (x = 342).
    expect(await xDelPunto()).toBeCloseTo(342, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    // Al volver, el punto regresa al paso anterior.
    await page.goBack();
    await expect(progreso).toHaveAttribute("data-paso", "5");
    await expect.poll(xDelPunto).toBeCloseTo(5 * 57, 0);
  });
});

for (const [ancho, alto] of [
  [390, 844],
  [375, 667],
] as const) {
  test.describe(`a ${ancho}x${alto}`, () => {
    test.use({ viewport: { width: ancho, height: alto } });

    test("el boton de cada paso se ve entero y se puede tocar sin desplazar", async ({ page }) => {
      for (const paso of [1, 3, 4, 5, 6] as Paso[]) {
        await llegarAlPaso(page, paso);
        const boton = page.locator("[data-boton-vidrio]");
        await page.evaluate(() => window.scrollTo(0, 0));
        const caja = (await boton.boundingBox())!;
        expect(caja.y, `paso ${paso}`).toBeGreaterThanOrEqual(0);
        expect(caja.y + caja.height, `paso ${paso}`).toBeLessThanOrEqual(alto);
        expect(caja.height).toBeGreaterThanOrEqual(64);
        // Lo que hay en el centro del boton es el propio boton: nada lo tapa.
        const encima = await page.evaluate(
          ([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest("[data-boton-vidrio]")),
          [caja.x + caja.width / 2, caja.y + caja.height / 2],
        );
        expect(encima, `paso ${paso}`).toBe(true);
        // En pantalla chica el banner no aparece.
        if (alto < 700) await expect(page.locator("[data-banner-aliado]")).toBeHidden();
      }
    });
  });
}

test.describe("Crear cuenta", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("es un boton tap deshabilitado hasta que la contraseña vale", async ({ page }) => {
    await llegarAlPaso(page, 6);
    const crear = page.getByRole("button", { name: "Crear cuenta" });
    await expect(crear).toHaveAttribute("data-boton-vidrio", "");
    await expect(crear).toBeDisabled();
    await page.getByLabel("Contraseña", { exact: true }).fill("123");
    await expect(crear).toBeDisabled();
    await page.getByLabel("Contraseña", { exact: true }).fill("secreta123");
    await expect(crear).toBeEnabled();
  });

  test("Enter en el campo envia el formulario", async ({ page }) => {
    const datos = await llegarAlPaso(page, 6);
    await page.getByLabel("Contraseña", { exact: true }).fill(datos.contrasena);
    await page.getByLabel("Contraseña", { exact: true }).press("Enter");
    await page.waitForURL("**/confirma-tu-correo");
  });

  test("Enter con una contraseña corta muestra el error en vez de enviar", async ({ page }) => {
    await llegarAlPaso(page, 6);
    await page.getByLabel("Contraseña", { exact: true }).fill("123");
    await page.getByLabel("Contraseña", { exact: true }).press("Enter");
    await expect(page.getByText("Usa al menos 6 caracteres")).toBeVisible();
    await expect(page).toHaveURL(/paso-6/);
  });

  test("no hay doble envio: mientras espera queda deshabilitado y en carga", async ({ page }) => {
    const datos = await llegarAlPaso(page, 6);
    let pedidos = 0;
    let soltar!: () => void;
    const espera = new Promise<void>((r) => (soltar = r));
    await page.route("**/api/auth/registro", async (ruta) => {
      pedidos++;
      await espera;
      await ruta.continue();
    });
    const campo = page.getByLabel("Contraseña", { exact: true });
    await campo.fill(datos.contrasena);
    const boton = page.locator("[data-boton-vidrio]");
    await boton.click();
    await expect(boton).toBeDisabled();
    await expect(boton).toHaveAttribute("aria-busy", "true");
    await expect(boton.locator("[data-flecha-boton]")).toHaveCount(0);
    await expect(boton).toHaveText("Creando…");
    // Ni otro toque ni Enter mandan un segundo pedido.
    await boton.click({ force: true });
    await campo.press("Enter");
    await page.waitForTimeout(300);
    expect(pedidos).toBe(1);
    soltar();
    await page.waitForURL("**/confirma-tu-correo");
    expect(pedidos).toBe(1);
  });
});
