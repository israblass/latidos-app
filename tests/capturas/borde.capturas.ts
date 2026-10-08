import { test, type Page } from "@playwright/test";

const D = process.env.SALIDA!;
test.skip(!process.env.SALIDA, "solo con npm run capturas");
test.use({ contextOptions: { reducedMotion: "reduce" } });

async function abrir(page: Page, zona: number) {
  if (zona) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride" as never, { insets: { top: zona, topMax: zona } } as never);
  }
  await page.goto("/");
  await page.waitForTimeout(1500);
}

async function irA(page: Page, i: number) {
  await page.locator("[data-carrusel-bienvenida]").evaluate((el, n) => el.scrollTo({ left: n * el.clientWidth, behavior: "instant" as ScrollBehavior }), i);
  await page.waitForTimeout(700);
}

for (const zona of [0, 59]) {
  test(`4 pantallas a 390x844, zona ${zona}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir(page, zona);
    for (let i = 0; i < 4; i++) {
      await irA(page, i);
      await page.screenshot({ path: `${D}/borde-${i + 1}-390x844-${zona ? "zona59" : "sin-zona"}.png` });
    }
  });
}

test("lamina 1 a 320x568 con zona 59", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await abrir(page, 59);
  await page.screenshot({ path: `${D}/borde-1-320x568-zona59.png` });
});

for (const [w, h] of [[390, 844], [375, 667], [320, 568], [430, 932]] as const) {
  test(`pie a ${w}x${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await abrir(page, 0);
    const b = (await page.locator(".bienvenida-dock").boundingBox())!;
    await page.screenshot({ path: `${D}/pie-${w}x${h}.png`, clip: { x: 0, y: b.y - 8, width: w, height: h - b.y + 8 } });
    if (w === 390) {
      const l = (await page.locator(".bienvenida-pie__logos").boundingBox())!;
      await page.screenshot({ path: `${D}/pie-logos-zoom.png`, clip: { x: l.x - 8, y: l.y - 8, width: l.width + 16, height: l.height + 16 }, scale: "device" });
    }
  });
}

test.describe("overlay de carga (simulando la app instalada)", () => {
  test.use({ javaScriptEnabled: false });
  for (const [w, h] of [[390, 844], [320, 568]] as const) {
    test(`overlay a ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.route("**/", async (r) => {
        if (r.request().resourceType() !== "document") return r.continue();
        const res = await r.fetch();
        await r.fulfill({ response: res, body: (await res.text()).split("(display-mode: standalone)").join("all") });
      });
      await page.goto("/");
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${D}/splash-overlay-${w}x${h}.png` });
    });
  }
});
