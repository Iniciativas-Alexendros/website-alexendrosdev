# Spec: Design System Truth — correcciones factuales, deduplicación CSS y validación testeable

**Feature**: `design-system-truth`
**Estado**: planificación
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-23
**SHA auditado**: 5f8fd9b9911385e7a7b5e032e611c0705997481b
**Modelo orquestador**: ninguno fijo. El sistema recomendará dinámicamente un modelo al inicio de cada sesión (CommandCode taste-1 o Codebuff). El operador puede aceptarlo, cambiarlo o forzar uno concreto vía UI.

## Contexto y motivación

La auditoría previa (SHA `5f8fd9b`) revela que el documento `docs/DESIGN.md` contiene **errores factuales** (afirmaciones que el código desmiente), **duplicidades activas** en CSS, **hardcoding** no documentado, y **bugs visuales** en producción. La puntuación global actual real es **47/100** (no 60/100 como afirma el documento). Esta spec corrige la fuente de verdad y la hace defendible: cada afirmación de DESIGN.md debe ser verificable por un test automatizado. El informe detallado que motivó este análisis está disponible en git history (recuperable, no forma parte del árbol activo).

**Decisión de arquitectura irreversible:** `docs/DESIGN.md` deja de ser narrativa libre y pasa a ser **un documento testeable**. Toda afirmación es un contrato y todo contrato tiene un test que lo rompe si se incumple. Cero "❌" sin alternativa; cero score sin gate; cero clase sin token.

## Objetivo

Transformar el design system en una plataforma defendible:

1. **`docs/DESIGN.md` aligned with reality** — corregir los 4 errores factuales documentados en el informe, añadir la arquitectura real (mapa de archivos, criterio ak-* vs Tailwind, ADR del `:where(a):is`, tabla de keyframes, inventario de clases ak-*).
2. **CSS sin duplicidades activas** —Eliminar las 9 duplicaciones (DUP-1…DUP-9) y unificar las clases que viven en dos archivos con valores distintos.
3. **CSS sin hardcoding crítico** — Cerrar 7 hardcodings (HC-1…HC-7) con tokens.
4. **Bugs visuales cerrados** — Resolver 6 fallos (VISUAL-1…VISUAL-6).
5. **Suite de tests de regresión** — Crear `tests/unit/design-system-audit.test.ts` y `tests/unit/css-invariants.test.ts`, endurecer `scripts/audit-hardcoded-colors.mjs`. Toda regresión queda bloqueada en CI.

## Requerimientos funcionales

### RF1 — DESIGN.md refleja la realidad (P0 del informe)

Eliminar las siguientes afirmaciones erróneas y sustituirlas por contenido verificado contra código:

- **RF1.1** El bloque "❌ No hay tokens de z-index" en §1 _Token coverage_ se sustituye por una tabla de la scale `--z-*` (ver contract §1) con valores `--z-base: 1`, `--z-content: 10`, `--z-sticky: 40`, `--z-header: 50`, `--z-overlay: 60`, `--z-modal: 70`, `--z-tooltip: 80`.
- **RF1.2** El §2.6 _Tokens en @layer base_ se reescribe reconociendo que `design-tokens.css` **mezcla 5 responsabilidades** (tokens, dark, semantic defaults, keyframes, @theme) y que los defaults semánticos están **unlayered a propósito** para ganar contra utilities unlayered de Tailwind v4.
- **RF1.3** El §2.17 _RSC awareness_ se reescribe: `forwardRef` NO convierte automáticamente un componente en Client Component. Sólo el uso de hooks (`useState`/`useEffect`), event handlers, o APIs del navegador fuerza `"use client"`.
- **RF1.4** El resumen ejecutivo pasa de 60/100 a la distribución real: Token system 100%, Componentes UI 40%, ARIA/A11y 55%, Testing/QA 30%, **CSS Architecture 35%**, **Documentación 25%** (nuevas subdimensiones).

**AC asociados:** AC1, AC2, AC3, AC4.

### RF2 — Mapa de archivos CSS en DESIGN.md (P1)

`DESIGN.md` §6 incluye una tabla "Mapa de Archivos CSS" con todas las columnas: `archivo`, `@layer`, `vive en`, `importa`, `importa por`, `notas`. Las 6+ filas enumeradas son: `globals.css | n/a | src/app | tailwindcss+@source | nadie | entry point`, `design-tokens.css | unlayered | src/styles | nada | globals.css | tokens + dark + theme + semantic defaults + keyframes`, `site.css | @layer components | src/styles | nada | globals.css | ak-* base + organismos`, `_contact.css | @layer components | src/styles | nada | globals.css | form/calendar/channels`, `_navbar.css | @layer components | src/styles | nada | globals.css | mobile nav + scrolled`, `_projects.css | @layer components | src/styles | nada | globals.css | projects sidebar/masonry`, `_services.css | @layer components | src/styles | nada | globals.css | destino de ServicesView.css tras RF10.1`.

**AC asociado:** AC5.

### RF3 — Criterio ak-* vs Tailwind en DESIGN.md (P1)

`DESIGN.md` §7 incluye una tabla con la regla:

- **`ak-*` = estructura de organismos completos.** Sobrescribir sus mismas propiedades en JSX con Tailwind está prohibido (rompe cascade).
- **Tailwind utilities = variación atómica puntual** en JSX (offsets, anchos, animaciones, hover overrides).
- **Hack `:where(a):is(...)`** sólo cubre `<a>` con `.bg-primary`, `.bg-cta`, `.text-on-primary`. Botones-enlace con `ak-btn-secondary` no están en la lista y pueden presentar color de link en hover (deuda VISUAL-1, RF9).

Tabla con 3 ejemplos correctos y 3 incorrectos. `AC6`.

### RF4 — ADR `:where(a):is` documentado (P1)

`DESIGN.md` §8 incluye una ADR lightweight con causa + efecto + prohibición explícita sobre eliminar el bloque `:where(a):is(.bg-primary, .bg-cta, .text-on-primary) { color: hsl(var(--text-on-primary)); }` que vive en `src/styles/site.css:7-11`. Cualquier modificación pasa por extender `:is(...)`. Plan B (alternativa no aplicada): mover `a { color }` a `@layer base` para que utilities unlayered ganen por cascade.

**AC asociado:** AC7.

### RF5 — Tabla de keyframes canónicas (P1 + P3-DUP-6)

`DESIGN.md` §9 incluye:

| keyframe                      | archivo canónico                                              | usos                                         |
| ----------------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| `@keyframes blink`            | `site.css` (tras RF6.4)                                       | `.ak-cursor`                                 |
| `@keyframes marquee`          | `site.css`                                                    | `.ak-marquee-track`                          |
| `@keyframes pulse-ring`       | `site.css`                                                    | `.ak-status-dot` / `.ak-note .ak-status-dot` |
| `@keyframes reveal`           | `design-tokens.css` (canónica) + `--animate-reveal` en @theme | `.ak-tl-fade`                                |
| `@keyframes pulse`            | `site.css` (genérico, tras RF6.4)                             | `_contact.css` deja de redefinir             |
| `@keyframes skeleton-shimmer` | `site.css`                                                    | `.ak-skeleton` (canónica)                    |
| `@keyframes bob`              | `site.css`                                                    | `.ak-scroll-cue`                             |
| `@keyframes rise`             | **DEPRECATED** — eliminar                                     | migrar a `reveal`                            |

`AC8`.

### RF6 — Refactor arquitectónico de archivos CSS (P1 + P3-ARCH)

- **RF6.1** `globals.css` mantiene el orden `@import "tailwindcss" source(none); @source "../../src/**/*.{ts,tsx,js,jsx,css}"; @import design-tokens.css; @import site.css; @import _projects.css; @import _contact.css; @import _navbar.css; @import _services.css`. Ese orden se documenta en DESIGN.md §6.
- **RF6.2** Mover `@keyframes blink`, `marquee`, `pulse-ring` de `design-tokens.css` §4 → `site.css` (junto a sus consumidores `.ak-cursor`, `.ak-marquee-track`, `.ak-status-dot`).
- **RF6.3** `@keyframes reveal` permanece en `design-tokens.css` por su uso transversal y por estar expuesta como utility `--animate-reveal` en `@theme`.
- **RF6.4** Mover `@keyframes pulse` de `_contact.css` → `site.css`.
- **RF6.5** Eliminar `@keyframes rise` de `site.css:265` y migrar sus 4 usos a `@keyframes reveal` con `data-reveal-delay` ajustables.
- **RF6.6** `design-tokens.css` queda con 4 secciones (tokens + dark + semantic defaults + @theme). Sin keyframes. Sección §4 renombrada/comentada como para-futuro.

`AC9`.

### RF7 — Eliminar duplicaciones CSS (P3-DUP-1…DUP-9)

Cada DUP-* se cierra con una decisión única verificable:

- **DUP-1 (AC11)** `.ak-btn { gap: 6px }` declarado dos veces → mover `gap: 6px` al bloque base único `.ak-btn` (línea ~22 de `site.css`); eliminar la segunda declaración de la sección "Buttons with icons" (~línea 341).
- **DUP-2 (AC12)** `.ak-cta-form input { flex: 1 }` declarado dos veces consecutivamente → consolidar a una sola declaración (línea 151) con todo el bloque completo.
- **DUP-3 (AC13)** `.ak-eyebrow` definido dos veces (línea 90: `font-family + font-size + color`; línea 279: `letter-spacing: 0 + white-space: nowrap`) → unificar en línea 90 con todas las propiedades.
- **DUP-4 (AC14)** `.ak-form-card` en dos archivos con valores distintos → mantener sólo la versión de `_contact.css` (radius-xl, padding: 28px 32px). Eliminar de `site.css` (línea 585: radius-2xl, padding 40px, max-width 520px).
- **DUP-5 (AC15)** `.ak-field`, `.ak-label`, `.ak-input`, `.ak-textarea` en `site.css` (compactas) y `_contact.css` (expandidas con `:focus`, `.err`, `.dark`, transitions) → mantener sólo la versión de `_contact.css`. Eliminar las versiones de `site.css` (líneas 587-590). `_contact.css` es la **fuente de verdad** del formulario (documentado en §6).
- **DUP-6** `@keyframes rise` vs `reveal` → resuelto en RF6.5.
- **DUP-7 (AC17)** `.ak-skeleton` con dos implementaciones distintas (shimmer en `site.css:608` vs pulse en `_contact.css`) → **gana shimmer** (más estándar, gradient animado). Eliminar la versión pulse de `_contact.css`. Variantes (eyebrow/title/lead/col/row/graph/panel/cal/channels/step/input) permanecen en sus archivos respectivos sin sobrescribir la animación base.
- **DUP-8 (AC16)** `.ak-panel` con padding distinto (18px en `site.css:523`; 22px en `_contact.css`) → site.css mantiene `padding: 18px` como versión base (más antigua, más usada). Renombrar la versión de _contact.css a **`.ak-panel--md`** con `padding: 22px`. No se duplica la base.
- **DUP-9 (AC18)** `.ak-side-group-t` duplicado exacto → mantener sólo la versión de `site.css:485` y eliminar la de `_contact.css`.

`AC10, AC11, AC12, AC13, AC14, AC15, AC16, AC17, AC18`.

### RF8 — Cerrar hardcoding con tokens (P3-HC-1…HC-7)

- **HC-1 (AC19)** `.ak-tile-stat` y `.ak-tile-stat b` en `site.css:236-237` usan `color: #fff` → reemplazar por `color: hsl(var(--text-on-primary))`.
- **HC-2 (AC20)** `padding: 0 32px` repetido ~6 veces → añadir `--container-px: 32px` a `design-tokens.css` §1 (después de `--container-max`). Reemplazar todas las ocurrencias por `padding-inline: var(--container-px)` en: `.ak-container`, `.ak-header-inner`, `.ak-footer-cols`, `.ak-footer-bottom`, `.ak-container-inner`, `.ak-cta` y otros.
- **HC-3 (AC21, AC21b)** `height: 64px` no usa scale → añadir `--header-height: 64px` a `design-tokens.css` §1. `.ak-header-inner` (línea 41) usa `height: var(--header-height)`. Calcular `top: var(--header-height)` en todos los sticky (`.ak-projects-sidebar top: 88px` → `top: calc(var(--header-height) + 24px)` — AC21b; `.ak-proj-side top: 88px` → mismo cálculo; `.ak-pcard-star z-index` verificación).
- **HC-4 (AC22)** `font: 700 30px …` en `.ak-tier-price` (línea 124) → añadir `--fs-price: 1.875rem` a design-tokens.css §1 (justificado: ancla de pricing, semánticamente distinto a títulos). `.ak-tier-price` usa `font: 700 var(--fs-price) var(--font-sans)`.
- **HC-5 (AC23)** `font: 700 26px …` en `.ak-zz-idx b` → mapear a `var(--fs-h2)` (que va de 1.5rem @mobile a 2.25rem @desktop, aceptable para el destacado de índice). `font: 700 22px …` en `.ak-zz-metric b` → añadir `--fs-metric: 1.375rem` (22px, justificado: distinto a h4).
- **HC-6 (AC24)** `gap: 28px` huérfano (escala va 24→32). Insertar `--gutter-md: 28px` en `design-tokens.css` §1. Usos en `.ak-header-inner` y `.ak-stackgrid` (línea 209) → `gap: var(--gutter-md)`.
- **HC-7 (AC25)** `.ak-sr-only` con `left: -9999px` → migrar al patrón clip moderno:

```css
.ak-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

`AC19, AC20, AC21, AC21b, AC22, AC23, AC24, AC25`.

### RF9 — Cerrar bugs visuales activos (P3-VISUAL-1…VISUAL-6)

- **VISUAL-1 (AC26, AC27)** `<a>` con `ak-btn-secondary` u otras variantes no cubiertas por `:where(a):is(.bg-primary, .bg-cta, .text-on-primary)` puede mostrar color de link en hover → **decisión por defecto: ampliar la lista `:is(...)`** con las clases que también tiñen enlaces: añadir `.bg-highlight`, `.bg-sunken`, `.ak-tier-pro`, `.ak-btn-primary`, `.ak-btn-secondary`, `.ak-toggle button.on`, `.ak-tag.on`, `.ak-chip.on`, `.ak-side-filters button.on`, `.ak-step.on .ak-step-dot` — AC26. El ADR §8 documenta el camino alternativo (mover `a` a `@layer base`). El e2e hover test es AC27.
- **VISUAL-2 (AC28)** `.ak-form-card` con valores de padding/radius incorrectos fuera de /contacto → resuelto por RF7 DUP-4: la única versión válida vive en `_contact.css`.
- **VISUAL-3 (AC29)** `.ak-skeleton` con dos comportamientos shimmer vs pulse → resuelto por RF7 DUP-7: shimmer canónico.
- **VISUAL-4 (AC30)** Imágenes picsum sin width/height explícitos en Next.js `Image` → documentar en DESIGN.md §14. El operador proporciona esos attrs en cada `<Image>` que use placeholder URL.
- **VISUAL-5** `.ak-eyebrow` segunda definición silencia letter-spacing → resuelto por RF7 DUP-3 al unificar.
- **VISUAL-6 (AC31)** `.ak-tl-dot.active { left: -30px }` vs base `left: -29px` → alinear `.ak-tl-dot.active { left: -29px; width: 12px; height: 12px; … }`. Eliminar micro-desalineación de 1px.

`AC26, AC27, AC28, AC29, AC30, AC31`.

### RF10 — Convención arquitectónica CSS (P3-ARCH-5)

- **RF10.1** Mover `src/components/sections/services/ServicesView.css` → `src/styles/_services.css` (que existe vacío con 17 bytes). Mezclar contenido si el archivo destino tenía reglas únicas.
- **RF10.2** Actualizar `src/app/globals.css` import: eliminar `@import "../components/sections/services/ServicesView.css"`, añadir `@import "../styles/_services.css"` antes de `_contact.css` y `_navbar.css`.
- **RF10.3** Validar que ningún componente importa el CSS directamente (búsqueda `import "./ServicesView.css"` → 0).

`AC32`.

### RF11 — Tests de regresión validadores (P0)

- **RF11.1 (AC33)** Crear `tests/unit/design-system-audit.test.ts` con asserts `TU-0.1.a…e` que verifican la corrección de DESIGN.md.
- **RF11.2 (AC34)** Crear `tests/unit/css-invariants.test.ts` (o ampliar `tests/unit/content-invariants.test.ts`) con asserts `TU-0.2.a…g` que verifican invariantes CSS (no duplicados, no hardcoding, etc.).
- **RF11.3 (AC35)** Crear `tests/unit/z-index-tokens.test.ts` con asserts `TU-0.3.a`.
- **RF11.4 (AC36)** Crear `tests/unit/header-height.test.ts` con asserts `TU-0.4.a`.
- **RF11.5 (AC37)** Endurecer `scripts/audit-hardcoded-colors.mjs`: detecta `#fff` literal, hex crudo de 3/6/8 dígitos, `rgb(`/`rgba(` fuera de transparente. Salida JSON. Exit 1 si >0 hits.
- **RF11.6 (AC38)** Extender `scripts/validate-tokens.mjs` o `scripts/validate-tokens.sh` con puertas para `--z-*`, `--header-height`, `--container-px`, `--gutter-md`.

`AC33, AC34, AC35, AC36, AC37, AC38, AC40, AC41, AC42, AC43, AC44`.

### RF12 — Inventario completo de clases ak-* (P2)

`DESIGN.md` §10 incluye la tabla de inventario con 6+ categorías:

| Categoría           | Clases                                                                                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout Patterns     | `.ak-zz*, .ak-zz-row(rev), .ak-tl2-*, .ak-railwrap, .ak-rail, .ak-stack-layout, .ak-stack-side, .ak-proj-layout, .ak-proj-side, .ak-proj-bar, .ak-contact-grid`                                                                                 |
| Graph / Interactive | `.ak-graph(-inner\|-svg), .ak-node(-center\|-cat\|-leaf\.dim\.sel), .ak-edge(.hot), .ak-graph-controls, .ak-dotgrid, .ak-legend*, .ak-detail-row, .ak-level`                                                                                    |
| Content             | `.ak-srv-list\|-row\|-idx\|-arrow, .ak-bloglist/.ak-blrow*, .ak-tcar(/-track\|-card\|-btn\|-dot), .ak-featured*(-body), .ak-zz-metrics\|-metric(.acc), .ak-layer\|-s\|-arrow`                                                                   |
| Form System         | `.ak-steps\|-step(.on\|-done)\|-dot\|-line, .ak-progress\|-bar, .ak-review\|-row(.lbl/.val), .ak-consent, .ak-field\|-row, .ak-err-msg, .ak-form-actions, .ak-cal(-head\|-nav\|-sub\|-dow\|-grid\|-day(.av\.sel)), .ak-channels\|-channel\|-ic` |
| Skeleton            | `.ak-skeleton (canónica shimmer), -eyebrow\|-title\|-lead\|-row\|-col\|-graph\|-panel\|-cal\|-channels\|-step\|-input`                                                                                                                          |
| States              | `.ak-node.dim\.sel, .ak-step.on\.done, .ak-cal-day.av\.sel, .ak-tl-dot.active, .ak-tl2-card.now, .dark .ak-*` (inventario completo)                                                                                                             |

`AC39, AC39a, AC39b, AC39c`.

## Criterios de aceptación

| ID    | Criterio                                                                                                                                                                                                                                                                                                                   | Vinculado a               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| AC1   | `docs/DESIGN.md` §1 incluye tabla de 7 `--z-*` tokens                                                                                                                                                                                                                                                                      | RF1.1, RF11.1 TU-0.1.a    |
| AC2   | `docs/DESIGN.md` §1 incluye subsección "Z-index scale" sin ❌                                                                                                                                                                                                                                                              | RF1.1                     |
| AC3   | `docs/DESIGN.md` §2.6 no contiene "como ausente" ni "@layer base falta"                                                                                                                                                                                                                                                    | RF1.2                     |
| AC4   | `docs/DESIGN.md` §2.17 contiene "forwardRef NO convierte automáticamente"                                                                                                                                                                                                                                                  | RF1.3                     |
| AC5   | `docs/DESIGN.md` §6 incluye tabla de 6+ filas de archivos CSS con @layer                                                                                                                                                                                                                                                   | RF2 RF11.1 TU-0.1.d       |
| AC6   | `docs/DESIGN.md` §7 incluye regla ak-* vs Tailwind con ejemplos correctos/incorrectos                                                                                                                                                                                                                                      | RF3                       |
| AC7   | `docs/DESIGN.md` §8 incluye ADR del `:where(a):is` con prohibición explícita                                                                                                                                                                                                                                               | RF4 RF11.1 TU-0.1.e       |
| AC8   | `docs/DESIGN.md` §9 incluye tabla de 7+ keyframes con archivos canónicos y `rise` marcada DEPRECATED                                                                                                                                                                                                                       | RF5                       |
| AC9   | `grep '@keyframes rise' src/styles/**/*.css` → 0 ocurrencias (TU-0.2.a)                                                                                                                                                                                                                                                    | RF6.5                     |
| AC10  | `grep '@keyframes reveal' src/styles/**/*.css` ≥ 1 (TU-0.2.b)                                                                                                                                                                                                                                                              | RF6.3                     |
| AC11  | `grep '\.ak-btn { gap: 6px }' src/styles/site.css` ≤ 1 (consolidado al bloque base)                                                                                                                                                                                                                                        | RF7 DUP-1                 |
| AC12  | `grep 'ak-cta-form input { flex: 1 }' src/styles/site.css` ≤ 1                                                                                                                                                                                                                                                             | RF7 DUP-2                 |
| AC13  | `grep '^\.ak-eyebrow' src/styles/site.css` = 1                                                                                                                                                                                                                                                                             | RF7 DUP-3                 |
| AC14  | `grep '^\.ak-form-card' src/styles/` = 1                                                                                                                                                                                                                                                                                   | RF7 DUP-4                 |
| AC15  | `grep -l '^\.ak-field\|^\.ak-label\|^\.ak-input\|^\.ak-textarea' src/styles/*.css` = 1 archivo (sólo `_contact.css`)                                                                                                                                                                                                       | RF7 DUP-5                 |
| AC16  | `grep '^\.ak-panel' src/styles/*.css` = 1 archivo base + 1 modificador `--md`                                                                                                                                                                                                                                              | RF7 DUP-8                 |
| AC17  | `grep '^\.ak-skeleton {' src/styles/*.css` = 1                                                                                                                                                                                                                                                                             | RF7 DUP-7                 |
| AC18  | `grep '^\.ak-side-group-t' src/styles/*.css` = 1                                                                                                                                                                                                                                                                           | RF7 DUP-9                 |
| AC19  | `grep 'color: #fff' src/styles/site.css` = 0                                                                                                                                                                                                                                                                               | RF8 HC-1, RF11.5          |
| AC20  | `grep 'padding: 0 32px' src/styles/site.css` ≤ 1 (Documentar fallback acceptable o 0)                                                                                                                                                                                                                                      | RF8 HC-2                  |
| AC21  | `grep 'height: 64px\|64px' src/styles/site.css` usa `var(--header-height)`                                                                                                                                                                                                                                                 | RF8 HC-3                  |
| AC21b | `grep 'top: 88px\|top: 90px\|top: 64px' src/styles/*.css` → 0 ocurrencias literales en sticky-affordances. Las sticky-tops usan `calc(var(--header-height) + N)` o `var(--header-height)` directamente. Cubre `.ak-projects-sidebar`, `.ak-proj-side`, `.ak-rail`, y nuevas sticky-positions.                              | RF8 HC-3 sticky anchor    |
| AC22  | `grep '\.ak-tier-price' src/styles/site.css` referencia `var(--fs-price)`                                                                                                                                                                                                                                                  | RF8 HC-4                  |
| AC23  | `grep '\.ak-zz-idx b\|\.ak-zz-metric b' src/styles/site.css` usan tokens                                                                                                                                                                                                                                                   | RF8 HC-5                  |
| AC24  | `grep 'gap: 28px' src/styles/site.css` = 0 (sólo `var(--gutter-md)`)                                                                                                                                                                                                                                                       | RF8 HC-6                  |
| AC25  | `grep 'left: -9999px' src/styles/site.css` = 0. `.ak-sr-only` usa clip moderno                                                                                                                                                                                                                                             | RF8 HC-7                  |
| AC26  | `:where(a):is(...)` cubre ≥ 11 clases (incluyendo `.ak-btn-primary                                                                                                                                                                                                                                                         | .ak-btn-secondary         | .bg-sunken | .bg-highlight | .ak-tier-pro | .ak-tag.on | .ak-chip.on | .ak-side-filters button.on | .ak-step.on .ak-step-dot | .ak-toggle button.on`) | RF9 VISUAL-1 |
| AC27  | E2E: hover sobre `<a class="ak-btn-primary">` en /contacto muda texto a `text-on-primary`, NO a `text-link`                                                                                                                                                                                                                | RF9 VISUAL-1              |
| AC28  | `.ak-form-card` aparece en 1 sólo archivo (`_contact.css`) con radius-xl + padding 28px 32px                                                                                                                                                                                                                               | RF9 VISUAL-2              |
| AC29  | `.ak-skeleton` muestra shimmer (animation-name === 'skeleton-shimmer'), no pulse                                                                                                                                                                                                                                           | RF9 VISUAL-3              |
| AC30  | `docs/DESIGN.md` §14 documenta convención: imágenes placeholder requieren `width`/`height` explícitos                                                                                                                                                                                                                      | RF9 VISUAL-4              |
| AC31  | `.ak-tl-dot.active` y `.ak-tl-dot` tienen misma `left` (offset 0px en e2e)                                                                                                                                                                                                                                                 | RF9 VISUAL-6              |
| AC32  | `grep 'ServicesView.css' src/app/globals.css` = 0 (sin import directo). `grep '_services.css' src/app/globals.css` ≥ 1 (nuevo import)                                                                                                                                                                                      | RF10                      |
| AC33  | `tests/unit/design-system-audit.test.ts` existe y ≥5 asserts verdes                                                                                                                                                                                                                                                        | RF11.1                    |
| AC34  | `tests/unit/css-invariants.test.ts` (o ampliado) existe y ≥7 asserts verdes                                                                                                                                                                                                                                                | RF11.2                    |
| AC35  | `tests/unit/z-index-tokens.test.ts` existe y assert verde                                                                                                                                                                                                                                                                  | RF11.3                    |
| AC36  | `tests/unit/header-height.test.ts` existe y assert verde                                                                                                                                                                                                                                                                   | RF11.4                    |
| AC37  | `pnpm audit:hardcoded-colors` exit 0 al cierre                                                                                                                                                                                                                                                                             | RF11.5                    |
| AC38  | `pnpm validate-tokens` exit 0 con puertas `--z-* + --header-height + --container-px + --gutter-md`                                                                                                                                                                                                                         | RF11.6                    |
| AC39  | `docs/DESIGN.md` §10 incluye tabla de inventario de 6 categorías con ≥ 30 clases                                                                                                                                                                                                                                           | RF12                      |
| AC39a | Categoría "Layout Patterns" incluye ≥ 8 clases (ak-zz-row, ak-zz-row.rev, ak-railwrap, ak-rail, ak-stack-layout, ak-stack-side, ak-proj-layout, ak-proj-side, ak-proj-bar, ak-contact-grid)                                                                                                                                | RF12 substantive coverage |
| AC39b | Categoría "Graph" incluye ≥ 7 clases (ak-graph(-inner/-svg), ak-node(-center/-cat/-leaf/.dim/.sel), ak-edge(.hot), ak-graph-controls, ak-dotgrid)                                                                                                                                                                          | RF12 substantive coverage |
| AC39c | Categoría "Form System" incluye ≥ 15 clases (ak-steps(-step.on/-done/-dot/-line), ak-progress/-bar, ak-review/-row(.lbl/.val), ak-consent, ak-field/-row, ak-err-msg, ak-cal(-dow/-grid/-day(.av/.sel)))                                                                                                                   | RF12 substantive coverage |
| AC40  | `pnpm lint` exit 0                                                                                                                                                                                                                                                                                                         | RF11 gate                 |
| AC41  | `pnpm typecheck` exit 0                                                                                                                                                                                                                                                                                                    | RF11 gate                 |
| AC42  | `pnpm build` exit 0, 32 rutas compilan                                                                                                                                                                                                                                                                                     | RF11 gate                 |
| AC43  | `pnpm test:coverage` 4 gates verdes (stmts≥85, brchs≥80, funcs≥85, lines≥85)                                                                                                                                                                                                                                               | RF11 gate                 |
| AC44  | Puntuación resumen ejecutivo: Token system 100%, Componentes UI ≥85%, ARIA ≥70%, Testing ≥75%, CSS Architecture ≥90%, Documentación ≥90%. Verificación: el script `scripts/audit-scoreboard.mjs` (crear si no existe) lee DESIGN.md, parsea la tabla resumen, assert cada uno de los 6 thresholds. Exit 1 si alguno falla. | RF11 global lock-in       |

## Restricciones

- Next.js 16.2.6, TS estricto, React 19, pnpm 11.5.2.
- Cero cambios breaking de CSS que afecten a producción sin pasar por AC27-29-31.
- Todos los archivos CSS se siguen importado a través de `globals.css` (single entry).
- Ningún wildcard o utility globalmente; todos los cambios de CSS se hacen dentro de `@layer components { ... }` en su archivo correspondiente.
- Los tests de invariantes CSS no son sensibles a reformateo (cuentan por nombre-canónico de regla, no por número de línea).

## No-objetivos

- No se añade `cva` (Class Variance Authority) — fuera de scope. Los tests detectan que `Button.tsx` sigue con `variantStyles` manual; el ADR es una nota, no un re-arquitectura.
- No se introduce Container Queries, CSS Nesting ni i18n/RTL — fuera de scope del informe.
- No se migra de Bootstrap/Tailwind a puro CSS-in-JS. El stack se mantiene.
- Cambios al comportamiento de Server/Client Component boundary — fuera de scope; sólo se corrige §2.17 de DESIGN.md.
- Modificar componentes React o lógica de negocio — esta spec sólo toca CSS y docs.
- Reescribir el design system desde cero (atomic design, design tokens DTCG con generación automática desde Figma) — fuera de scope.

---

## Orquestación con el modelo recomendado

### Instrucciones para el modelo orquestador

El modelo que el sistema recomiende al inicio de la sesión actúa como **orquestador principal** de esta feature.

- **Contexto largo**: cargar en este orden: este `spec.md`, `contract.md`, `scenarios.md`, `test-plan.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `AGENTS.md`, `~/.knowledge.md`.
- **Optimizado para**: refactor quirúrgico, lectura de CSS, mantener gates. Taste-1 alineado con código existente (CSS-in-CSS, vitest, scripts Bash).
- **Prompt caching**: los 4 artifacts + DESIGN.md son estáticos durante toda la ejecución.
- **Trazabilidad**: cada cambio debe tener commit convencional con scope `css(design-system)`, `docs(design)`, `chore(test)`.

### Plan de ejecución orquestada (DAG de dependencias)

```
FASE 0 ───────────────────────────────────────────────────────┐
│ Tests validadores (RF11.1—RF11.6)                            │
│ Dependencias: ninguna                                        │
│ Salida: tests rojos como RED (detectan estado pre-refactor) │
│ Worktree: wt/design-system-truth-f0                          │
└─────────────────────────────┬────────────────────────────────┘
                              ▼
FASE 1 ───────────────────────────────────────────────────────┐
│ DESIGN.md corregido (RF1—RF5, RF12)                          │
│ Dependencias: ninguna (correcciones factuales)               │
│ Salida: tests TU-0.1.* verdes (REALITY vs. DOC)              │
│ Worktree: wt/design-system-truth-f1                          │
│ NOTA: Puede correr en paralelo con F0 — afecta docs, no CSS │
└─────────────────────────────┬────────────────────────────────┘
                              ▼
FASE 2 ───────────────────────────────────────────────────────┐
│ Refactor CSS (RF6 + RF7 + RF8 + RF9.1-9.4 + RF10)            │
│ Dependencias: F0 sólo sirve como farol — implementación      │
│              sin tests puede romper F0.green                  │
│ Salida: TU-0.2.* verdes + AC9-29 verdes                      │
│ Worktree: wt/design-system-truth-f2                          │
└─────────────────────────────┬────────────────────────────────┘
                              ▼
FASE 3 ───────────────────────────────────────────────────────┐
│ Tests visuales y regresión (RF11.7 nuevos + e2e snapshots)   │
│ Dependencias: F2 verde                                       │
│ Salida: snapshots Playwright alineados; axe-core sin críticos│
│ Worktree: wt/design-system-truth-f3                          │
└─────────────────────────────┬────────────────────────────────┘
                              ▼
FASE 4 ───────────────────────────────────────────────────────┐
│ Gates finales + score                                       │
│ Dependencias: F0 + F1 + F2 + F3 todas verdes                 │
│ Salida: tu tipo AC40-44; cobertura ≥85; lint/typecheck OK   │
│ Worktree: wt/design-system-truth-f4 (merge final a main)     │
└─────────────────────────────────────────────────────────────┘
```

### Reglas de orquestación para el modelo recomendado

1. **Worktrees paralelos**: F0 y F1 se ejecutan en worktrees independientes porque no comparten archivos críticos. F2 se ejecuta sola porque modifica archivos que F0 testea.
2. **Gate por fase**: cada fase tiene un criterio de salida explícito (tests verdes). No se avanza sin verificar.
3. **Delegación por especialidad**:
   - F0: `general` (Crea tests rojos).
   - F1: `general` (rewrites de docs); `review` verifica consistencia del texto.
   - F2: `general` (refactor CSS); `review` verifica diff; **doble check** antes de merge: ejecutar `pnpm test:coverage` + `pnpm build` + `pnpm audit:hardcoded-colors`.
   - F3: `general` para snapshots; `perf-optimizer` para axe-core.
   - F4: `review` para validar todas las AC del contract.md.
4. **Presupuesto de tokens**: los 4 artifacts del spec (~1500 líneas estimadas) consumen ~18k tokens; DESIGN.md (~500 líneas) ~6k; CSS files (~700 líneas) ~8k. Total contexto base: ~32k tokens. Sobra margen amplio.
5. **Lock-in progresivo**: tras cada fase mergeada a main, ajustar `vitest.config.ts` coverage thresholds para reflejar baseline nuevo.
6. **Anti-regresión**: antes de mergear cualquier fase, ejecutar `pnpm test:coverage` + `pnpm lint` + `pnpm typecheck` + `pnpm audit:hardcoded-colors`. Bloquear merge si rojo.
7. **Prompt de arranque** para el modelo recomendado:

```
Cargá spec.md, contract.md, scenarios.md y test-plan.md de
specs/design-system-truth/. Vas a orquestar la fase [N] según el DAG.
Antes:
- Verificá que las dependencias de la fase estén completadas.
- Si requiere worktree, usá agente worktree desde main a wt/design-system-truth-f[N].
- Ejecutá los tests de la fase según test-plan.md → deben fallar (RED).
- Implementá el código mínimo → deben pasar (GREEN).
- Refactorizá manteniendo GREEN.
- Pasá gates completos (`pnpm test:coverage && pnpm lint && pnpm typecheck && pnpm build && pnpm audit:hardcoded-colors`).
- Si todo verde, mergeá a main y actualizá resumen ejecutivo de DESIGN.md.
- Reportá: AC validados, diff resumen, siguiente fase.
```
