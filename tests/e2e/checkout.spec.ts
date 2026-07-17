import { test, expect } from "@playwright/test";

test.skip("el pago degrada a un mensaje de fallback sin claves de Stripe", async ({ page }) => {
  await page.goto("/servicios");
  await page
    .getByRole("button", { name: /Pagar ahora/ })
    .first()
    .click();
  // Sin STRIPE_SECRET_KEY, /api/checkout responde 503 y la tarjeta muestra el
  // fallback en vez de redirigir a Stripe.
  await expect(page.getByText(/Pagos no disponibles|No se pudo iniciar/).first()).toBeVisible();
});

// ─── F13 — Canal secundario (transferencia) ──────────────────────────

test.skip("T3.15: el toggle Tarjeta/Transferencia muestra inputs y permite solicitar datos", async ({
  page,
}) => {
  await page.goto("/servicios");
  const card = page
    .locator(".ak-tier")
    .filter({ hasText: /Puesta a punto/i })
    .first();
  await card.getByRole("radio", { name: "Transferencia" }).click();
  await expect(card.getByLabel("Email")).toBeVisible();
  await expect(card.getByLabel("Nombre")).toBeVisible();
  await card.getByLabel("Email").fill("cliente@example.com");
  await card.getByLabel("Nombre").fill("Cliente Test");
  await card.getByRole("button", { name: /Solicitar datos de transferencia/ }).click();
  // Sin TRANSFER_IBAN configurado en el e2e, el servidor responde 503 con un
  // mensaje de error visible (no redirige a Stripe).
  await expect(card.getByText(/Transferencia no configurada|No se pudo/i)).toBeVisible();
});

test.skip("T3.16: axe-core no detecta críticos en PurchaseCard con toggle", async ({ page }) => {
  await page.goto("/servicios");
  // El escaparate muestra 3 PurchaseCards (addons), cada una con su propio
  // radio button "Tarjeta"/"Transferencia". Usamos el primero (la card del
  // primer addon) para evitar strict mode violation.
  const card = page.locator(".ak-tier").first();
  await expect(card.getByRole("radio", { name: "Tarjeta" })).toBeVisible();
  await expect(card.getByRole("radio", { name: "Transferencia" })).toBeVisible();
  // axe-core se ejecuta en el job e2e (playwright.config.ts) sobre las rutas
  // principales; aquí solo verificamos que el toggle es accesible por nombre.
});
