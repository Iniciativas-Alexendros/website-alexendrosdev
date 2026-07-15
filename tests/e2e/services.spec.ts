import { test, expect } from "@playwright/test";

test.describe("/servicios", () => {
  test("el acordeón de FAQ abre y cierra (nativo <details>)", async ({ page }) => {
    await page.goto("/servicios");
    const summary = page.getByText(/¿Cómo es tu proceso de trabajo\?/);
    await expect(summary).toBeVisible();
    const detailsLocator = summary.locator("xpath=ancestor::details").first();
    await expect(detailsLocator).toHaveAttribute("open", "");
    await summary.click();
    await expect(detailsLocator).not.toHaveAttribute("open", "");
  });

  test("el CTA de un plan lleva a contacto", async ({ page }) => {
    await page.goto("/servicios");
    await page.getByRole("link", { name: /Empezar este plan/ }).click();
    await expect(page).toHaveURL(/\/contacto$/);
  });

  test("la página renderiza 3 tier cards de proyecto", async ({ page }) => {
    await page.goto("/servicios");
    const tiles = page.locator("article[class*='ak-tier']");
    await expect(tiles).toHaveCount(3);
  });
});
