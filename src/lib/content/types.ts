// Tipos del contenido del portfolio (Arctic Ocean).

export interface Metric {
  v: string;
  l: string;
  acc?: boolean;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  kind: "Web App" | "Plataforma" | "Infra" | "API" | "Open Source";
  year: string;
  h: number; // alto relativo para el masonry
  featured?: boolean;
  image?: string; // captura en /public (ratio 4:3); sin ella se muestra el placeholder
  tags: string[];
  desc: string;
  metrics: Metric[];
}

export interface Post {
  id: string;
  title: string;
  tag: string;
  date: string;
  read: string;
  featured?: boolean;
  desc?: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface HomeService {
  name: string;
  sub: string;
  price: string;
}

export type Stat = readonly [string, string];

export interface TimelineEntry {
  year: string;
  role: string;
  org: string;
  now?: boolean;
  bullets: string[];
  tags: string[];
}

export interface Principle {
  icon: string;
  title: string;
  body: string;
}

export interface StackCategory {
  name: string;
  color: string;
  leaves: string[];
}

export interface StackDetail {
  level: number;
  years: string;
  projects: string[];
  note: string;
}

export type Feature = readonly [string, boolean];

export interface Tier {
  name: string;
  price: string;
  unit: string;
  pro?: boolean;
  feats: Feature[];
}

export interface Tiers {
  proyecto: Tier[];
  retainer: Tier[];
}

export type ComparisonRow = readonly [string, readonly [boolean, boolean, boolean]];

export interface Addon {
  name: string;
  desc: string;
  price: string;
}

/**
 * Item comprable vía Stripe Checkout. El precio (`amount`, en la unidad mínima
 * de la moneda — céntimos) es la **fuente de verdad del servidor**: el cliente
 * solo envía el `id`, nunca el importe. Ver `lib/content/checkout.ts`.
 */
export interface PurchasableItem {
  id: string;
  name: string;
  desc: string;
  amount: number; // céntimos (EUR)
  currency: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface NavLink {
  label: string;
  href: string;
}
