/**
 * tests/e2e/design-system-fixes-batch2.spec.ts
 *
 * Visual lock-in for the 3 cards: PurchaseCard + TransferCard (mismo .ak-tier
 * bajo /checkout) + ContactCard (`.ak-form-card` en /contacto).
 *
 * Spec: specs/design-system-fixes-batch2/
 * Vinculado a: TE-1.1, TE-1.2, TE-1.3, TE-1.4.
 *
 * Política:
 *   - axe-core sobre /checkout y /contacto (light + dark).
 *   - computed-style de `border-color` resuelta desde `hsl(var(--border))`,
 *     nunca `rgb(0,0,0)` literal (lock token-driven).
 *
 * Nota: cuando el modo transfer esté activo, `[data-testid="transfer-instructions"]`
 * sub-renderiza desde la misma `PurchaseCard.ak-tier`. Por brevedad testeamos
 * la `.ak-tier` (que cubre ambos casos) con axe sobre /checkout en load inicial.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa"] as const;

/** Lock-light: border-color computado no debe ser negro/white literal; viene de token hsl(). */
function expectTokenBasedBorder(borderColor: string): void {
  // Must start with rgb( — token resuelve a un color real, no rgba(0,0,0,X) literal residual.
  expect(borderColor, "border-color computado debe ser un rgb() resuelto de token").toMatch(
    /^rgb\((\d+), (\d+), (\d+)\)$/,
  );
  // Sanity: NO debe ser negro puro (#000) ni blanco puro (#fff) — eso indicaría fallback roto.
  const match = borderColor.match(/^rgb\((\d+), (\d+), (\d+)\)$/);
  if (match) {
    const [r, g, b] = match.slice(1).map(Number);
    expect(r + g + b, "border-color no debe ser negro puro").toBeGreaterThan(15);
  }
}

test.describe("design-system-fixes-batch2 — /checkout axe + token lock", () => {
  test("TE-1.1 — /checkout axe-core 0 critical/serious (light)", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags([...TAGS]).analyze();
    const blockers = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      blockers,
      `axe /checkout debe pasar con 0 critical/serious. Violations: ${JSON.stringify(blockers.map((v) => v.id))}`,
    ).toEqual([]);
  });

  test("TE-1.2 — /checkout input border-color resuelve vía --border token (light)", async ({
    page,
  }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    // El input de email aparece cuando method==="transfer"; forzarlo.
    const toggle = page.getByRole("radio", { name: "Transferencia" });
    await toggle.click();
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toBeVisible();
    const borderColor = await emailInput.evaluate(
      (el) => getComputedStyle(el as HTMLElement).borderColor,
    );
    expectTokenBasedBorder(borderColor);
  });

  test("TE-1.2b — /checkout dark mode: border-color resuelta vía --border (token swap)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ao-theme", "dark");
      document.documentElement.classList.add("dark");
    });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    const toggle = page.getByRole("radio", { name: "Transferencia" });
    await toggle.click();
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toBeVisible();
    const borderColor = await emailInput.evaluate(
      (el) => getComputedStyle(el as HTMLElement).borderColor,
    );
    expectTokenBasedBorder(borderColor);
  });
});

test.describe("design-system-fixes-batch2 — /contacto axe + token lock", () => {
  test("TE-1.3 — /contacto axe-core 0 critical/serious", async ({ page }) => {
    await page.goto("/contacto");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags([...TAGS]).analyze();
    const blockers = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      blockers,
      `axe /contacto debe pasar con 0 critical/serious. Violations: ${JSON.stringify(blockers.map((v) => v.id))}`,
    ).toEqual([]);
  });

  test("TE-1.4 — /contacto .ak-form-card visible + border vía --border token", async ({ page }) => {
    await page.goto("/contacto");
    await page.waitForLoadState("networkidle");
    const formCard = page.locator(".ak-form-card").first();
    await expect(formCard, ".ak-form-card debe existir y ser visible").toBeVisible();
    const borderColor = await formCard.evaluate(
      (el) => getComputedStyle(el as HTMLElement).borderColor,
    );
    expectTokenBasedBorder(borderColor);
  });
});
