import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";

import { cuentaConId } from "../ayudantes/beats";
import { ponerAvatarPath, reiniciarMock } from "../ayudantes/mock";

/**
 * Avatar de Inicio (constitution §2, v2.14.0): la foto de perfil en la pildora
 * de la esquina; sin foto o si falla, el corazon con audifonos. Lleva a Perfil.
 */
test.beforeEach(reiniciarMock);
test.use({ viewport: { width: 390, height: 844 } });

const FOTO = join(__dirname, "..", "..", "public", "splash", "splash-750x1334.png");
const pildora = (page: Page) => page.getByRole("main").getByRole("link", { name: "Ir a tu perfil" });
const corazon = (page: Page) => pildora(page).locator("[data-corazon-perfil]");
const foto = (page: Page) => pildora(page).locator("[data-avatar] > img:not([data-corazon-perfil])");

/** Errores de JS y de consola de la app. */
function vigilarErrores(page: Page) {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => {
    // Fuera: los 400 de recursos que el navegador anota solo, y los avisos de
    // React en desarrollo (el de fetchpriority del splash, que no existe en
    // produccion y no es de esta pantalla).
    if (m.type() === "error" && !/Failed to load resource|^Warning: /.test(m.text())) errores.push(m.text());
  });
  return errores;
}

test("sin foto: el corazon con audifonos, enlace a /perfil y zona tactil de 44px o mas", async ({ page }) => {
  await cuentaConId(page);
  await expect(corazon(page)).toBeVisible();
  await expect(foto(page)).toHaveCount(0);
  await expect(pildora(page)).toHaveAttribute("href", "/perfil");
  const caja = (await pildora(page).boundingBox())!;
  expect(caja.width).toBeGreaterThanOrEqual(44);
  expect(caja.height).toBeGreaterThanOrEqual(44);
  await pildora(page).click();
  await page.waitForURL("**/perfil");
});

test("con una ruta cuyo archivo no existe: queda el corazon y sin errores", async ({ page }) => {
  const { id } = await cuentaConId(page);
  const errores = vigilarErrores(page);
  await ponerAvatarPath(id, `${id}/avatar-1.webp`);
  await page.reload();
  await expect(corazon(page)).toBeVisible();
  // La firma falla en Storage: nunca se pinta una imagen rota.
  await page.waitForTimeout(500);
  await expect(foto(page)).toHaveCount(0);
  expect(errores).toEqual([]);
});

test("con foto: la muestra en circulo, con fundido, y al cambiarla en Perfil se ve la nueva", async ({
  page,
}) => {
  await cuentaConId(page);
  const errores = vigilarErrores(page);
  const subir = async () => {
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Cambiar foto de perfil" }).click();
    await page.locator("[data-entrada-foto]").setInputFiles(FOTO);
    await page.getByRole("dialog").getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  };

  await subir();
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Inicio" }).click();
  await page.waitForURL("**/inicio");
  await expect(pildora(page).locator("[data-con-foto]")).toHaveCount(1);
  await expect(foto(page)).toHaveAttribute("alt", "");
  await expect(foto(page)).toHaveAttribute("src", /\/storage\/v1\/object\/sign\/avatares\//);
  await expect(foto(page)).toHaveCSS("object-fit", "cover");
  await expect(foto(page)).toHaveCSS("border-radius", "9999px");
  await expect(foto(page)).toHaveCSS("transition-duration", "0.2s");
  const circulo = (await pildora(page).locator("[data-avatar]").boundingBox())!;
  expect([Math.round(circulo.width), Math.round(circulo.height)]).toEqual([46, 46]);
  // La pildora no cambia: mismo tamaño, borde y sombra.
  const caja = (await pildora(page).boundingBox())!;
  expect([Math.round(caja.width), Math.round(caja.height)]).toEqual([108, 58]);
  await expect(pildora(page)).toHaveCSS("background-color", "rgba(255, 255, 255, 0.85)");
  const primera = await foto(page).getAttribute("src");

  // Cambiarla en Perfil y volver: la nueva, no la URL vieja del archivo borrado.
  await subir();
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Inicio" }).click();
  await page.waitForURL("**/inicio");
  await expect(pildora(page).locator("[data-con-foto]")).toHaveCount(1);
  expect(await foto(page).getAttribute("src")).not.toBe(primera);
  expect(await foto(page).evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(512);

  // Quitarla en Perfil y volver: el corazon otra vez.
  await page.goto("/perfil");
  await page.getByRole("button", { name: "Cambiar foto de perfil" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Quitar foto" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Quitar foto" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Inicio" }).click();
  await page.waitForURL("**/inicio");
  await expect(corazon(page)).toBeVisible();
  await expect(foto(page)).toHaveCount(0);
  expect(errores).toEqual([]);
});

test.describe("con movimiento reducido", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("la foto aparece sin fundido", async ({ page }) => {
    await cuentaConId(page);
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Cambiar foto de perfil" }).click();
    await page.locator("[data-entrada-foto]").setInputFiles(FOTO);
    await page.getByRole("dialog").getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto("/inicio");
    await expect(pildora(page).locator("[data-con-foto]")).toHaveCount(1);
    // Sin fundido (la regla global de movimiento reducido deja 0.01ms).
    const duracion = await foto(page).evaluate((i) => parseFloat(getComputedStyle(i).transitionDuration));
    expect(duracion).toBeLessThan(0.001);
  });
});
