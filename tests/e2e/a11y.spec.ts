import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  "/",
  "/sobre-mi",
  "/servicios",
  "/proyectos",
  "/contacto",
  "/stack",
  "/legal/privacidad",
];
const THEMES = ["light", "dark"] as const;

for (const theme of THEMES) {
  for (const route of ROUTES) {
    test(`sin violaciones críticas ni serias en ${route} · ${theme}`, async ({ page }) => {
      await page.addInitScript((selectedTheme: string) => {
        try {
          localStorage.setItem("ao-theme", selectedTheme);
          if (selectedTheme === "dark") {
            document.documentElement.classList.add("dark");
          }
        } catch {}
      }, theme);
      await page.emulateMedia({ colorScheme: theme });
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
