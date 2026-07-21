import { test, expect } from "@playwright/test";

const PROJECT_SLUGS = ["alexendros-me", "nasve", "pipeline-crm", "stripe-catalog", "mcp-toolkit"];

/**
 * Visual snapshot regression test.
 *
 * Captures the hero element of each project page in both light and dark mode,
 * comparing against stored baselines to detect unintended visual changes
 * from token/color/image migrations.
 *
 * NOTE: dark mode is class-based (.dark on <html>), not media-query-based.
 * We use addInitScript + emulateMedia to ensure both the class and the
 * @media query are consistent.
 *
 * To update baselines after intentional design changes:
 *   pnpm exec playwright test tests/e2e/visual-snapshot.spec.ts --update-snapshots
 */
test.describe("Project page visual snapshots (light vs dark)", () => {
  for (const slug of PROJECT_SLUGS) {
    test(`/${slug} light mode`, async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("ao-theme", "light");
      });
      await page.emulateMedia({ colorScheme: "light" });
      await page.goto(`/proyectos/${slug}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      const hero = page.locator(".ak-hero-img");
      await expect(hero).toBeVisible();

      await expect(hero).toHaveScreenshot(`${slug}-light.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });

    test(`/${slug} dark mode`, async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("ao-theme", "dark");
        document.documentElement.classList.add("dark");
      });
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(`/proyectos/${slug}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      const hero = page.locator(".ak-hero-img");
      await expect(hero).toBeVisible();

      await expect(hero).toHaveScreenshot(`${slug}-dark.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
