import type { PurchasableItem } from './types'
import { getCatalogItem, getCatalogItemsByCategory } from './catalog'

// Catálogo de items comprables vía Stripe Checkout. Los importes viven en el
// catálogo unificado (`catalog.ts`) — fuente de verdad del servidor. Este
// módulo se mantiene por compatibilidad hacia atrás: los componentes que
// importan `PURCHASABLES` o `getPurchasable` siguen funcionando sin cambios.
//
// Importes en céntimos de euro. Precios verificados (sin TODOs).

/** @deprecated usar `getCatalogItem` desde `@/lib/content/catalog`. */
export function getPurchasable(id: string): PurchasableItem | null {
  const item = getCatalogItem(id)
  if (!item) return null
  return {
    id: item.id,
    name: item.name,
    desc: item.desc,
    amount: item.amount,
    currency: item.currency,
  }
}

/**
 * ID canónico del purchasable por defecto cuando /checkout se invoca sin
 * query string `?item=<id>`. Source-of-truth vive aquí — no acoplar la ruta
 * al id interno del catálogo copiando el string en cada callsite.
 */
export const DEFAULT_PURCHASABLE_ID = 'puesta-a-punto-web';

/**
 * Resuelve el purchasable por defecto (single source-of-truth). Devuelve
 * `null` si el catálogo no tiene el seed canónico — eso indica un
 * regression en los datos, no UX decision, debe romper el build.
 */
export function getDefaultPurchasable(): PurchasableItem | null {
  return getPurchasable(DEFAULT_PURCHASABLE_ID);
}

/** @deprecated usar `getCatalogItemsByCategory` desde `@/lib/content/catalog`. */
export const PURCHASABLES: PurchasableItem[] = [
  ...getCatalogItemsByCategory('addon'),
  ...getCatalogItemsByCategory('consultoria'),
].map((item) => ({
  id: item.id,
  name: item.name,
  desc: item.desc,
  amount: item.amount,
  currency: item.currency,
}))

/** Formatea un importe en céntimos como precio legible (p. ej. «1.500 €»). */
export function formatPrice(amount: number, currency = 'eur'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}
