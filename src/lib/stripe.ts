import "server-only";
import Stripe from "stripe";

// Cliente Stripe instanciado solo si hay STRIPE_SECRET_KEY; null en caso
// contrario. Mismo patrón de degradación null-safe que `prisma`/`resend`:
// los route handlers comprueban `if (stripe)` antes de usarlo.
const apiKey = process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = apiKey
  ? new Stripe(apiKey, {
      maxNetworkRetries: 2,
      timeout: 10_000,
    })
  : null;
export const isLiveMode = apiKey?.startsWith("sk_live_") ?? false;

// Secreto de firma del webhook (Stripe CLI / Dashboard). Sin él no se verifican
// los eventos entrantes y el handler degrada.
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// URL base absoluta para las success/cancel URLs de Checkout. Se prefiere el
// origin de la petición; este valor es el fallback en entornos sin cabecera.
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://alexendros.dev";

// ─── F13 — Canal secundario: datos de transferencia bancaria ──────────────
// Si `TRANSFER_IBAN` está configurado, el endpoint /api/checkout puede
// derivar a este canal cuando Stripe falla o cuando el cliente lo pide
// explícitamente (`paymentMethod: "transfer"`).
export const TRANSFER_IBAN = process.env.TRANSFER_IBAN ?? "";
export const TRANSFER_BENEFICIARY = process.env.TRANSFER_BENEFICIARY ?? "";
export const TRANSFER_BANK = process.env.TRANSFER_BANK ?? "";

export function hasTransferConfig(): boolean {
  return Boolean(TRANSFER_IBAN && TRANSFER_BENEFICIARY);
}
