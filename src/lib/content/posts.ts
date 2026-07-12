import type { Post } from './types'

// Posts derivados de proyectos reales. Los cuerpos viven en content/blog/<id>.mdx.
// Son borradores iniciales (v1); ampliar/actualizar cuando proceda.
export const POSTS: Post[] = [
  {
    id: 'plantillas-claude-init',
    title: 'Plantillas claude-init-ready para Claude Code',
    tag: 'DevTools',
    date: '30 Abr 2026',
    read: '7 min',
    featured: true,
    desc: 'Un ecosistema de plantillas para construir agentes, herramientas y servidores sin empezar de cero, con comprobaciones automáticas y despliegue continuo.',
    metaDescription:
      'Plantillas claude-init-ready para agentes, skills y servidores MCP. Sin empezar de cero, con validadores automáticos y CI.',
  },
  {
    id: 'trenchpass-mcp-gateway',
    title: 'Un único custodio para todas tus credenciales: TrenchPass en Rust',
    tag: 'Plataforma',
    date: '28 May 2026',
    read: '9 min',
    desc: 'Por qué reuní las credenciales de ~20 servicios externos detrás de una sola puerta de entrada, con registro de cada acceso y monitorización. La historia de TrenchPass.',
    metaDescription:
      'Cómo TrenchPass centraliza ~20 credenciales de servicios externos en una API Rust con auditoría y monitorización.',
  },
  {
    id: 'xek-verificacion-componible',
    title: 'Verificar sin modificar: el enfoque de XEK',
    tag: 'Calidad',
    date: '14 May 2026',
    read: '8 min',
    desc: 'Más de 40 comprobaciones automáticas que revisan calidad y seguridad e informan, sin modificar nada. De la prueba en seco a la real, sobre proyectos, aplicaciones y servidores.',
    metaDescription:
      'XEK: 40+ comprobaciones de calidad y seguridad en 3 fases. Revisa e informa sin tocar el código. Proyectos, apps y servidores.',
  },
  {
    id: 'devin-desktop-mcp-inconsistencias',
    title:
      'Devin Desktop, MCP y la documentación: seis inconsistencias que bloquean servidores locales',
    tag: 'DevTools',
    date: '1 Jul 2026',
    read: '10 min',
    desc: 'Autopsia de una semana de pruebas: por qué Devin Desktop bloquea servidores MCP locales en un plan Pro y dónde la documentación de docs.devin.ai contradice la realidad del sistema.',
    metaDescription:
      'Devin Desktop bloquea servidores MCP locales por una allowlist de org Pro. Análisis de seis inconsistencias entre docs.devin.ai y la realidad del sistema.',
  },
  {
    id: 'cuanto-cuesta-web-medida-2026',
    title: 'Cuánto cuesta una web a medida en 2026 (precios reales)',
    tag: 'Clientes',
    date: '30 Jul 2026',
    read: '8 min',
    desc: 'Rangos de precios reales para webs a medida en 2026: qué incluye cada tier y cómo evitarte sorpresas.',
    metaDescription:
      'Rangos reales 2026: landing 600-1200€, web 1200-2900€, plataforma 2900-5900€+. Qué incluye cada tier y costes ocultos.',
  },
  {
    id: 'wordpress-vs-desarrollo-medida-2026',
    title: 'WordPress vs desarrollo a medida: cuándo elegir cada uno en 2026',
    tag: 'Clientes',
    date: '30 Jul 2026',
    read: '7 min',
    desc: 'WordPress no es mejor ni peor que Next.js. La elección depende de qué necesitas, no de modas.',
    metaDescription:
      'Cuándo WordPress tiene sentido y cuándo conviene Next.js: comparativa honesta de coste, SEO, mantenimiento.',
  },
]

export const BLOG_TAGS = [
  'Todos',
  'Plataforma',
  'DevTools',
  'Calidad',
  'Rust',
  'Open Source',
  'Clientes',
]

export function getPost(id: string): Post | undefined {
  return POSTS.find((p) => p.id === id)
}

// ─── Calendario editorial ───────────────────────────────────────────────────
// Los posts con fecha futura NO se publican hasta llegada su fecha: quedan
// fuera del listado, del home, del sitemap y del feed, y su URL responde 404.
// `POSTS` conserva el catálogo completo (tests e invariantes); los consumidores
// públicos deben usar `getPublishedPosts()` / `isPostPublished()`.
// Las páginas estáticas se regeneran en cada despliegue: un post cuya fecha
// llegue aparece automáticamente en el siguiente deploy.
const MONTHS: Record<string, number> = {
  Ene: 0,
  Feb: 1,
  Mar: 2,
  Abr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Ago: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dic: 11,
}

export function parsePostDate(d: string): Date | null {
  const m = /^(\d{1,2})\s+([A-Za-zÁ-ú]{3})\w*\s+(\d{4})$/.exec(d.trim())
  if (!m) return null
  const mon = MONTHS[m[2].slice(0, 3)]
  if (mon === undefined) return null
  return new Date(Date.UTC(Number(m[3]), mon, Number(m[1])))
}

// Un post está publicado si su fecha es hoy o anterior. Fechas no parseables
// no bloquean (fail-open) para no ocultar contenido por un typo de formato.
export function isPostPublished(p: Post, now: Date = new Date()): boolean {
  const d = parsePostDate(p.date)
  if (!d) return true
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  return d.getTime() <= endOfToday.getTime()
}

// Evaluado por llamada (sin caché de módulo): feed y sitemap se generan en
// runtime y respetan el calendario editorial sin redesplegar.
export function getPublishedPosts(now?: Date): Post[] {
  return POSTS.filter((p) => isPostPublished(p, now))
}
