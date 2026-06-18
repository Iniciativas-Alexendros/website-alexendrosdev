import { test, expect } from "@playwright/test";

test.describe("/stack", () => {
  test("renderiza el grafo y el detalle inicial (Rust)", async ({ page }) => {
    await page.goto("/stack");
    await expect(page.getByText(/arrastra · scroll para zoom/)).toBeVisible();
    await expect(page.locator(".ak-detail-h")).toContainText("Rust");
  });

  test("seleccionar una categoría en la leyenda actualiza el panel de detalle", async ({
    page,
  }) => {
    await page.goto("/stack");
    // La leyenda vive en el panel lateral (evita colisión con el nodo del grafo).
    await page.locator(".ak-stack-side").getByRole("button", { name: /Web/ }).first().click();
    await expect(page.locator(".ak-detail-h")).toContainText("Web");
  });

  test("el zoom modifica la escala del grafo", async ({ page }) => {
    await page.goto("/stack");
    const inner = page.locator(".ak-graph-inner");
    const before = (await inner.getAttribute("style")) ?? "";
    await page.getByRole("button", { name: "Acercar" }).click();
    await expect(inner).not.toHaveAttribute("style", before);
  });
});
