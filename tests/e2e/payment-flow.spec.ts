import { test, expect } from "@playwright/test";

// F18.3 — Pago end-to-end con Stripe test mode.
//
// El test arranca contra el `webServer` de `playwright.config.ts` (puerto 3000).
// Requiere que las env vars de test estén inyectadas antes de `pnpm start`:
//
//   STRIPE_SECRET_KEY=sk_test_...
//   STRIPE_WEBHOOK_SECRET=whsec_...
//
// El flujo verifica:
//   1. GET /servicios → renderiza PurchaseCard
//   2. Click "Pagar ahora" → POST /api/checkout → redirige a checkout.stripe.com
//   3. Rellenar tarjeta 4242 4242 4242 4242 → confirmar
//   4. Vuelve a /checkout/success?session_id=cs_test_...
//   5. La página muestra el session_id y un h1 "¡Pago confirmado!"
//
// Si `STRIPE_SECRET_KEY` no es test, el test se salta (skip) — en live mode la
// tarjeta 4242 sería rechazada.

const STRIPE_TEST_CARD = "4242 4242 4242 4242";

test.describe("F18.3 — flujo de pago end-to-end con Stripe test", () => {
  test.beforeAll(() => {
    test.skip(
      !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"),
      "Requiere STRIPE_SECRET_KEY con prefijo sk_test_",
    );
  });

  test("compra confirmada con tarjeta 4242 y callback al success", async ({ page, context }) => {
    // 1. /servicios muestra el PurchaseCard con "Pagar ahora"
    await page.goto("/servicios");
    const payButton = page.getByRole("button", { name: /Pagar ahora/ }).first();
    await expect(payButton).toBeVisible();

    // 2. Click → /api/checkout → redirige a checkout.stripe.com
    // El `window.location.href = data.url` no es interceptable por Playwright
    // de forma fiable: navegamos manualmente tras la respuesta de red.
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith("/api/checkout") && r.request().method() === "POST",
      ),
      payButton.click(),
    ]);
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { url?: string; method?: string };
    expect(body.url, "POST /api/checkout no devolvió url de Stripe").toBeTruthy();

    // 3. Ir a Stripe (host externo) y rellenar la tarjeta
    await page.goto(body.url!);
    // Stripe Checkout tiene un iframe con el form de tarjeta. Buscamos el
    // campo "Card number" y rellenamos.
    const cardFrame = page.frameLocator("iframe[name^='__privateStripeFrame']").first();
    // Algunos layouts usan iframes múltiples: probamos el primero visible.
    const cardNumber = cardFrame.getByLabel(/card number/i).first();
    await cardNumber.waitFor({ state: "visible", timeout: 15_000 });
    await cardNumber.fill(STRIPE_TEST_CARD);
    await cardFrame.getByLabel(/expir/i).fill("12 / 34");
    await cardFrame.getByLabel(/cvc/i).fill("123");
    await cardFrame
      .getByLabel(/zip|postal/i)
      .fill("00000")
      .catch(() => {
        // El zip puede no aparecer en EUR/España; ignorar.
      });

    // 4. Submit y esperar el callback a /checkout/success
    await Promise.all([
      page.waitForURL(/\/checkout\/success/, { timeout: 30_000 }),
      cardFrame
        .getByRole("button", { name: /pay|pagar/i })
        .first()
        .click(),
    ]);

    // 5. Verificar la página de éxito
    await expect(page.getByRole("heading", { name: /Pago confirmado/i })).toBeVisible();
    const url = new URL(page.url());
    const sessionId = url.searchParams.get("session_id");
    expect(sessionId, "session_id ausente en el callback").toMatch(/^cs_test_/);
    await expect(page.getByText(sessionId!)).toBeVisible();

    // 6. Cierre limpio: la sesión de Playwright no debe tener errores de red
    // por redirecciones a Stripe.
    await context.close();
  });
});
