# Contract: design-system-truth

**Feature**: `design-system-truth`
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-23
**SHA auditado**: 5f8fd9b9911385e7a7b5e032e611c0705997481b

---

## 1. Tokens canónicos en `src/styles/design-tokens.css`

### 1.1 Tokens NUEVOS a añadir en §1 (después de `--container-max`)

```css
:root {
  /* Layout (nuevos — HC-2, HC-3, HC-6 derivados) */
  --container-px: 32px;
  --header-height: 64px;
  --gutter-md: 28px;
  --gutter-lg: 32px;
  --gutter-sm: 24px;

  /* Type scale extendido (HC-4, HC-5 derivados) */
  --fs-price: 1.875rem; /* 30px — ancla de pricing */
  --fs-metric: 1.375rem; /* 22px — métricas de proyecto */
}
```

### 1.2 Z-index scale (ya existe, RF1.1 lo documenta)

```css
:root {
  --z-base: 1;
  --z-content: 10;
  --z-sticky: 40;
  --z-header: 50;
  --z-overlay: 60;
  --z-modal: 70;
  --z-tooltip: 80;
}
.dark {
  /* mismas vars; sin override (no cambian con tema) */
}
```

### 1.3 Pre-condiciones

- `site.css` debe usar **exclusivamente** `var(--z-*)` y nunca `z-index` literal (excepto `unset`/`auto`). Audit en `tests/unit/z-index-tokens.test.ts`.
- `site.css` debe usar **exclusivamente** `var(--header-height)` para affordances de header-affecting. Audit en `tests/unit/header-height.test.ts`.

---

## 2. Inventario de archivos CSS y convención

| Archivo             | @layer              | Vive en       | Importa                  | Importado por | Fuente de verdad de                                             |
| ------------------- | ------------------- | ------------- | ------------------------ | ------------- | --------------------------------------------------------------- |
| `globals.css`       | n/a                 | `src/app/`    | `tailwindcss`, `@source` | nadie         | entry point                                                     |
| `design-tokens.css` | unlayered           | `src/styles/` | nada                     | `globals.css` | tokens, dark, semantic defaults, @theme (sin keyframes tras F2) |
| `site.css`          | `@layer components` | `src/styles/` | nada                     | `globals.css` | ak-* base + organismos + keyframes                              |
| `_projects.css`     | `@layer components` | `src/styles/` | nada                     | `globals.css` | projects sidebar + masonry                                      |
| `_contact.css`      | `@layer components` | `src/styles/` | nada                     | `globals.css` | **form/calendar/channels (DUP-5 verdict)**                      |
| `_navbar.css`       | `@layer components` | `src/styles/` | nada                     | `globals.css` | mobile nav + scrolled header                                    |
| `_services.css`     | `@layer components` | `src/styles/` | nada                     | `globals.css` | **destino de ServicesView.css**                                 |

### 2.1 Orden canónico de imports en `globals.css`

```css
@import "tailwindcss" source(none);
@source "../../src/**/*.{ts,tsx,js,jsx,css}";
@import "../styles/design-tokens.css"; /* tokens, dark, semantic defaults, @theme */
@import "../styles/site.css"; /* ak-* base + organismos */
@import "../styles/_projects.css"; /* projects sidebar (depende de site.css) */
@import "../styles/_contact.css"; /* form (depende de site.css BUT v override) */
@import "../styles/_navbar.css"; /* mobile nav (depende de site.css) */
@import "../styles/_services.css"; /* services (post-merge con ServicesView.css) */
```

### 2.2 Convenciones arquitectónicas

- **Todo CSS global vive en `src/styles/`**. Componentes no importan CSS directamente (`grep 'import.*\.css' src/components/` debe mostrar 0 hits en `.tsx`).
- **CSS por sección/componente vive en un archivo `_<nombre>.css`** dentro de `src/styles/`. Si un componente requiere estilos específicos extensos (>50 líneas), proponer mover a `_X.css`.
- _*Mezcla ak-* con utilities_*: `.ak-*` define estructura; utilities Tailwind se usan para variaciones puntuales. Prohibido sobrescribir las mismas propiedades (ver DESIGN.md §7).

---

## 3. Clases canónicas por archivo (post-refactor)

### 3.1 `site.css` — clases que viven exclusivamente aquí

```
ak-app, ak-scroll, ak-container, ak-btn, ak-btn-primary, ak-btn-secondary,
ak-btn-ghost, ak-theme-toggle, ak-header, ak-header-scrolled, ak-header-inner,
ak-logo, ak-nav(.on), ak-header-right, ak-terminal*, ak-marquee*, ak-cursor,
ak-hero*, ak-status, ak-status-dot, ak-display, ak-section, ak-section-sunken,
ak-section-head, ak-section-sub, ak-eyebrow (UNIFICADA, versión completa),
ak-tag, ak-projects, ak-pcard*, ak-pricing, ak-tier*, ak-toggle,
ak-blog(/-row), ak-cta*, ak-cta-form, ak-cta-lead, ak-footer*, ak-fill,
ak-h1, ak-h2, ak-page-head, ak-page-title, ak-page-lead, ak-stat-row,
ak-stat(-num/-lab), ak-ph, ak-ph-label, ak-ph-grad, ak-avatar, ak-note,
ak-link-underline, ak-flex-col-16, ak-section-pt-sm, ak-ic-mr-sm, ak-ic-ml-sm,
ak-sr-only (clip moderno), ak-hero-c, ak-hero-c-lead, ak-hero-c-cta,
ak-hero-c-stats, ak-scroll-cue, ak-term-band, ak-term-cap, ak-zz*,
ak-srv-list/-row/-idx/-arrow, ak-bloglist/-blrow(titles/-date/-rt),
ak-tcar(/-viewport/-track/-card*/-btn/-dot), ak-cta-lead, ak-cta .ak-display,
ak-tl2-*, ak-railwrap, ak-rail, ak-principles-3, ak-chipcloud,
ak-proj-bar, ak-order, ak-count, ak-proj-layout, ak-proj-side (-group-t),
ak-side-filters, ak-stack-layout, ak-stack-side,
ak-legend-row, ak-detail-h, ak-detail-row, ak-level, ak-layers,
ak-layer(-arrow), ak-skeleton (CANÓNICA: shimmer),
ak-skeleton-(title/lead/row/col/graph/panel/cal/channels/step/input/eyebrow),
ak-about-(hero/lead/cta/intro), ak-timeline, ak-tl-(dot.active|item|card|year|role|org|desc),
ak-stackgrid, ak-stackcat,
ak-cta-card-pt-sm, ak-mobile-nav, ak-burger,
[data-reveal][data-reveal-delay*] (anim `reveal`),
.ak-scroll-cue → anim `bob`, .ak-cursor → anim `blink`,
.ak-marquee-track → anim `marquee`, .ak-status-dot → anim `pulse-ring`,
.ak-tl-fade → anim `reveal`

@layer components ...

@keyframes blink      → @keyframes blink
@keyframes marquee     → @keyframes marquee
@keyframes pulse-ring  → @keyframes pulse-ring
@keyframes bob         → @keyframes bob
@keyframes pulse       → @keyframes pulse (genérico, movido aquí)
@keyframes reveal      → ya NO está aquí

(NO @keyframes rise, NO @keyframes skeleton-shimmer en este archivo)

/* El bloque `:where(a):is(...)` se mantiene AL INICIO de site.css (unlayered)
para ganar sobre `a { color }` unlayered de design-tokens.css. */
```

### 3.2 `_contact.css` — clases FUENTE DE VERDAD del formulario

```
ak-contact-grid, ak-form-card (radius-xl, padding: 28px 32px),
ak-steps(-step.on.done|-dot|-line), ak-progress(-bar), ak-field(-row),
ak-label, ak-input, .ak-input.err, ak-textarea, .ak-textarea.err,
ak-err-msg, ak-form-actions, ak-review(-row.lbl.val), ak-consent,
ak-cal, ak-cal-head, ak-cal-nav, ak-cal-sub, ak-cal-sub-top, ak-cal-dow,
ak-cal-grid, ak-cal-day(.av.sel),
ak-panel (padding: 22px — única definición del sistema, fuente de verdad), ak-side-group-t NO (movida a site.css),
ak-channels, ak-channel, ak-channel-ic,
ak-success, ak-success-ic,
ak-review-val
```

### 3.3 `_projects.css` — clases únicas de projects

```
ak-projects-page, ak-projects-sidebar(.open), ak-projects-main,
ak-projects-header, ak-header-top, ak-sidebar-header (-toggle, -close),
ak-filter-group, ak-filter-label, ak-filter-select, ak-filter-input,
ak-tag.on, ak-filter-actions, ak-btn-reset, ak-results-count,
ak-sidebar-overlay, ak-masonry-tile, ak-tile-link, ak-tile-media,
ak-tile-img, ak-tile-fallback, ak-tile-badge, ak-tile-meta,
ak-tile-idx, ak-tile-year, ak-tile-tags, ak-tile-metrics, ak-tile-metric,
ak-empty-icon, ak-empty-title, ak-empty-text
```

### 3.4 `_navbar.css`

```
ak-nav a.on (::after underline), ak-header-scrolled (blur)
```

### 3.5 `_services.css` — después del merge (RF10)

```
(contenido de `ServicesView.css` movido intacto;
cualquier colisión con `site.css` gana `site.css` por orden de @import)
```

---

## 4. ADR-001 — `:where(a):is(...)` (no eliminar)

### Contexto

`design-tokens.css` define `a { color: hsl(var(--text-link)) }` **unlayered**.
Tailwind v4 genera utilities unlayered (`.bg-primary`, `.text-on-primary`).
Sin preparación, cualquiera `<a>` con utility color gana porque su specificity
(0,1,0) > la de `a` (0,0,1).

### Decisión

`site.css:7-11` define:

```css
:where(a):is(.bg-primary, .bg-cta, .text-on-primary) {
  color: hsl(var(--text-on-primary));
}
:where(a):is(.bg-primary, .bg-cta, .text-on-primary):hover {
  color: hsl(var(--text-on-primary));
}
```

- `:where(...)` aporta specificity 0 en el selector `a`.
- `:is(...)` permite que la utility aplicada al elemento dispare el rule.
- Resultado: `<a class="bg-primary text-on-primary">` mostrará color `text-on-primary` (correcto), no `text-link` (incorrecto).

### Lista ampliada (post RF9 VERDICT)

Cobertura extendida para cerrar VISUAL-1:

```css
:where(a):is(
  /* ya existentes */
  .bg-primary, .bg-cta, .text-on-primary,
  /* nuevos — cubren ak-* que tiñen <a> con fondo o texto invertido */
  .bg-highlight, .bg-sunken,
  .ak-btn-primary, .ak-btn-secondary,
  .ak-tier-pro,
  .ak-toggle button.on,
  .ak-tag.on, .ak-chip.on,
  .ak-side-filters button.on,
  .ak-step.on .ak-step-dot
) {
  color: hsl(var(--text-on-primary));
}
:where(:is(<lista >):hover) {
  color: hsl(var(--text-on-primary));
}
```

### Prohibición

⚠️ **No eliminar este bloque.** Cualquier modificación pasa por extender `:is(...)` o por mover `a { color }` de `design-tokens.css` a `@layer base` (Plan B, no aplicado). Eliminarlo silenciosamente reintroduce VISUAL-1 a todos los CTA primary y CTAs de cards.

---

## 5. Hash de invariantes CSS

Cada invariante testeable tiene un `TU-X.Y` en `test-plan.md`. Hash de nombres de regla (canónicos):

| Regla                         | Archivo (post-F2)                               | Aparece en otros archivos (should be 0)                                            |
| ----------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `.ak-eyebrow`                 | `site.css` (UNIFICADA)                          | 0                                                                                  |
| `.ak-form-card`               | `_contact.css`                                  | 0                                                                                  |
| `.ak-field`                   | `_contact.css`                                  | 0                                                                                  |
| `.ak-label`                   | `_contact.css`                                  | 0 (cuidado con `.ak-cal-head .ak-label` que es subselector de `.ak-label`)         |
| `.ak-input`                   | `_contact.css`                                  | 0                                                                                  |
| `.ak-textarea`                | `_contact.css`                                  | 0                                                                                  |
| `.ak-panel`                   | `_contact.css` (padding: 22 — única definición) | 0 (cierre irreversible DUP-8; reintroducir en site.css dividiría el estado visual) |
| `.ak-side-group-t`            | `site.css`                                      | 0                                                                                  |
| `.ak-skeleton`                | `site.css` (shimmer)                            | 0                                                                                  |
| `.ak-progress`                | `_contact.css`                                  | 0                                                                                  |
| `.ak-progress-bar`            | `_contact.css`                                  | 0                                                                                  |
| `@keyframes rise`             | **ELIMINADO**                                   | 0                                                                                  |
| `@keyframes reveal`           | `design-tokens.css`                             | 0                                                                                  |
| `@keyframes blink`            | `site.css` (movido aquí)                        | 0                                                                                  |
| `@keyframes marquee`          | `site.css` (movido aquí)                        | 0                                                                                  |
| `@keyframes pulse-ring`       | `site.css` (movido aquí)                        | 0                                                                                  |
| `@keyframes pulse`            | `site.css` (movido aquí desde `_contact.css`)   | 0                                                                                  |
| `@keyframes skeleton-shimmer` | `site.css`                                      | 0                                                                                  |
| `@keyframes bob`              | `site.css`                                      | 0                                                                                  |

---

## 6. Variables de entorno

Sin nuevas variables. Esta spec no introduce secrets ni configuración runtime.

---

## 7. Nuevos archivos de código

| Archivo                                  | Tipo   | Contenido                               |
| ---------------------------------------- | ------ | --------------------------------------- |
| `tests/unit/design-system-audit.test.ts` | CREATE | TU-0.1.* Design.md reality asserts      |
| `tests/unit/css-invariants.test.ts`      | CREATE | TU-0.2.* CSS dup/hardcoding asserts     |
| `tests/unit/z-index-tokens.test.ts`      | CREATE | TU-0.3.* z-index scale asserts          |
| `tests/unit/header-height.test.ts`       | CREATE | TU-0.4.* header-height token asserts    |
| `scripts/audit-hardcoded-colors.mjs`     | EDIT   | TS-0.2 strengthened (hex + rgba + #fff) |
| `scripts/validate-tokens.mjs` (o `.sh`)  | EDIT   | TS-3.3 con puertas para nuevos tokens   |
| `tests/e2e/design-system-visual.spec.ts` | CREATE | TE-3.1 Playwright snapshots             |
| `specs/design-system-truth/spec.md`      | CREATE | este artefacto                          |
| `specs/design-system-truth/contract.md`  | CREATE | este artefacto                          |
| `specs/design-system-truth/scenarios.md` | CREATE | ver test-plan.md                        |
| `specs/design-system-truth/test-plan.md` | CREATE | ver test-plan.md                        |

Archivos editados: `docs/DESIGN.md`, `src/styles/design-tokens.css`,
`src/styles/site.css`, `src/styles/_contact.css`,
`src/styles/_services.css` (merge con ServicesView.css),
`src/app/globals.css`, `src/components/sections/services/ServicesView.css`
(será eliminado tras merge).

---

## 8. Migraciones

Sin migraciones. Esta spec no toca Prisma/DB.

## 9. Dependencias

**Next.js:** sin nuevas. Mantengo `vitest`, `@vitest/coverage-v8`, `playwright`,
`axe-core` ya en el repo.

**Sin** nuevas deps. El refactor CSS es atomización interna, no nuevas
librerías.
