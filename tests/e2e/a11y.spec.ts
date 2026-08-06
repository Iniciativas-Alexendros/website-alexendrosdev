import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Fijamos colorScheme=light (predeterminado del sitio) SOLO para
// este spec, para que la comprobación de contraste sea determinista y no
// dependa del prefiers-color-scheme del navegador headless (suele ser dark).
test.use({ colorScheme: "light" });
const ROUTES = [
  "/",
  "/sobre-mi",
  "/servicios",
  "/proyectos",
  "/contacto",
  "/stack",
  "/legal/privacidad",
];

for (const route of ROUTES) {
  test(`sin violaciones críticas ni serias de accesibilidad en ${route}`, async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("ao-theme", "light");
      } catch {}
    });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(route);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(blocking).toEqual([]);
  });
}

test("el contenido principal y el skip link son navegables por teclado", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ao-theme", "light"));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const skipLink = page.getByRole("link", { name: "Ir al contenido principal" });
  await expect(skipLink).toBeAttached();
  await page.locator("body").press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});
