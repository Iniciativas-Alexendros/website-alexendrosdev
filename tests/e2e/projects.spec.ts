import { test, expect } from "@playwright/test";

test("filtra y busca en la página de proyectos", async ({ page }) => {
  await page.goto("/proyectos");
  await expect(page.getByRole("heading", { name: "Proyectos", level: 1 })).toBeVisible();

  await page.getByLabel("Buscar", { exact: true }).fill("imprenta");
  await expect(page.getByText("1 proyecto", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Nasve/ })).toBeVisible();

  await page.getByLabel("Buscar", { exact: true }).fill("zzzz-no-existe");
  await expect(page.getByText(/Sin resultados/)).toBeVisible();
});

test("filtra proyectos por categoría (select)", async ({ page }) => {
  await page.goto("/proyectos");
  await page.getByLabel("Categoría").selectOption("Web");
  await expect(page.getByText(/\d+ proyectos/, { exact: true })).toBeVisible();
});

test("ordena y navega al detalle de un proyecto", async ({ page }) => {
  await page.goto("/proyectos");
  await page.locator("[class*='ak-masonry-tile']").first().click();
  await expect(page).toHaveURL(/\/proyectos\/[\w-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
