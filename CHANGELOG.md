# Changelog

## 2026-07-24 — F19 / PR #126: Design System Truth — auditoría, saneamiento y gobernanza

### Especificación formal (`specs/design-system-truth/`)

- Crear spec de 4 artefactos: `spec.md` (9 RF, 33 AC), `contract.md` (schemas Zod),
  `scenarios.md` (7 HP, 10 EC), `test-plan.md` (104 TU/TE planificados)
- Auto-validador `scripts/audit-spec-coherence.mjs`: cross-referencia RF↔AC↔TU/TE↔tests/,
  dashboard markdown + score
- Score spec: 100% (referencias byBlock completas, pipes corregidos)
- F0: 7 tests unitarios en worktree (`design-system-audit`, `css-invariants`,
  `z-index-tokens`, `header-height`, `css-architecture`, `css-sticky-tops`,
  `inventory-coverage`)

### Docs corregidos (`docs/DESIGN.md`)

- **ERROR 1** (z-index): eliminar ❌ de gaps, añadir tabla `--z-*` scale completa
- **ERROR 2** (§2.6 reescrito): diagnóstico real de capas CSS en vez de falso negativo
- **ERROR 3** (§2.17 RSC): corregir error conceptual (`forwardRef` no convierte a Client
  Component; la causa real son hooks de estado/efecto)
- **ERROR 4** (score): recalcular Token System coverage a 100%
- **Secciones nuevas**: §6 Mapa de Archivos CSS, §7 Regla de Criterio ak-* vs Tailwind,
  §8 Decisiones de Cascade (ADR), §9 Animaciones Canónicas, §10 Inventario de
  Componentes CSS
- Footer SHA actualizado, métricas Spacing/Radius sincronizadas post-depuración

### CSS Architecture (RF6-RF10)

- **RF6**: Mover `@keyframes` de `design-tokens.css` a `site.css` (separar 5
  responsabilidades mezcladas)
- **RF7**: Eliminar 9 duplicidades en site.css y _contact.css (DUP-1..DUP-9):
  `ak-btn gap`, `ak-cta-form input flex`, `ak-eyebrow`, `ak-form-card`,
  `.ak-field`/`.ak-label`/`.ak-input`/`.ak-textarea`, `@keyframes rise` (unificado
  con `reveal`), `ak-skeleton` (shimmer canónico), `ak-panel` (BEM con
  `--sm`/`--md`), `ak-side-group-t`
- **RF8**: Crear tokens layout: `--container-px: 32px`, `--header-height: 64px`,
  `--fs-price: 1.875rem`, `--fs-metric: 1.625rem`, `--fs-metric-label: 1.375rem`
- **RF9**: Extender cascade fix `:where(a):is(...)` de 3 a 13 selectores, con
  excepción de `ak-btn-secondary` (texto oscuro, no blanco)
- **RF10**: Mover `ServicesView.css` a `src/styles/_services.css` (único archivo CSS
  fuera de `styles/`)
- Reemplazar 9 colores hardcoded por tokens (`hsl(0 0% 0% / ...)` → `--black`,
  `hsl(213 ...)` → `hslWithOpacity(colors.text.primary, ...)`)
- Añadir `--black: 0 0% 0%` como token canónico en `design-tokens.css`

### Tokens depurados (coverage 103% → 100%)

- Eliminar 11 tokens legacy: `--space-{1..24}` (scale antigua), `--radius-interactive`
- Eliminar `--gutter-lg` y `--gutter-sm` (deprecation completa post-revisión 2026-10)
- Marcar 5 tokens como reservados intencionalmente: `--z-*` (4) + `--ease-bounce`
- DESIGN.md §1.5 actualizado con tabla de estado real (used / reserved / deprecated)

### Auditoría y gobernanza (scripts unificados)

- `scripts/audit-hardcoded-colors.mjs`: 0 violaciones post-F19
- `scripts/audit-token-coverage.mjs`: coverage + unused + reserved + fallbacks;
  allowlist de reservados para que `--strict` no falle
- `scripts/audit-spec-coherence.mjs`: score 100%, 0 orphan tests
- `scripts/audit-design-system.mjs`: dashboard unificado (tokens × colors × spec)
- `scripts/fix-token-coverage.mjs`: auto-fix determinista con dry-run + balanced-paren
  parser (TU-2.X stress test con 50 strings)
- `pnpm audit:tokens` / `pnpm audit:tokens:strict` en package.json
- CI gate: `audit:tokens:strict` en `.github/workflows/ci.yml`

### E2E fixes (pre-existentes, no introducidos por F19)

- **a11y contraste** `/legal/privacidad`: `ak-btn-secondary` fuera del cascade fix
  white-text, regla específica con `color: hsl(var(--text-primary))`
- **textarea** `/contacto`: navegar al paso 1 con `getByPlaceholder` scoped a
  `.ak-contact-grid` antes de buscar textarea
- **tile-metric** `/proyectos`: validación RGB en vez de `toMatch(/^hsl/)`
  (getComputedStyle devuelve rgb(), no hsl() en navegador)

### Pruebas

- 600 tests verdes (unit + integración + componentes + e2e)
- Coverage gates: statements 90.51%, branches 80.41%, functions 92.59%, lines 91.42%
- 7 tests unitarios nuevos en `tests/unit/design-system/`
- TU-2.X (balanced-paren parser stress test con 50 strings)
- TU/TE en spec design-system-truth como lock-in de regresión visual

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
