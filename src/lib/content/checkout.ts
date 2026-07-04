import type { PurchasableItem } from './types'

// Catálogo de items comprables (one-time) vía Stripe Checkout. Los importes
// viven aquí, en el servidor: el route handler nunca confía en un precio
// enviado por el cliente — solo recibe el `id` y resuelve el resto aquí.
// Importes en céntimos de euro. Se corresponden con los `ADDONS` de servicios.
export const PURCHASABLES: PurchasableItem[] = [
  {
    id: 'puesta-a-punto-web',
    name: 'Puesta a punto de tu web',
    desc: 'Reviso tu web actual (velocidad, posicionamiento en Google y errores) y te entrego un informe claro con las mejoras priorizadas.',
    amount: 39_000,
    currency: 'eur',
  },
  {
    id: 'sesion-consultoria',
    name: 'Sesión de consultoría (1 h)',
    desc: 'Hablamos de tu proyecto y te ayudo a decidir cómo abordar tu web, tu aplicación o una automatización. Sin compromiso.',
    amount: 6_000,
    currency: 'eur',
  },
  {
    id: 'revision-seguridad',
    name: 'Revisión de seguridad',
    desc: 'Reviso tu web o tu sistema y te explico, en cristiano, qué conviene mejorar para estar tranquilo. Solo reviso: no toco nada sin tu visto bueno.',
    amount: 60_000,
    currency: 'eur',
  },
]

const BY_ID = new Map(PURCHASABLES.map((p) => [p.id, p]))

/** Resuelve un item comprable por id, o `null` si no existe en el catálogo. */
export function getPurchasable(id: string): PurchasableItem | null {
  return BY_ID.get(id) ?? null
}

/** Formatea un importe en céntimos como precio legible (p. ej. «1.500 €»). */
export function formatPrice(amount: number, currency = 'eur'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}
