// Tipos del contenido del portfolio (Arctic Ocean).

export interface Metric {
  v: string
  l: string
  acc?: boolean
}

export interface Project {
  id: string
  title: string
  category: string
  kind: 'Web App' | 'Plataforma' | 'Infra' | 'API' | 'Open Source'
  year: string
  h: number // alto relativo para el masonry
  featured?: boolean
  image?: string // captura en /public (ratio 4:3); sin ella se muestra el placeholder
  tags: string[]
  desc: string
  metaDescription?: string // ≤155 chars para <meta name="description">
  liveUrl?: string // URL de demo/producción si existe
  repoUrl?: string // URL del repositorio si es público
  metrics: Metric[]
}

export interface Post {
  id: string
  title: string
  tag: string
  date: string
  read: string
  featured?: boolean
  desc?: string
  metaDescription?: string // ≤155 chars para <meta name="description">
}

// "Prueba en abierto": en lugar de testimonios fabricados, enlaces a trabajo
// real y verificable. `quote` describe el proyecto; `name`/`role` lo identifican;
// `url` apunta al repo o sitio público.
export interface Testimonial {
  quote: string
  name: string
  role: string
  url?: string
}

export interface HomeService {
  name: string
  sub: string
  price: string
}

export type Stat = readonly [string, string]

export interface TimelineEntry {
  year: string
  role: string
  org: string
  now?: boolean
  bullets: string[]
  link?: { href: string; label: string }
  tags: string[]
}

export interface Principle {
  icon: string
  title: string
  body: string
}

export interface StackCategory {
  name: string
  color: string
  leaves: string[]
}

export interface StackDetail {
  level: number
  projects: string[]
  note: string
}

export type Feature = readonly [string, boolean]

export interface Tier {
  name: string
  price: string
  unit: string
  pro?: boolean
  feats: Feature[]
}

export interface Tiers {
  proyecto: Tier[]
  retainer: Tier[]
}

export type ComparisonRow = readonly [
  string,
  readonly [boolean, boolean, boolean],
]

export interface Addon {
  name: string
  desc: string
  price: string
}

/**
 * Item del catálogo unificado (F11). El precio (`amount`, en la unidad mínima
 * de la moneda — céntimos) es la **fuente de verdad del servidor**: el cliente
 * solo envía el `id`, nunca el importe. Ver `lib/content/catalog.ts`.
 */
export type CatalogItemType = 'one_time' | 'recurring'

export type CatalogCategory =
  'servicio' | 'addon' | 'retainer' | 'consultoria' | 'proyecto'

export interface CatalogItem {
  id: string
  name: string
  desc: string
  amount: number // céntimos (EUR)
  currency: string
  type: CatalogItemType
  interval?: 'month' | 'year'
  stripePriceId?: string
  active: boolean
  category: CatalogCategory
  metadata?: Record<string, string>
}

/**
 * Item comprable vía Stripe Checkout. Mantenido por compatibilidad hacia atrás:
 * los componentes existentes importan `PurchasableItem` desde `checkout.ts`,
 * que ahora reexporta desde el catálogo unificado.
 */
export interface PurchasableItem {
  id: string
  name: string
  desc: string
  amount: number // céntimos (EUR)
  currency: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface NavLink {
  label: string
  href: string
}
