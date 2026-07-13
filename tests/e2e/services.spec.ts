import { test, expect } from "@playwright/test";

test.describe("/servicios", () => {
  test("alterna el modo de precios (proyecto ↔ retainer)", async ({ page }) => {
    await page.goto("/servicios");
    const proyecto = page.getByRole("tab", { name: "Por proyecto" });
    const retainer = page.getByRole("tab", { name: "Retainer mensual" });

    await expect(proyecto).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("€1.200").first()).toBeVisible(); // Starter por proyecto

    await retainer.click();
    await expect(retainer).toHaveAttribute("aria-selected", "true");
    await expect(proyecto).toHaveAttribute("aria-selected", "false");
    await expect(page.getByText("€690").first()).toBeVisible(); // Starter retainer
  });

  test("el acordeón de FAQ abre y cierra", async ({ page }) => {
    await page.goto("/servicios");
    const q = page.getByRole("button", { name: /¿Cómo es tu proceso de trabajo\?/ });
    // El primer ítem arranca abierto (open = 0).
    await expect(q).toHaveAttribute("aria-expanded", "true");
    await q.click();
    await expect(q).toHaveAttribute("aria-expanded", "false");
  });

  test("el CTA de un plan lleva a contacto", async ({ page }) => {
    await page.goto("/servicios");
    // El CTA "Empezar" solo aparece en modo retainer (en modo proyecto es "Pedir
    // presupuesto"). Forzamos retainer para que el test sea estable.
    await page.getByRole("tab", { name: "Retainer mensual" }).click();
    await page.getByRole("link", { name: "Empezar" }).first().click();
    await expect(page).toHaveURL(/\/contacto$/);
  });
});
