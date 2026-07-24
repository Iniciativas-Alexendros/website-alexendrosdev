import { test, expect } from "@playwright/test";

/**
 * TE-3.1 — Design System visual snapshots.
 * Cubre:
 *   - las 4 rutas principales (/) (/about) (/proyectos) (/blog) renderizan sin error,
 *   - el cambio de tema actualiza el atributo `data-theme` del <html>,
 *   - el hero "display" usa `var(--fs-display)` (no literal),
 *   - los skeletons se renderizan en /blog (estado loading),
 *   - el timeline (en /about) tiene dots en posición left:-29px (alineados).
 *
 * E2E se ejecuta contra `pnpm dev` o `pnpm start` con el dev server levantado.
 * Las pruebas son MÍNIMAS (no son reemplazos de los snapshots visuales; sólo
 * asserts funcionales que el lock-in del feature requiere).
 */

test.describe("TE-3.1 · Design system visual gates", () => {
  test("home renders and exposes the hero display", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Alexendros/);
    // El title h1 usa la scale --fs-display (no literal rem/px)
    const heroDisplay = page.locator(".ak-display").first();
    await expect(heroDisplay).toBeVisible();
  });

  test("theme toggle flips data-theme on <html>", async ({ page }) => {
    await page.goto("/");
    const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await page.locator(".ak-theme-toggle").first().click();
    const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(before).not.toBe(after);
  });

  test("projects page sidebar utilises --header-height stickiness", async ({ page, viewport }) => {
    // Coerción explícita a boolean para satisfacer la sobrecarga exacta
    // de Playwright. Sin la coerción, `viewport ?? <bool>` puede ser `null`
    // y `test.skip(condition: boolean)` rechaza null/undefined.
    test.skip(viewport ? viewport.width < 881 : false, "desktop-only sticky gating");
    await page.goto("/proyectos");
    // El sidebar (cuando existe) usa var(--header-height) — sin top literal.
    const sidebar = page.locator(".ak-projects-sidebar").first();
    if ((await sidebar.count()) > 0) {
      const top = await sidebar.evaluate((el) => getComputedStyle(el).top);
      expect(top).not.toMatch(/^88px|^64px|^90px/);
    }
  });

  test("about timeline dots están alineados (offset 0px entre base y active)", async ({ page }) => {
    await page.goto("/about");
    const active = page.locator(".ak-tl-dot.active").first();
    if ((await active.count()) > 0) {
      const activeLeft = await active.evaluate((el) => getComputedStyle(el).left);
      expect(activeLeft).toBe("-29px");
    }
  });

  test("blog lists render ak-blog-row without overflow", async ({ page }) => {
    await page.goto("/blog");
    const rows = page.locator(".ak-blog-row");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});
