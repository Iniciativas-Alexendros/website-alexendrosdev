import type { CatalogItem, CatalogItemType, CatalogCategory } from './types'

// Catálogo unificado de productos/servicios/actividades. Fuente de verdad del
// servidor: los importes (en céntimos de euro) viven aquí y nunca se confían en
// los enviados por el cliente. El route handler de /api/checkout solo recibe
// el `id` y resuelve el resto desde este módulo.
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
    active: true,
    category: 'addon',
    metadata: { hoursEstimate: '~9 h', anchorRate: '~43 €/h' },
  },
  {
    id: 'sesion-consultoria',
    name: 'Sesión de consultoría (1 h)',
    desc: 'Hablamos de tu proyecto y te ayudo a decidir cómo abordar tu web, tu aplicación o una automatización. Sin compromiso.',
    amount: 6_000,
    currency: 'eur',
    type: 'one_time',
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
    active: true,
    category: 'addon',
    metadata: { hoursEstimate: '~14 h', anchorRate: '~43 €/h' },
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
    active: true,
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
    active: true,
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
    active: true,
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
