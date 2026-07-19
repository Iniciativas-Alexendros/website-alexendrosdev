import { test } from "@playwright/test";

// F18.3 — Pago end-to-end con Stripe test mode.
//
// Requiere STRIPE_SECRET_KEY=sk_test_... y STRIPE_WEBHOOK_SECRET.
// El flujo original iba a /escaparate → ahora PurchaseCard está dentro de
// /servicios y redirige al formulario de contacto en lugar de Stripe
// (la pasarela de pago directa se eliminó con Escaparate).
// Mientras tanto, el test se salta (skip) hasta que se decida reactivar
// una pasarela de checkout integrada.

test.describe("F18.3 — flujo de pago end-to-end con Stripe test", () => {
  test("compra confirmada con tarjeta 4242 y callback al success", async () => {
    test.skip(true, "Pasarela de pago directa eliminada. Ver /servicios → /contacto.");
  });
});
