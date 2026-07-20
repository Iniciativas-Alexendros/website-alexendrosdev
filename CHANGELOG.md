# Changelog

## 2026-07-20 — PR #108: Optimización CWV, seguridad y limpieza

### Rendimiento (Core Web Vitals)

- **LCP**: `font-display: optional` en Geist, Geist Mono y JetBrains Mono (texto visible
  inmediato sin FOUT)
- **LCP**: Eliminar `<Reveal>` (framer-motion) above-the-fold en `/sobre-mi`, `/servicios`,
  `/proyectos/[slug]` y `/not-found` (hero renderiza sin esperar animación JS)
- **LCP**: Skeleton estático de StackGraph en `/stack` (nodos visibles en SSR sin esperar
  hidratación de framer-motion)
- **LCP**: `fetchPriority="high"` en hero image de `/proyectos/[slug]` y primer tile del
  masonry grid de `/proyectos`
- **CLS**: Envolver `ContactView` en `<Suspense>` con `fallback={null}` para eliminar CLS
  causado por `useSearchParams()` (0.929 → ~0.000)
- **CLS**: Aplicar el mismo patrón de Suspense a otras páginas con riesgo similar

### Blog eliminado (12 archivos)

- Eliminar rutas `/blog` y `/blog/[slug]`
- Eliminar componentes BlogView, BlogSearch
- Eliminar `src/lib/content/posts.ts` y `content/blog/*` (7 MDX + calendar)
- Eliminar feed RSS (`/feed.xml/route.ts`)
- Eliminar BlogPosting JSON-LD, referencias en NAV, sitemap y metadata
- Eliminar tests de blog (`blog.spec.ts`, `posts.test.ts`)
- Eliminar dependencias huérfanas: `gray-matter`, `next-mdx-remote` (112 packages del lockfile)

### Escaparate

- Eliminar rastros residuales de la feature Escaparate (ya redirigía a `/servicios`)

### Seguridad (agentes IA)

- Separar `crmClient` en `crm-reader.ts` (solo GET) y `crm-writer.ts` (con allowlist de
  endpoints igual que el reparador)
- Centralizar `ALLOWED_ENDPOINT_PATTERNS` en `config.ts` (evitar duplicación en schemas)
- Añadir tests de integridad de capas: ningún LLM output puede derivar en escritura CRM
  sin pasar por la allowlist
- Schema Zod con `.strip()` explícito (autodocumentar que la seguridad es intencional)
- Nonces en CSP para eliminar `unsafe-inline` de `script-src`

### Refactor (code-simplification)

- Simplificar `reparador.ts`: extraer `executeAction()` (~80 → ~40 líneas, 3 bloques
  if/else anidados a funciones helper)
- Simplificar `auditor.ts`: ~250 líneas → estructura más plana
- Simplificar `diagnosticador.ts`: mejorar legibilidad y reducir anidamiento
- Simplificar `Testimonials.tsx`: extraer header compartido (~40 líneas de duplicación
  eliminadas)
- Simplificar `HomeFeaturedProjects.tsx`: mismo patrón que Testimonials
- Simplificar `ServicesView.tsx`: eliminar `<Reveal>` redundantes y simplificar JSX
- Simplificar `prompts.ts`, `schemas.ts`, `crm-reader.ts`: alinear con el resto de agentes

### Pruebas

- Arreglar 6 tests pre-existentes:
  - 3 tests con mocking de `@/lib/agents/config`: añadir `ALLOWED_ENDPOINT_PATTERNS`,
    `isAllowedRepairEndpoint` y otros exports faltantes al mock
  - 2 tests con Zod key ordering frágil: ordenar arrays esperados alfabéticamente
  - 1 test con module resolution de `token-map.mjs`: restaurar archivo desde `main`
- Restaurar `scripts/token-map.mjs` (faltaba en esta branch)
- Añadir tests de seguridad: integridad de capas para crmReader, endpoints permitidos/no
  permitidos/formato inválido
- Actualizar tests de navegación, SEO, JSON-LD para reflejar blog eliminado

### Tokens (DTCG)

- Alinear `--text-tertiary` dark con DTCG: 68% → 62% (produce `#86aab6`)
- Alinear `--text-muted` dark con DTCG: 58% → 52% (produce `#6c919d`)
- Validación de tokens en CI gate (pre-push hook)

### Infraestructura

- `scripts/audit-lighthouse.mjs`: ampliar cobertura a 12 URLs + timestamp en reports
  (no sobrescribe ejecuciones anteriores)
- Añadir `lighthouse-budget.json` con métricas LCP 2500ms / CLS 0.1 / TBT 200ms
- Fix glob matching en `should-build.mjs` (`*` no cruza `/`)

### UI

- Añadir variante `outline` a `Button` component (fix TS7053 pre-existente)

## 2026-07-13

- Test: validación del triple gate de CI/Vercel
