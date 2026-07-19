import { test, expect } from "@playwright/test";

test("el pago redirige a contacto sin claves de Stripe", async ({ page }) => {
  await page.goto("/servicios");
  await page
    .getByRole("button", { name: /Empezar este plan|Elegir este plan/ })
    .first()
    .click();
  await expect(page).toHaveURL("/contacto");
});
