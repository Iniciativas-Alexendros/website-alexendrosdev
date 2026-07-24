import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PurchaseCard } from "@/components/sections/checkout/PurchaseCard";
import { PURCHASABLES, getPurchasable, getDefaultPurchasable } from "@/lib/content/checkout";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Resumen y pago del servicio elegido. Tarjeta vía Stripe o transferencia bancaria con IBAN.",
  robots: { index: false },
};

/**
 * /checkout — vista standalone de una `PurchaseCard` que muestra el item
 * solicitado por `?item=<id>` (deep-link desde emails). Sin parámetro,
 * cae al default desde `@/lib/content/checkout`.
 *
 * Decisión de errores (jerárquica):
 *   1. `PURCHASABLES.length === 0` → throw al render  (datos rotos: deploy fail).
 *   2. `?item=invalid`               → `notFound()`    (404, UX idiomática — input de usuario).
 *   3. Default missing tras guard     → throw al render (data regression — invariante rota).
 *
 * Contrato e2e (TE-1.2 / TE-1.2b / axe):
 *   - GET /checkout → DOM con `role="radio"` nombrado "Transferencia".
 *   - Click en Transferencia → input Email visible con border-color
 *     resoluble desde `hsl(var(--border))` (no rgb literal residual).
 *   - axe-core 0 critical/serious.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const params = await searchParams;

  // Guard 1 — PURCHASABLES vacío. Rotura de datos, no decisión de UX.
  if (PURCHASABLES.length === 0) {
    throw new Error("PURCHASABLES vacío — checkout no puede renderizar");
  }

  let chosen;
  if (params.item) {
    chosen = getPurchasable(params.item);
    if (!chosen) {
      // El usuario pasó un id explícito pero no existe — 404 idiomático.
      notFound();
    }
  } else {
    chosen = getDefaultPurchasable();
    if (!chosen) {
      // Default missing tras guard de longitud OK → invariante rota.
      throw new Error(
        "checkout: default purchasable missing — verifica DEFAULT_PURCHASABLE_ID en @/lib/content/checkout vs entradas reales en CATALOG",
      );
    }
  }

  return (
    <div className="ak-container">
      <section className="ak-section">
        <header className="ak-section-head ak-center ak-stack-2">
          <p className="ak-eyebrow">Checkout</p>
          <h1 className="ak-h1">Confirma tu servicio</h1>
          <p className="ak-section-sub">
            Elige método de pago y empieza en menos de 2 minutos. Si prefieres transferencia
            bancaria, te paso los datos al confirmar.
          </p>
        </header>

        <div className="ak-checkout-tile">
          <PurchaseCard item={chosen} />
        </div>
      </section>
    </div>
  );
}
