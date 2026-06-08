import "server-only";
import Stripe from "stripe";

// Cliente Stripe instanciado solo si hay STRIPE_SECRET_KEY; null en caso
// contrario. Mismo patrón de degradación null-safe que `prisma`/`resend`:
// los route handlers comprueban `if (stripe)` antes de usarlo.
const apiKey = process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = apiKey ? new Stripe(apiKey) : null;

// Secreto de firma del webhook (Stripe CLI / Dashboard). Sin él no se verifican
// los eventos entrantes y el handler degrada.
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// URL base absoluta para las success/cancel URLs de Checkout. Se prefiere el
// origin de la petición; este valor es el fallback en entornos sin cabecera.
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://alexendros.pro";
