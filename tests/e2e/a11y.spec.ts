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
  "/blog",
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

/**
 * TE-3.3 — Computed Style Locks (lock-in de tokens aplicados en runtime).
 *
 * Asegura que el CSS scale de design tokens se aplica correctamente en el DOM
 * renderizado. Esto detecta regresiones invisibles: si un día se cambia
 * `min-height: 140px → 100px` en _contact.css sin actualizar el lock, el test
 * rompe antes de que un dev/PM note la regresión visual.
 */
test.describe("TE-3.3 · Computed style locks (token application)", () => {
  test("/contacto .ak-container respeta --container-px === 32px en padding-inline (RF8 HC-2 lock)", async ({
    page,
  }) => {
    await page.goto("/contacto");
    await page.waitForLoadState("networkidle");
    // El lock correcto es sobre .ak-container (que usa var(--container-px)),
    // NO sobre input.ak-input (cuyo padding 11px 14px es shorthand intencional
    // en _contact.css · decisión de diseño, no lock de token).
    const container = page.locator(".ak-container").first();
    await expect(container, ".ak-container debe existir en /contacto").toHaveCount(1);
    const padding = await container.evaluate((el) => getComputedStyle(el).paddingInlineStart);
    expect(padding, "padding-inline-start debe resolver a var(--container-px) = 32px").toBe("32px");
  });

  test("/contacto textarea.ak-textarea respeta min-height === 140px", async ({ page }) => {
    await page.goto("/contacto");
    await page.waitForLoadState("networkidle");
    // El textarea vive en step 1 del MultiStepForm. Primero rellenamos
    // step 0 (nombre + email) vía getByPlaceholder (evita honeypot)
    // y avanzamos.
    await page.getByPlaceholder("Tu nombre").fill("Test User");
    await page.locator(".ak-contact-grid input[type=email]").fill("test@example.com");
    await page.getByRole("button", { name: /Siguiente/ }).click();
    await expect(
      page.locator("textarea").first(),
      "textarea debe existir en /contacto step 1",
    ).toBeVisible();
    const textarea = page.locator("textarea").first();
    const minHeight = await textarea.evaluate((el) => getComputedStyle(el).minHeight);
    expect(minHeight, "min-height debe ser literal 140px (cierre DUP ak-textarea Opción A)").toBe(
      "140px",
    );
  });

  test("/proyectos tile-metric b NO usa color #fff hardcoded, usa token hsl(...) (HC-1 lock)", async ({
    page,
  }) => {
    await page.goto("/proyectos");
    await page.waitForLoadState("networkidle");
    // ProjectsList renderiza .ak-tile-metric b (no .ak-tile-stat que se usaba
    // en la versión anterior con overlay). Ver https://github.com/Iniciativas-Alexendros/website-alexendrosdev/pull/126
    const metric = page.locator(".ak-tile-metric b").first();
    await expect(
      metric,
      "/proyectos debe tener al menos 1 .ak-tile-metric b visible",
    ).toBeVisible();
    const color = await metric.evaluate((el) => getComputedStyle(el).color);
    // El color debe resolver a un hsl(...) — #fff hex es PROHIBIDO post-HC-1.
    expect(color, "ak-tile-metric b debe usar token, no #fff").not.toBe("rgb(255, 255, 255)");
    expect(color, "ak-tile-metric b debe usar HSL function (token system)").toMatch(/^hsl\(/);
  });
});
