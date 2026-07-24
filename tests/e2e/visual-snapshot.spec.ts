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
/**
 * TE-3.2 — Static section visual snapshots (lock-in pixel-level).
 *
 * Snapshotea secciones específicas estables en rutas principales, light + dark.
 * A diferencia de los heroes de proyecto (dinámicos por slug), estos elementos
 * son la columna vertebral del layout y deben ser inmunes a refactors visuales.
 *
 * Decisión de scope: element-level captures (no fullPage) para minimizar
 * flakiness. maxDiffPixelRatio: 0.02 permite tolerancia a subpixel rendering.
 *
 * Baseline generation:
 *   pnpm exec playwright test tests/e2e/visual-snapshot.spec.ts --update-snapshots
 */
const STATIC_SNAPS = [
  { path: "/contacto", locator: ".ak-form-card", name: "contacto-form-card" },
  { path: "/proyectos", locator: ".ak-masonry", name: "proyectos-masonry" },
  { path: "/blog", locator: ".ak-bloglist", name: "blog-list" },
];

test.describe("TE-3.2 · Static sections visual snapshots (light vs dark)", () => {
  for (const { path, locator, name } of STATIC_SNAPS) {
    for (const theme of ["light", "dark"] as const) {
      test(`${path} → ${locator} en ${theme}`, async ({ page }) => {
        await page.addInitScript((t) => {
          localStorage.setItem("ao-theme", t);
          if (t === "dark") document.documentElement.classList.add("dark");
        }, theme);
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(path, { waitUntil: "networkidle" });
        // Mitigar layout shifts tras carga diferida (skeletons → contenido).
        await page.waitForTimeout(500);

        const section = page.locator(locator).first();
        await expect(section, `${path} → ${locator} debe estar visible`).toBeVisible();

        await expect(section).toHaveScreenshot(`${name}-${theme}.png`, {
          maxDiffPixelRatio: 0.02,
        });
      });
    }
  }
});

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
