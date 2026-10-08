import { test, type Page } from "@playwright/test";

const D = process.env.SALIDA!;
test.skip(!process.env.SALIDA, "solo con npm run capturas");
// Sin el destello de las etiquetas: la captura no sale a mitad de la animacion.
test.use({ contextOptions: { reducedMotion: "reduce" } });

async function irA(page: Page, i: number) {
  await page.locator("[data-carrusel-bienvenida]").evaluate((el, n) => el.scrollTo({ left: n * el.clientWidth, behavior: "instant" as ScrollBehavior }), i);
  await page.waitForTimeout(700);
}

const VIEWPORTS = [
  [320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [430, 932],
] as const;

test("4 pantallas a 390", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForTimeout(1200);
  for (let i = 0; i < 4; i++) {
    await irA(page, i);
    await page.screenshot({ path: `${D}/bienvenida-${i + 1}-390x844.png` });
  }
});

for (const [w, h] of VIEWPORTS) {
  test(`pantalla 1 a ${w}x${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${D}/bienvenida-1-${w}x${h}.png` });
    if ((w === 375 && h === 667) || (w === 360 && h === 640)) {
      await irA(page, 1);
      await page.screenshot({ path: `${D}/bienvenida-2-${w}x${h}.png` });
    }
  });
}
