import { test, expect } from "@playwright/test";

test("el pago degrada a un mensaje de fallback sin claves de Stripe", async ({ page }) => {
  await page.goto("/servicios");
  await page
    .getByRole("button", { name: /Pedir presupuesto/ })
    .first()
    .click();
  await expect(page).toHaveURL("/contacto");
});
