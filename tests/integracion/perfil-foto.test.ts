import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { extensionDe, recorteCentral, rutaAvatar, validarArchivo } from "../../src/lib/avatar";
import { cuentaConId } from "../ayudantes/beats";
import { objetosDeStorage, perfilDelMock, reiniciarMock, simularFalla } from "../ayudantes/mock";

/**
 * Foto de perfil (constitution §2, v2.12.0): subir, cambiar y quitar. Contra
 * el mock, que espeja el bucket privado `avatares` (1 MB, JPEG/WebP/PNG, cada
 * quien su carpeta) y el check de avatar_path.
 */
test.beforeEach(reiniciarMock);

const RAIZ = join(__dirname, "..", "..");
/** Una imagen real y vertical (750x1334): sirve para ver el recorte al cuadrado. */
const FOTO = join(RAIZ, "public", "splash", "splash-750x1334.png");

test.describe("procesamiento", () => {
  test("valida tipo y tamano antes de abrir el archivo", { tag: "@rapido" }, () => {
    expect(validarArchivo({ type: "image/jpeg", size: 2_000_000 })).toBeNull();
    expect(validarArchivo({ type: "image/heic", size: 2_000_000 })).toBeNull();
    expect(validarArchivo({ type: "application/pdf", size: 10 })).toBe("no-imagen");
    expect(validarArchivo({ type: "", size: 10 })).toBe("no-imagen");
    expect(validarArchivo({ type: "image/png", size: 15 * 1024 * 1024 + 1 })).toBe("muy-grande");
  });

  test("recorta el cuadrado central", { tag: "@rapido" }, () => {
    expect(recorteCentral(750, 1334)).toEqual({ x: 0, y: 292, lado: 750 });
    expect(recorteCentral(4032, 3024)).toEqual({ x: 504, y: 0, lado: 3024 });
    expect(recorteCentral(512, 512)).toEqual({ x: 0, y: 0, lado: 512 });
  });

  test("la ruta va en la carpeta de la persona con la extension del formato", { tag: "@rapido" }, () => {
    expect(extensionDe("image/webp")).toBe("webp");
    expect(extensionDe("image/jpeg")).toBe("jpg");
    expect(rutaAvatar("u-1", "image/webp", 1700000000000)).toBe("u-1/avatar-1700000000000.webp");
    expect(rutaAvatar("u-1", "image/jpeg", 1)).toBe("u-1/avatar-1.jpg");
  });

  test("SQL idempotente y Storage fuera de las migraciones del CI", { tag: "@rapido" }, () => {
    const migracion = readFileSync(join(RAIZ, "supabase/migrations/20261008120000_avatar_path.sql"), "utf8");
    expect(migracion).toContain("add column if not exists avatar_path text null");
    expect(migracion).toContain("drop constraint if exists usuarios_avatar_path_propio");
    // Nada del esquema storage fuera de los comentarios: el Postgres del CI no lo tiene.
    expect(migracion.replace(/--.*$/gm, "")).not.toMatch(/storage\./);
    const storage = readFileSync(join(RAIZ, "supabase/storage/avatares.sql"), "utf8");
    expect(storage).toMatch(
      /values \('avatares', 'avatares', false, 1048576, array\['image\/jpeg', 'image\/webp', 'image\/png'\]\)/,
    );
    expect(storage).toContain("on conflict (id) do update");
    for (const accion of ["select", "insert", "update", "delete"]) {
      expect(storage).toContain(`drop policy if exists "avatares_${accion}_propios" on storage.objects;`);
      expect(storage).toContain(`on storage.objects for ${accion}\n  to authenticated`);
    }
    expect(storage.match(/\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/g)).toHaveLength(5);
  });

  test("el service worker no toca Storage", { tag: "@rapido" }, () => {
    const sw = readFileSync(join(RAIZ, "public", "sw.js"), "utf8");
    expect(sw).toContain('if (url.pathname.startsWith("/storage/v1/")) return;');
    // Y ademas solo intercepta su propio origen (Supabase es otro).
    expect(sw).toContain("if (url.origin !== self.location.origin) return;");
  });
});

const botonAvatar = (page: Page) => page.getByRole("button", { name: "Cambiar foto de perfil" });
const hoja = (page: Page) => page.getByRole("dialog", { name: "Foto de perfil" });
const fotoDelAvatar = (page: Page) => botonAvatar(page).locator("img");

async function elegirFoto(page: Page, archivo: Parameters<Page["setInputFiles"]>[1] = FOTO) {
  await page.locator("[data-entrada-foto]").setInputFiles(archivo);
}

async function subirFoto(page: Page) {
  await botonAvatar(page).click();
  await elegirFoto(page);
  await expect(hoja(page).locator("[data-vista-previa]")).toBeVisible();
  await hoja(page).getByRole("button", { name: "Guardar" }).click();
  await expect(hoja(page)).toHaveCount(0);
}

test.describe("en el Perfil", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sin foto: iniciales, boton con etiqueta y circulo de camara", async ({ page }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    await expect(botonAvatar(page)).toHaveText("MR");
    await expect(fotoDelAvatar(page)).toHaveCount(0);
    await expect(botonAvatar(page).locator(".perfil-avatar-camara")).toHaveCSS("width", "34px");
    await botonAvatar(page).click();
    await expect(hoja(page)).toBeVisible();
    await expect(hoja(page).getByRole("button", { name: "Elegir o tomar foto" })).toBeVisible();
    // Sin foto no hay nada que quitar; los botones de la hoja no llevan circulo.
    await expect(hoja(page).getByRole("button", { name: "Quitar foto" })).toHaveCount(0);
    await expect(hoja(page).locator(".circulo-flecha, .circulo-navy")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(hoja(page)).toHaveCount(0);
  });

  test("subir: vista previa redonda, guardar y la foto aparece al instante y tras recargar", async ({
    page,
  }) => {
    const { id } = await cuentaConId(page);
    await page.goto("/perfil");
    await botonAvatar(page).click();
    await elegirFoto(page);
    const previa = hoja(page).locator("[data-vista-previa]");
    await expect(previa).toBeVisible();
    expect(await previa.evaluate((i: HTMLImageElement) => [i.naturalWidth, i.naturalHeight])).toEqual([
      512, 512,
    ]);
    await expect(previa).toHaveCSS("width", "160px");
    await expect(hoja(page).getByRole("button", { name: "Elegir otra" })).toBeVisible();

    await hoja(page).getByRole("button", { name: "Guardar" }).click();
    await expect(hoja(page)).toHaveCount(0);
    await expect(fotoDelAvatar(page)).toHaveAttribute("alt", "");
    await expect(botonAvatar(page).locator("[data-con-foto]")).toHaveCount(1);

    // En Storage: un archivo en su carpeta, WebP (Chromium lo codifica) y muy por debajo de 1 MB.
    const objetos = await objetosDeStorage();
    expect(objetos).toHaveLength(1);
    expect(objetos[0].clave).toMatch(new RegExp(`^avatares/${id}/avatar-\\d+\\.webp$`));
    expect(objetos[0].tipo).toBe("image/webp");
    expect(objetos[0].tamano).toBeLessThan(200 * 1024);
    expect((await perfilDelMock(id))?.avatar_path).toBe(objetos[0].clave.slice("avatares/".length));

    // Al volver: URL firmada del bucket privado, la foto en 512x512.
    await page.reload();
    await expect(botonAvatar(page).locator("[data-con-foto]")).toHaveCount(1);
    await expect(fotoDelAvatar(page)).toHaveAttribute("src", /\/storage\/v1\/object\/sign\/avatares\//);
    expect(await fotoDelAvatar(page).evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(512);
  });

  test("cambiar la foto borra la anterior; quitarla vuelve a las iniciales", async ({ page }) => {
    const { id } = await cuentaConId(page);
    await page.goto("/perfil");
    await subirFoto(page);
    const [primera] = await objetosDeStorage();
    await subirFoto(page);
    const objetos = await objetosDeStorage();
    expect(objetos).toHaveLength(1);
    expect(objetos[0].clave).not.toBe(primera.clave);

    await botonAvatar(page).click();
    await hoja(page).getByRole("button", { name: "Quitar foto" }).click();
    await expect(hoja(page)).toContainText("¿Quitar tu foto?");
    await hoja(page).getByRole("button", { name: "Quitar foto" }).click();
    await expect(hoja(page)).toHaveCount(0);
    await expect(fotoDelAvatar(page)).toHaveCount(0);
    await expect(botonAvatar(page)).toHaveText("MR");
    expect(await objetosDeStorage()).toEqual([]);
    expect((await perfilDelMock(id))?.avatar_path).toBeNull();
  });

  test("un archivo que no es imagen avisa y no pierde la foto elegida", async ({ page }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    await botonAvatar(page).click();
    await elegirFoto(page, { name: "notas.txt", mimeType: "text/plain", buffer: Buffer.from("hola") });
    await expect(hoja(page).getByRole("alert")).toHaveText("Elige una imagen JPG, PNG o WebP.");

    await elegirFoto(page);
    await expect(hoja(page).locator("[data-vista-previa]")).toBeVisible();
    await expect(hoja(page).getByRole("alert")).toHaveCount(0);
    // Una imagen rota: avisa y la vista previa anterior sigue ahi.
    await elegirFoto(page, { name: "rota.png", mimeType: "image/png", buffer: Buffer.from("no soy png") });
    await expect(hoja(page).getByRole("alert")).toHaveText("No pudimos leer esa imagen. Prueba con otra.");
    await expect(hoja(page).locator("[data-vista-previa]")).toBeVisible();
  });

  test("sin conexion no sube y avisa; con fallo del servidor tambien, sin perder la seleccion", async ({
    page,
    context,
  }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    await botonAvatar(page).click();
    await elegirFoto(page);
    await expect(hoja(page).locator("[data-vista-previa]")).toBeVisible();

    await context.setOffline(true);
    await hoja(page).getByRole("button", { name: "Guardar" }).click();
    await expect(hoja(page).getByRole("alert")).toHaveText(
      "Sin conexión. Inténtalo de nuevo cuando tengas internet.",
    );
    await expect(hoja(page).locator("[data-vista-previa]")).toBeVisible();
    await context.setOffline(false);
    expect(await objetosDeStorage()).toEqual([]);

    await simularFalla("storage", true);
    await hoja(page).getByRole("button", { name: "Guardar" }).click();
    await expect(hoja(page).getByRole("alert")).toHaveText("No pudimos guardar tu foto. Inténtalo de nuevo.");
    await expect(hoja(page).locator("[data-vista-previa]")).toBeVisible();
    await simularFalla("storage", false);

    // Vuelve a intentar con la misma seleccion y sale bien.
    await hoja(page).getByRole("button", { name: "Guardar" }).click();
    await expect(hoja(page)).toHaveCount(0);
    expect(await objetosDeStorage()).toHaveLength(1);
  });

  test("mientras guarda: 'Guardando…' deshabilitado y una sola subida", async ({ page }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    await botonAvatar(page).click();
    await elegirFoto(page);
    let subidas = 0;
    let soltar: () => void = () => {};
    const espera = new Promise<void>((r) => (soltar = r));
    await page.route("**/storage/v1/object/avatares/**", async (ruta) => {
      subidas += 1;
      await espera;
      await ruta.continue();
    });
    const guardar = hoja(page).getByRole("button", { name: "Guardar" });
    await guardar.click();
    const guardando = hoja(page).getByRole("button", { name: "Guardando…" });
    await expect(guardando).toBeDisabled();
    await guardando.click({ force: true });
    soltar();
    await expect(hoja(page)).toHaveCount(0);
    expect(subidas).toBe(1);
  });
});
