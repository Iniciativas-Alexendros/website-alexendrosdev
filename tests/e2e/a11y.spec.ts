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
  "/blog",
  "/blog/cuanto-cuesta-web-medida-2026",
  "/contacto",
  "/escaparate",
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
    await page.waitForLoadState("networkidle");
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
