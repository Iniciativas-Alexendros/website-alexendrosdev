import { test, expect } from "@playwright/test";

test("navega del listado del blog a un post", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.locator("a[href^='/blog/']").first().click();
  await expect(page).toHaveURL(/\/blog\/.+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("filtra el blog por tag y muestra el estado vacío", async ({ page }) => {
  await page.goto("/blog");
  await page.getByLabel("Buscar artículos").fill("zzzz-no-existe");
  await expect(page.getByText(/Sin artículos para los filtros actuales/)).toBeVisible();
});
