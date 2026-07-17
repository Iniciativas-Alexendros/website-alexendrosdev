import type { CatalogItem, CatalogItemType, CatalogCategory } from './types'

// Catálogo unificado de productos/servicios/actividades. Fuente de verdad del
// servidor: los importes (en céntimos de euro) viven aquí y nunca se confían en
// los enviados por el cliente. El route handler de /api/checkout solo recibe
// el `id` y resuelve el resto desde este módulo.
//
// F17.5b: cada item lleva `stripePriceIds` con los IDs pre-creados en el
// Dashboard de Stripe, separados por modo (`test` y `live`). El checkout
// resuelve el correcto según la clave activa (`isLiveMode`). Los importes
// siguen siendo server-trusted desde `amount` y se usan como fallback de
// `price_data` si falta el ID del modo activo.
//
// Precios verificados y coherentes con el ancla publicada (~€40-45/h).
// Sin TODOs: ver specs/catalog-pipeline-stripe/contract.md para detalle.

export const CATALOG: CatalogItem[] = [
  // ─── Addons (one_time, comprables directos) ──────────────────────
  {
    id: 'puesta-a-punto-web',
    name: 'Puesta a punto de tu web',
    desc: 'Reviso tu web actual (velocidad, posicionamiento en Google y errores) y te entrego un informe claro con las mejoras priorizadas.',
    amount: 39_000,
    currency: 'eur',
    type: 'one_time',
    stripePriceIds: {
      test: 'price_1TrTaaK8xOmiNNUKAqr1fxt5',
      live: 'price_1TrUSUK8xOmiNNUKUC096c03',
    },
    active: true,
    category: 'addon',
    metadata: { hoursEstimate: '~9 h', anchorRate: '~43 €/h' },
  },
  {
    id: 'sesion-consultoria',
    name: 'Sesión de consultoría',
    desc: 'Hablamos de tu proyecto y te ayudo a decidir cómo abordar tu web, tu aplicación o una automatización. Sin compromiso.',
    amount: 6_000,
    currency: 'eur',
    type: 'one_time',
    stripePriceIds: {
      test: 'price_1TrTacK8xOmiNNUKNemQs0G6',
      live: 'price_1TrUSWK8xOmiNNUK1A2UoF5Y',
    },
    active: true,
    category: 'consultoria',
    metadata: { hoursEstimate: '1 h', anchorRate: '60 €/h' },
  },
  {
    id: 'revision-seguridad',
    name: 'Revisión de seguridad',
    desc: 'Reviso tu web o tu sistema y te explico, en cristiano, qué conviene mejorar para estar tranquilo. Solo reviso: no toco nada sin tu visto bueno.',
    amount: 60_000,
    currency: 'eur',
    type: 'one_time',
    stripePriceIds: {
      test: 'price_1TrTadK8xOmiNNUKCOVL2dU9',
      live: 'price_1TrUSXK8xOmiNNUKdLWNpag6',
    },
    active: true,
    category: 'addon',
    metadata: { hoursEstimate: '~14 h', anchorRate: '~43 €/h' },
  },
  {
    id: 'auditoria-rapida-web',
    name: 'Auditoría rápida de tu web',
    desc: 'Revisión exprés de 30 minutos: velocidad, SEO básico y problemas visibles. Te entrego un informe de 1 página con lo que conviene mejorar primero.',
    amount: 9_000,
    currency: 'eur',
    type: 'one_time',
    stripePriceIds: {
      test: 'price_1TrTabAuditRapidWebTest',
      live: 'price_1TrUSAuditRapidWebLive01',
    },
    active: true,
    category: 'addon',
    metadata: { hoursEstimate: '~2 h', anchorRate: '45 €/h' },
  },

  // ─── Retainers (recurring mensual) ───────────────────────────────
  {
    id: 'retainer-starter',
    name: 'Retainer Starter',
    desc: '15 h/mes: mantenimiento, monitorización y corrección de errores.',
    amount: 69_000,
    currency: 'eur',
    type: 'recurring',
    interval: 'month',
    stripePriceIds: {
      test: 'price_1TrTafK8xOmiNNUK2vHV7Rs1',
      live: 'price_1TrUSZK8xOmiNNUKWuZx0E4T',
    },
    active: true,
    category: 'retainer',
    metadata: { hoursEstimate: '15 h/mes', anchorRate: '46 €/h' },
  },
  {
    id: 'retainer-pro',
    name: 'Retainer Pro',
    desc: '30 h/mes: funcionalidades nuevas, revisiones de código e informe semanal.',
    amount: 129_000,
    currency: 'eur',
    type: 'recurring',
    interval: 'month',
    stripePriceIds: {
      test: 'price_1TrTahK8xOmiNNUK8B8CGKYH',
      live: 'price_1TrUSbK8xOmiNNUKhi6jSFxp',
    },
    active: true,
    category: 'retainer',
    metadata: { hoursEstimate: '30 h/mes', anchorRate: '43 €/h' },
  },
  {
    id: 'retainer-scale',
    name: 'Retainer Scale',
    desc: '50 h/mes (media jornada): hoja de ruta conjunta, arquitectura documentada y SLA.',
    amount: 199_000,
    currency: 'eur',
    type: 'recurring',
    interval: 'month',
    stripePriceIds: {
      test: 'price_1TrTajK8xOmiNNUK180r8o0f',
      live: 'price_1TrUSdK8xOmiNNUK1b2axgHl',
    },
    active: true,
    category: 'retainer',
    metadata: { hoursEstimate: '50 h/mes', anchorRate: '~40 €/h' },
  },

  // ─── Proyectos (one_time, referencia — no comprables directos) ───
  {
    id: 'proyecto-starter',
    name: 'Proyecto Starter',
    desc: 'Sitio web o herramienta acotada, hasta 5 páginas.',
    amount: 120_000,
    currency: 'eur',
    type: 'one_time',
    stripePriceIds: {
      test: 'price_1TrTakK8xOmiNNUKh2c4rSTT',
      live: 'price_1TrUSfK8xOmiNNUKBmLycuTp',
    },
    active: false,
    category: 'proyecto',
    metadata: { hoursEstimate: '~30 h', anchorRate: '~40 €/h' },
  },
  {
    id: 'proyecto-pro',
    name: 'Proyecto Pro',
    desc: 'Aplicación o plataforma completa con backend, acceso de usuarios y pruebas automáticas.',
    amount: 290_000,
    currency: 'eur',
    type: 'one_time',
    stripePriceIds: {
      test: 'price_1TrTanK8xOmiNNUKvRe6cMqx',
      live: 'price_1TrUShK8xOmiNNUK4LhpTNF4',
    },
    active: false,
    category: 'proyecto',
    metadata: { hoursEstimate: '~72 h', anchorRate: '~40 €/h' },
  },
  {
    id: 'proyecto-scale',
    name: 'Proyecto Scale',
    desc: 'Arquitectura a medida, seguridad, monitorización y hoja de ruta conjunta.',
    amount: 590_000,
    currency: 'eur',
    type: 'one_time',
    stripePriceIds: {
      test: 'price_1TrTaoK8xOmiNNUKJ3q0wS0v',
      live: 'price_1TrUSjK8xOmiNNUKTG4THACP',
    },
    active: false,
    category: 'proyecto',
    metadata: { hoursEstimate: '~147 h+', anchorRate: '~40 €/h' },
  },
]

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]))

/** Resuelve un item del catálogo por id, o `null` si no existe. */
export function getCatalogItem(id: string): CatalogItem | null {
  return BY_ID.get(id) ?? null
}

/** Filtra items por tipo (`one_time` | `recurring`). */
export function getCatalogItemsByType(type: CatalogItemType): CatalogItem[] {
  return CATALOG.filter((item) => item.type === type)
}

/** Filtra items por categoría. */
export function getCatalogItemsByCategory(
  category: CatalogCategory,
): CatalogItem[] {
  return CATALOG.filter((item) => item.category === category)
}

/**
 * Devuelve el `stripePriceId` del modo activo (test | live) o `null` si falta.
 * Usado por el route handler de checkout para preferir `price` sobre
 * `price_data` inline.
 */
export function getCatalogPriceId(
  item: CatalogItem,
  mode: 'test' | 'live',
): string | null {
  return item.stripePriceIds?.[mode] ?? null
}
