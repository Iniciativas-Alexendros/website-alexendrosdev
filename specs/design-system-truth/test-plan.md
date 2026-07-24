# Test Plan: design-system-truth

**Feature**: `design-system-truth`
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-23

---

## Estrategia

- **Tests unit (Vitest/node)**: invariantes CSS estáticos, asserts sobre texto de `docs/DESIGN.md`, asserts sobre archivos CSS (canónico por nombre, no por línea).
- **Tests integración (Vitest/component)**: axe sobre componentes clave, lectura de tokens en `<html>` y `<header>`.
- **Tests e2e (Playwright)**: snapshots visuales light + dark por ruta principal, hover-state de CTAs, alineación del timeline, loading-skeletons.
- **Scripts audit (Bash)**: `audit:hardcoded-colors`, `validate-tokens`. Endurecidos con nuevas puertas críticas.

Cobertura objetivo por fase (lock-in progresivo en `vitest.config.ts`):

| Fase        | Stmts | Brchs | Funcs | Lines | Nota                                                    |
| ----------- | ----- | ----- | ----- | ----- | ------------------------------------------------------- |
| Base actual | 89.99 | 80.00 | 92.30 | 91.42 | (estado pre-spec)                                       |
| Post-F0     | 88    | 79    | 91    | 90    | Tests añadidos penalizan — pero más superficie cubierta |
| Post-F2     | 88    | 80    | 91    | 90    | Refactor no baja cobertura                              |
| Gate final  | ≥85   | ≥80   | ≥85   | ≥85   | Lock-in                                                 |

---

## F0 — Tests validadores (RED inicial)

Archivo: `tests/unit/design-system-audit.test.ts` (CREATE)

| ID       | Assert                                                                                                                              | Cómo                                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| TU-0.1.a | `readFileSync('docs/DESIGN.md')` no contiene el string exacto `"❌ No hay tokens de z-index"`                                       | `expect(content).not.toContain(hayTokens); expect(content).toContain('--z-header'); expect(content).toContain('--z-modal');` |
| TU-0.1.b | Sección §2.17 contiene `"forwardRef NO convierte automáticamente"` o `"forwardRef no convierte automáticamente"` (case-insensitive) | Regex case-insensitive sobre el slice `§2.17` o `RSC awareness`                                                              |
| TU-0.1.c | Resumen ejecutivo no contiene `"90%"` en la fila `Token system` — debe mostrar `100%`                                               | Parse de la tabla markdown                                                                                                   |
| TU-0.1.d | Sección "Mapa de Archivos CSS" (§6 nueva) existe y lista 6+ filas con sus `@layer`                                                  | Regex sobre heading `## 6\.` y conteo de filas                                                                               |
| TU-0.1.e | Sección "Decisiones de Cascade" (§8 nueva) menciona `':where(a):is'` y la palabra `prohibición` o `prohibido`                       | Regex                                                                                                                        |
| TU-0.1.f | Sección "Animations Canónicas" (§9 nueva) menciona `rise` con `DEPREC` o `deprecado`                                                | Regex                                                                                                                        |
| TU-0.1.g | Sección §10 "Inventario ak-*" incluye al menos 6 categorías                                                                         | Regex count `### Layout Patterns\|Graph\|Content\|Form\|Skeleton\|States`                                                    |

Archivo: `tests/unit/css-invariants.test.ts` (CREATE; o ampliar `content-invariants.test.ts`)

| ID       | Assert                                                                                                                                                                                                                                                                            | Cómo                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| TU-0.2.a | `grep '@keyframes rise' src/styles/**/*.css` → 0 ocurrencias                                                                                                                                                                                                                      | `execSync` con `grep -rE` + parse exit code |
| TU-0.2.b | `grep '@keyframes reveal' src/styles/**/*.css` → ≥ 1 ocurrencia                                                                                                                                                                                                                   | igual                                       |
| TU-0.2.c | `grep 'color: #fff' src/styles/site.css` → 0 ocurrencias                                                                                                                                                                                                                          | igual                                       |
| TU-0.2.d | `grep 'padding: 0 32px' src/styles/site.css` → ≤ 1 ocurrencia (idealmente 0)                                                                                                                                                                                                      | igual                                       |
| TU-0.2.e | `.ak-header-inner` contiene `var(--header-height)` y `design-tokens.css` contiene `--header-height: 64px;`                                                                                                                                                                        | regex                                       |
| TU-0.2.f | Para cada clase en `{ak-eyebrow, ak-form-card, ak-field, ak-label, ak-input, ak-textarea, ak-panel, ak-skeleton, ak-side-group-t, ak-progress, ak-progress-bar}`: aparece exactamente en 1 archivo dentro de `src/styles/*.css`. `ak-panel` permite modificador `--md` adicional. | shell loop + tabla                          |
| TU-0.2.g | `grep -E 'services/ServicesView\.css' src/app/globals.css` → 0; `grep '_services.css' src/app/globals.css` → ≥ 1                                                                                                                                                                  | igual                                       |

Archivo: `tests/unit/css-architecture.test.ts` (CREATE — cubre ARCH-1 y ARCH-2)

| ID       | Assert                                                                                                                                                                                               | Cómo                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| TU-0.5.a | `grep -E '@keyframes' src/styles/design-tokens.css` → 0 ocurrencias post-F2.4 (todos los keyframes se mueven a site.css o _contact.css).                                                             | grep recursivo                    |
| TU-0.5.b | `design-tokens.css` contiene exactamente 4 secciones top-level: `:root { ... }`, `.dark { ... }`, semantic defaults (sin paréntesis propio), `@theme inline { ... }`. Sin otras secciones top-level. | regex + parse estructural         |
| TU-0.6   | `globals.css` assertions en orden estricto: contiene las 7 líneas `@import` en la secuencia documentada en `contract.md §2.1`. Detecta inversiones de orden.                                         | regex multilínea sobre el archivo |

Archivo: `tests/unit/css-sticky-tops.test.ts` (CREATE — cubre AC21b)

| ID       | Assert                                                                                              | Cómo                                                   |
| -------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| TU-0.7.a | `grep -E 'top: (64\|88\|90)px' src/styles/*.css` → 0 ocurrencias literales en sticky-affordances.   | grep recursivo + lista blanca media-queries si las hay |
| TU-0.7.b | Las sticky-affordances usan `calc(var(--header-height) + N)` o `var(--header-height)` directamente. | regex match                                            |

Archivo: `tests/unit/inventory-coverage.test.ts` (CREATE — cubre AC39a/b/c)

| ID       | Assert                                                                              | Cómo                      |
| -------- | ----------------------------------------------------------------------------------- | ------------------------- |
| TU-0.8.a | `docs/DESIGN.md` §10 sección "Layout Patterns" tiene ≥ 8 clases distintas listadas. | parse markdown subsección |
| TU-0.8.b | §10 sección "Graph" tiene ≥ 7 clases.                                               | idem                      |
| TU-0.8.c | §10 sección "Form System" tiene ≥ 15 clases.                                        | idem                      |
| TU-0.8.d | Las 6 categorías están presentes con ≥ 5 clases cada una.                           | parse + count             |

Archivo: `scripts/audit-scoreboard.mjs` (CREATE — cubre AC44)

Lee `docs/DESIGN.md`, parsea la tabla resumen ejecutivo, exit 1 si algún threshold (<100 token system, <85 componentes UI, <70 ARIA, <75 Testing, <90 CSS Architecture, <90 Documentación). Salida legible por CI.

Estado inicial (RED): todos fallan. Estado post-F2 (GREEN): todos pasan.

Archivo: `tests/unit/z-index-tokens.test.ts` (CREATE)

| ID       | Assert                                                                                                    | Cómo                                         |
| -------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| TU-0.3.a | `design-tokens.css` define 7 vars `--z-*`: base, content, sticky, header, overlay, modal, tooltip.        | Regex `:root\s*{([^}]*--z-)` + lista de keys |
| TU-0.3.b | `site.css` no contiene literales `z-index: \d` (excepto `z-index: auto\|unset\|initial\|inherit\|revert`) | regex + negation                             |
| TU-0.3.c | `site.css` o cualquier CSS usa `var(--z-*)` al menos 5 veces                                              | regex count                                  |

Archivo: `tests/unit/header-height.test.ts` (CREATE)

| ID       | Assert                                                                                                                                                          | Cómo              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| TU-0.4.a | `design-tokens.css` define `--header-height: 64px;` (regex)                                                                                                     | file read + regex |
| TU-0.4.b | `site.css .ak-header-inner` usa `height: var(--header-height)` (no literal `64px`)                                                                              | file read + regex |
| TU-0.4.c | Ningún CSS hardcoda `height: 64px` sin var (audit grep). Si aparece, debe ser dentro de `@media (...)` justificadamente o convertirlo a `var(--header-height)`. | grep              |

Total F0: **7 + 7 + 3 + 3 = 20 asserts** en 4 archivos nuevos.

---

## F1 — Diseño corregido (RED → GREEN)

Estado esperado de cada TU tras F1:

| TU       | Pre-F1                                     | Post-F1                                      | Vinculado a |
| -------- | ------------------------------------------ | -------------------------------------------- | ----------- |
| TU-0.1.a | ❌ encuentra "❌ No hay tokens de z-index" | ✅ no encuentra; encuentra tabla de scale    | RF1.1       |
| TU-0.1.b | ❌ §2.17 contiene error conceptual         | ✅ "forwardRef NO convierte automáticamente" | RF1.3       |
| TU-0.1.c | ❌ score 90% en token system row           | ✅ 100% (o ≥95)                              | RF1.4       |
| TU-0.1.d | ❌ no hay §6 con tabla                     | ✅ 6+ filas                                  | RF2         |
| TU-0.1.e | ❌ no hay ADR                              | ✅ menciona prohibición                      | RF4         |
| TU-0.1.f | ❌ no hay tabla keyframes                  | ✅ DEPRECATED para rise                      | RF5         |
| TU-0.1.g | ❌ no hay inventario                       | ✅ 6 categorías                              | RF12        |

---

## F2 — Refactor CSS

Sub-fases F2.1—F2.10. Cada uno cierra un subconjunto:

### F2.1 Tokens nuevos para layout

Asserts (verificables vía TU-0.4 + manual grep):

| AC                                                                        | Resultado                |
| ------------------------------------------------------------------------- | ------------------------ |
| `--header-height: 64px;` en `design-tokens.css`                           | TU-0.4.a verde           |
| `--container-px: 32px;` en `design-tokens.css`                            | grep `--container-px` ≥1 |
| `--gutter-md: 28px;` en `design-tokens.css`                               | grep `--gutter-md` ≥1    |
| `--fs-price: 1.875rem;` y `--fs-metric: 1.375rem;` en `design-tokens.css` | grep ≥1 cada             |

### F2.2 Limpiar duplicados site.css (DUP-1, DUP-2, DUP-3)

| ID   | Assert                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC11 | `grep -c "^\.ak-btn {.*gap: 6px" src/styles/site.css` ≥ 1, ≤ 1 (consolidado). Bloque .ak-btn base contiene `gap: 6px`                             |
| AC12 | `grep -c "ak-cta-form input { flex: 1" src/styles/site.css` = 1                                                                                   |
| AC13 | `grep -c "^\.ak-eyebrow " src/styles/site.css` = 1; el rule consolidado contiene `font-family`+`font-size`+`color`+`letter-spacing`+`white-space` |

### F2.3 source-of-truth en _contact.css (DUP-4, DUP-5, DUP-8, DUP-9)

| ID   | Assert                                                                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC14 | `grep -lE "^\.ak-form-card" src/styles/*.css` = sólo `_contact.css`                                                                                                    |
| AC15 | `grep -lE "^\.ak-field\|^\.ak-label\|^\.ak-input\|^\.ak-textarea" src/styles/*.css` = sólo `_contact.css` (con `.ak-cal-head .ak-label` que es subselector, permitido) |
| AC16 | `.ak-panel` vive en `site.css` con `padding: 18px`; `.ak-panel--md` vive en `_contact.css` con `padding: 22px`                                                         |
| AC18 | `.ak-side-group-t` vive sólo en `site.css`                                                                                                                             |

### F2.4 Mover keyframes (RF6)

| ID   | Assert                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC9  | `@keyframes rise` aparece 0 veces en repo                                                                                                                                      |
| AC10 | `@keyframes reveal` aparece ≥1 vez (en `design-tokens.css`)                                                                                                                    |
| Side | `@keyframes blink`, `marquee`, `pulse-ring` viven ahora en `site.css` (movidos desde `design-tokens.css`). `@keyframes pulse` vive en `site.css` (movido desde `_contact.css`) |

### F2.5 Skeleton única (DUP-7)

| ID   | Assert                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------- |
| AC17 | `.ak-skeleton { ... animation: skeleton-shimmer ... }` aparece exactamente 1 vez en `src/styles/` |
| AC18 | `.ak-skeleton { ... animation: pulse ... }` aparece 0 veces                                       |

### F2.6 Reemplazar hardcoding (HC-1…HC-6)

| ID   | Assert                                                                      |
| ---- | --------------------------------------------------------------------------- |
| AC19 | `grep "color: #fff" src/styles/site.css` = 0 (TS-0.2.a exits 0)             |
| AC20 | `grep "padding: 0 32px" src/styles/site.css` ≤ 1                            |
| AC21 | `.ak-header-inner` usa `var(--header-height)` (TU-0.2.e verde)              |
| AC22 | `.ak-tier-price` usa `var(--fs-price)`                                      |
| AC23 | `.ak-zz-idx b` usa `var(--fs-h2)`; `.ak-zz-metric b` usa `var(--fs-metric)` |
| AC24 | `grep "gap: 28px" src/styles/site.css` = 0; usa `var(--gutter-md)`          |

### F2.7 Sr-only moderno (HC-7)

| ID   | Assert                                                                                       |
| ---- | -------------------------------------------------------------------------------------------- |
| AC25 | `grep "left: -9999px" src/styles/site.css` = 0; `.ak-sr-only` contiene `clip: rect(0,0,0,0)` |

### F2.8 Extender `:where(a):is(...)` (VISUAL-1)

| ID   | Assert                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| AC26 | Lista `.is(...)` contiene ≥ 11 selectores                                                                          |
| AC27 | E2E hover sobre `<a class="ak-btn-primary">` en `/contacto` → computed color matches `hsl(var(--text-on-primary))` |

### F2.9 Alineación tl-dot (VISUAL-6)

| ID   | Assert                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------- |
| AC31 | `.ak-tl-dot.active` y `.ak-tl-dot` tienen ambos `left: -29px` (mismo valor). No hay `left: -30px` |

### F2.10 ServicesView.css a styles/ (ARCH-5)

| ID    | Assert                                                           |
| ----- | ---------------------------------------------------------------- |
| AC32  | `grep "services/ServicesView.css" src/app/globals.css` = 0       |
| AC32b | `grep "_services.css" src/app/globals.css` ≥ 1                   |
| AC32c | `find src/components -name "*.css"` = 0 (sin CSS en components/) |

---

## F3 — Tests visuales y regresión (Re-hidratación 2026-07-24)

Estado tras F3 cierre: 3 archivos e2e actualizados con **TE-3.1** (asserts DOM funcionales), **TE-3.2** (snapshots pixel-level) y **TE-3.3** (computed-style locks).

### Archivo activo 1: `tests/e2e/design-system-visual.spec.ts` (Asserts DOM Funcionales)

| ID       | Suit                    | Assert                                                         | Vinculado a     |
| -------- | ----------------------- | -------------------------------------------------------------- | --------------- |
| TE-3.1.a | home renders            | `/` carga con título `/Alexendros/` + `.ak-display` visible    | RF11            |
| TE-3.1.b | theme toggle            | click en `.ak-theme-toggle` cambia `data-theme` en `<html>`    | RF7 dark-mode   |
| TE-3.1.c | projects sidebar sticky | `.ak-projects-sidebar` top NO usa `88px`/`64px`/`90px` literal | RF8 HC-3 sticky |
| TE-3.1.d | about timeline dots     | `.ak-tl-dot.active` `left === '-29px'` (alineado con base)     | RF9 VISUAL-6    |
| TE-3.1.e | blog lists              | `count(ak-blog-row) ≥ 1`                                       | RF11 sanity     |

### Archivo activo 2: `tests/e2e/visual-snapshot.spec.ts` (Pixel-level Lock-in)

Bloque TE-3.2 (NUEVO en F3) — snapshots element-level estables para /contacto, /proyectos, /blog en light + dark:

| ID       | Ruta         | Elemento        | Snapshot light/dark                   |
| -------- | ------------ | --------------- | ------------------------------------- |
| TE-3.2.a | `/contacto`  | `.ak-form-card` | `contacto-form-card-{light,dark}.png` |
| TE-3.2.b | `/proyectos` | `.ak-masonry`   | `proyectos-masonry-{light,dark}.png`  |
| TE-3.2.c | `/blog`      | `.ak-bloglist`  | `blog-list-{light,dark}.png`          |

Bloque legacy (TE-3.0 light/dark heroes de proyectos individuales — pre-existente):

| ID         | Ruta                       | Elemento       | Snapshot light/dark |
| ---------- | -------------------------- | -------------- | ------------------- |
| TE-3.0.a   | `/proyectos/alexendros-me` | `.ak-hero-img` | `{slug}-light.png`  |
| TE-3.0.b   | `/proyectos/alexendros-me` | `.ak-hero-img` | `{slug}-dark.png`   |
| TE-3.0.c … | (idem para 5 slugs)        | `.ak-hero-img` | light/dark × 5      |

**Total snapshots en `visual-snapshot.spec.ts`:** 6 nuevos de F3 (TE-3.2) + 10 legacy (TE-3.0) = 16 imágenes en `tests/e2e/visual-snapshot.spec.ts-snapshots/`.

**maxDiffPixelRatio:** 0.02 (tolerancia a subpixel rendering entre distros).

**Baseline generation:** `pnpm exec playwright test tests/e2e/visual-snapshot.spec.ts --update-snapshots`. Primera ejecución crea los baseline; subsiguientes diff con maxDiffPixelRatio 0.02.

### Archivo activo 3: `tests/e2e/a11y.spec.ts` (axe-core + computed style)

Bloque TE-3.3 (NUEVO en F3) — computed-style locks como regression-test de tokens aplicados:

| ID       | Ruta         | Assert                                                                                           | Vinculado a      |
| -------- | ------------ | ------------------------------------------------------------------------------------------------ | ---------------- |
| TE-3.3.a | `/contacto`  | `getComputedStyle(input.ak-input).paddingInlineStart === '32px'` (lock de `var(--container-px)`) | RF8 HC-2         |
| TE-3.3.b | `/contacto`  | `getComputedStyle(textarea).minHeight === '140px'` (cierre visual DUP ak-textarea Opción A)      | T2 consolidation |
| TE-3.3.c | `/proyectos` | `getComputedStyle(.ak-tile-stat).color !== 'rgb(255,255,255)'` y matchea `^hsl\(` (HC-1 cerrado) | RF8 HC-1         |

Bloque legacy (axe-core gates) — actualizadas para incluir `/blog`:

| ID          | Ruta                                                                                                        | Assert                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| TE-3.A11Y.a | 8 rutas (`/`, `/sobre-mi`, `/servicios`, `/proyectos`, `/contacto`, `/stack`, `/blog`, `/legal/privacidad`) | axe-core con tags `wcag2a/2aa/21aa` — 0 violations `critical` o `serious` en cada ruta |

### Lighthouse CWV (scripts/audit-lighthouse.mjs)

No ejecutable en CI (Chrome path hardcoded `/home/alexendros/.cache/ms-playwright/chromium-1228/...` + URLs producción `https://alexendros.dev`). Workflow local:

```
node scripts/audit-lighthouse.mjs   # 24 corridas (12 URLs × mobile+desktop)
```

Genera evidencia Markdown en `~/auditoria-alexendros-dev/reports/lh-cwv-resumen.md` con scores + LCP/CLS/TBT per URL per dispositivo. Run history queda en `~/auditoria-alexendros-dev/reports/lh-<slug>-<device>-<ts>.json`.

**Métricas tracked:** LCP (ms), CLS (decimal), TBT (ms), FCP (ms), Speed Index (ms), TTI (ms). Scores: Performance, Accessibility, Best Practices, SEO.

## Cobertura final F3

- Funcionales (TE-3.1 × 5 asserts): ✅ existentes en `design-system-visual.spec.ts`.
- Pixel-level snapshots (TE-3.2 × 6 elementos × 2 temas): ✅ nuevos en `visual-snapshot.spec.ts`.
- Computed-style locks (TE-3.3 × 3 asserts): ✅ nuevos en `a11y.spec.ts`.
- axe-core gates (TE-3.A11Y × 8 rutas): ✅ ampliado con `/blog`.
- Lighthouse CWV: manual-run fuera de CI, evidencia en `~/auditoria-alexendros-dev/reports/`.

---

## F4 — Gates finales

Suite completa, ejecutada en CI:

| ID    | Gate               | Comando                                                    | Umbral                                                                                                                                                       | Acumulado              |
| ----- | ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| T6.1  | Vitest typecheck   | `pnpm typecheck`                                           | exit 0                                                                                                                                                       | AC41                   |
| T6.2  | ESLint             | `pnpm lint`                                                | exit 0                                                                                                                                                       | AC40                   |
| T6.3  | Build              | `pnpm build`                                               | 32 rutas compilan                                                                                                                                            | AC42                   |
| T6.4  | Test coverage      | `pnpm test:coverage`                                       | stmts≥85 / brchs≥80 / funcs≥85 / lines≥85                                                                                                                    | AC43                   |
| T6.5  | E2E                | `pnpm e2e`                                                 | exit 0 (todos los nuevos + legacy)                                                                                                                           | AC32, AC27, AC29, AC31 |
| T6.6  | Audit tokens       | `pnpm validate-tokens` + `node scripts/validate-tokens.sh` | exit 0 con nuevas puertas                                                                                                                                    | AC38                   |
| T6.7  | Audit colors       | `pnpm audit:hardcoded-colors`                              | exit 0                                                                                                                                                       | AC37                   |
| T6.8  | Audit HTML/sr-only | `node scripts/audit-html.mjs`                              | 0 hits `left: -9999px`                                                                                                                                       | AC25                   |
| T6.9  | Format             | `pnpm format:check`                                        | exit 0                                                                                                                                                       | AC40‑adj               |
| T6.10 | Snapshot diff      | `pnpm e2e --visual-snapshot.spec.ts`                       | 100% match updated baselines                                                                                                                                 | AC27                   |
| T6.11 | Scoreboard final   | `node scripts/audit-scoreboard.mjs`                        | exit 0; las 6 subdimensiones cumplen thresholds (Token system 100%, Componentes UI ≥85%, ARIA ≥70%, Testing ≥75%, CSS Architecture ≥90%, Documentación ≥90%) | AC44                   |

Score al cierre: ≥85/100 (consolidación de las 6 subdimensiones, gateado por T6.11).

---

## Cobertura objetivo por fase

| Fase                  | Stmts | Brchs | Funcs | Lines | Δ vs base                  |
| --------------------- | ----- | ----- | ----- | ----- | -------------------------- |
| Pre-spec (base)       | 89.99 | 80.00 | 92.30 | 91.42 | —                          |
| Post-F0 (tests rojos) | 88.5  | 79    | 91    | 90    | -1.5/-1/-1.3/-1.4          |
| Post-F1 (docs fix)    | 88.5  | 79    | 91    | 90    | 0 (sólo docs)              |
| Post-F2 (CSS)         | 88    | 80    | 91    | 90    | -0.5/+1/0/0                |
| Post-F3 (e2e+nuevos)  | 88    | 80    | 91    | 90    | 0 (e2e fuera cobertura v8) |
| Gate F4 (lock-in)     | ≥85   | ≥80   | ≥85   | ≥85   | gate                       |

Acción correctiva si F4 baja coverage: tests unitarios adicionales sobre parseo de CSS.

---

## Orden de ejecución orquestada (DAG)

```
F0 (RED) ─┬─► F1 (verde en docs-truth)
          │
          └─► F2 (verde en CSS refactor, paralelo a F1)
              │
              ├─► F3 (verde en e2e visual)
              │
              └─► F4 (gates: lint/typecheck/build/coverage/audit/e2e)
```

---

## Refactor scripts: `audit-hardcoded-colors.mjs`

Antes (estado actual del script — desconocido):

- Acaso busca `#hex` simple.

Después (post-RF11.5):

- Detecta `#fff` literal: `[ "color: #fff", "color: #FFF", "background: #fff" ]`.
- Detecta hex crudo (3, 6, 8 dígitos): regex `#[0-9a-fA-F]{3,8}` con validación de longitud exacta (3, 6 o 8).
- Detecta `rgb(`/`rgba(` literales fuera de `rgba(0,0,0,0)` y `rgba(255,255,255,0)`.
- Excluye SVG inline data URIs.
- Excluye Section comments en CSS (`/* usar #fff solo si... */`).
- Salida: JSON con `{ file, line, column, value, rule }`.
- Exit 0 si 0 hits; exit 1 si >0 hits.

---

## Validación cruzada: design-system-audit test suite

Una vez F1 + F2 mergeados, ejecutar:

```
pnpm test:coverage -- tests/unit/design-system-audit.test.ts tests/unit/css-invariants.test.ts tests/unit/z-index-tokens.test.ts tests/unit/header-height.test.ts
```

Debería dar 100% verde en los 4 archivos. Si rojo → revertir merge.

---

## Resumen: tests totales esperados

| Tipo                 | Pre-spec             | Post-F0                         | Post-F1-F2  | Post-F3-F4               |
| -------------------- | -------------------- | ------------------------------- | ----------- | ------------------------ |
| Unit (Vitest)        | ~190                 | +7 files (34 asserts)           | + 0         | + 0                      |
| Component (Vitest)   | existing             | sin cambios                     | sin cambios | sin cambios              |
| Integration (Vitest) | existing             | + 0                             | + 0         | + 0                      |
| E2E (Playwright)     | existing (incl. axe) | +0                              | +0          | + 1 spec nuevo (8 tests) |
| Scripts audit        | 4 existentes         | + 0 (sólo extensiones internas) | + 0         | + 1 nuevo (scoreboard)   |

**Total Δ tests:** +34 unit asserts (F0: design-system-audit + css-invariants + z-index + header-height + css-architecture + sticky-tops + inventory-coverage) + 8 e2e (F3) = **+42 nuevos tests + 1 script**.

Lock-in: cada PR futuro debe mantener verdes estos 42 + cobertura ≥85% + 5 audit scripts en verde.
