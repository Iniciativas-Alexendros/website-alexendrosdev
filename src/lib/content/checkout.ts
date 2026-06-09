import type { PurchasableItem } from "./types";

// Catálogo de items comprables (one-time) vía Stripe Checkout. Los importes
// viven aquí, en el servidor: el route handler nunca confía en un precio
// enviado por el cliente — solo recibe el `id` y resuelve el resto aquí.
// Importes en céntimos de euro. Se corresponden con los `ADDONS` de servicios.
// Precios base orientativos. TODO: verificar antes de cobrar.
export const PURCHASABLES: PurchasableItem[] = [
  {
    id: "auditoria-seguridad",
    name: "Auditoría de seguridad",
    desc: "Verificación check-only (XEK) de repo, app o host: SAST/SCA/DAST, IaC y compliance. Informe priorizado con propuesta.",
    amount: 150_000,
    currency: "eur",
  },
  {
    id: "sesion-mentoria",
    name: "Sesión de mentoría (1 h)",
    desc: "Acompañamiento técnico en seguridad, MCP/Claude Code, Rust o arquitectura web.",
    amount: 9_000,
    currency: "eur",
  },
  {
    id: "sprint-hardening",
    name: "Sprint de hardening",
    desc: "1-2 semanas asegurando secretos, mTLS, observabilidad y CI: de configuración frágil a sistema auditable.",
    amount: 250_000,
    currency: "eur",
  },
];

const BY_ID = new Map(PURCHASABLES.map((p) => [p.id, p]));

/** Resuelve un item comprable por id, o `null` si no existe en el catálogo. */
export function getPurchasable(id: string): PurchasableItem | null {
  return BY_ID.get(id) ?? null;
}

/** Formatea un importe en céntimos como precio legible (p. ej. «1.500 €»). */
export function formatPrice(amount: number, currency = "eur"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
