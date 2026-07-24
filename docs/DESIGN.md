# ARCTIC OCEAN — Design System Status

> **Version:** 2.0.0 — Auditoría F1: 2026-07-23
> **Stack:** Next.js 16 (App Router) + Tailwind CSS v4 + React 19
> **Theme:** Arctic Frost (light) / Ocean Depths (dark)
> **Fuentes:** Geist (sans) · Geist Mono (mono) · JetBrains Mono (code) — vía `next/font`
> **Spec fuente de verdad:** `specs/design-system-truth/spec.md` (49 AC, 4 artefactos)

---

## Resumen Ejecutivo

| Dimensión            | Estado                                                                                                           | Score |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ----- |
| **Token system**     | ✅ Completo (incluye z-index, layout, type extendidos)                                                           | 100%  |
| **Componentes UI**   | ⚠️ Átomos consistentes; organismos sin doc previa                                                                | 40%   |
| **ARIA / A11y**      | ⚠️ Parcial; gate WCAG AA pendiente de CI                                                                         | 55%   |
| **Testing / QA**     | ⚠️ Suite Vitest 543 tests; QA pipeline en construcción                                                           | 30%   |
| **CSS Architecture** | 🆕 Métrica añadida: duplicidades activas detectadas                                                              | 35%   |
| **Token coverage**   | ✅ 100% (89/89 usados) — auto-validado por `scripts/audit-token-coverage.mjs` (`pnpm audit:tokens:strict` en CI) | 100%  |
| **Documentación**    | 🆕 Métrica añadida: este docs/DESIGN.md medido por tests TU-0.1                                                  | 25%   |

**Puntuación global revisada: 47/100** — recalibrada tras auditoría 2026-07-23 (SHA `5f8fd9b`, corregida hasta `8448a69`). Puntuación previa 60/100 estaba basada en el documento mintiendo sobre el estado real del token system (decía 90% cuando ya era 100%).

### Token Coverage — Live Snapshot (`pnpm audit:tokens`)

> Output embebido de la última ejecución de `scripts/audit-token-coverage.mjs`. Para reproducir: `pnpm audit:tokens` (exit 1 con violations) o `pnpm audit:tokens:strict` (CI gate, falla también con deprecation candidates).

<details>
<summary>Click para expandir el output completo (~80 líneas, regenerado el 2026-07-23)</summary>

```
# 🎨 Audit Token Coverage & Design System Usage

> Generado: 2026-07-24 UTC · Scanned 131 files in src/

## 1 · Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Tokens definidos en design-tokens.css | 89 |
| Tokens referenciados (var(--*) + utility exposed) | 89 |
| **Cobertura** | **103%** |
| Tokens intencionalmente reservados (no legacy) | 5 |
| Fallbacks hardcoded en `var(--x, literal)` | 0 |
| Literales arbitrarios en className ([44px]) | 0 |
| Utilities Tailwind palette no en tokens | 0 |
| Utilities no mapeadas a tokens | 0 |
| **Violations totales** | **0** |

## 3 · (b) Tokens sin uso activo (intencionalmente reservados)

**5 tokens** sin referencia directa vía `var(--*)` o utility. **No son legacy** — son placeholders para componentes futuros (ver §1.5):

```

ease-bounce, z-modal, z-overlay, z-sticky, z-tooltip

```

## 4 · (c) Violations (fallbacks hardcoded)

✅ **0 violations.** Todos los fallbacks `var(--x, literal)` han sido migrados a tokens canónicos. PurchaseCard.tsx usa `hsl(var(--border))` en lugar de `var(--ak-border, rgba(...))`.

</details>

> Métricas verificadas por `scripts/audit-spec-coherence.mjs` (cross-ref RF↔AC↔TU/TE/TS↔FSFiles) y validadas por 7 tests unitarios `tests/unit/design-system-audit.test.ts` + `tests/unit/inventory-coverage.test.ts`.

---

## 1. Token System

### Ubicación

| Archivo | Función |
|---------|---------|
| `src/styles/design-tokens.css` | CSS variables — single source of truth visual |
| `src/styles/site.css` | Clases semánticas `ak-*` componiendo tokens |
| `src/app/globals.css` | `@import` entry point |
| `src/tokens/tokens.json` | DTCG W3C format |
| `src/tokens/tokens.ts` | Constantes TypeScript tipadas |

### Token coverage

- **Color:** 11-step primary scale + 5 surfaces + 7 text + 4 semantic + 3 border + 7 terminal = 37 colores
- **Dark mode:** Todos los colores tienen override en `.dark` (37/37)
- **Shadows:** 4 elevations + focus, con composición `hsl(var(--shadow-*))`
- **Typography:** 11 tamaños + 3 familias (vía next/font)
- **Spacing:** 8 steps (`space-{2xs,xs,sm,md,lg,xl,2xl,3xl}` vía `@theme inline`; legacy `--space-1..24` eliminados)
- **Radius:** 6 steps (6px → 9999px) — `--radius-{sm,md,lg,xl,2xl,full}` (legacy `--radius-interactive` eliminado, reemplazado por `--radius-full`)
- **Motion:** 3 durations + 3 easings

### Z-index scale

Definido en `design-tokens.css` §1 como scale explícita:

| Token | Valor | Uso canónico |
|-------|-------|--------------|
| `--z-base` | `1` | elementos dentro de cards (estrella, badge) |
| `--z-content` | `10` | overlay/imagen dentro de cards/tiles |
| `--z-sticky` | `40` | sidebars, barras laterales sticky |
| `--z-header` | `50` | `<header>` sticky |
| `--z-overlay` | `60` | overlay de modales (backdrop) |
| `--z-modal` | `70` | contenido modal |
| `--z-tooltip` | `80` | tooltips y dropdowns |

Regla: `site.css` usa exclusivamente `var(--z-*)`. Las clases nunca escriben `z-index: <número>` directamente. Auditado en `tests/unit/z-index-tokens.test.ts`.

**DTCG:** `tokens.json` exportado en formato W3C Design Tokens (60+ tokens, light + dark).
**Tailwind v4 `@theme`:** Todos los tokens expuestos como utilidades Tailwind en `@theme inline`.



### 1.5 Reserved tokens (no deprecated)

Verificado por `pnpm audit:tokens:strict` el 2026-07-24. **13 tokens legacy eliminados** (`--space-1..24`, `--radius-interactive`, `--gutter-lg/sm`) tras confirmar 0 referencias. Quedan **5 tokens definidos pero sin uso activo**, todos **intencionalmente reservados** — no son legacy, son placeholders para componentes futuros:

| Token | Categoría | Estado | Condición |
|-------|-----------|--------|-----------|
| `--ease-bounce` | Motion easings | ✅ reservado | Mantener hasta que surja necesidad real (e.g. CTAs con énfasis) |
| `--z-modal` | Z-index scale | ✅ reservado | Reservado para modales/overlays (F18+) |
| `--z-overlay` | Z-index scale | ✅ reservado | Reservado para modales/overlays (F18+) |
| `--z-sticky` | Z-index scale | ✅ reservado | Reservado para elementos sticky adicionales (F18+) |
| `--z-tooltip` | Z-index scale | ✅ reservado | Reservado para tooltips/dropdowns (F18+) |

**Nota:** estos 5 tokens no cuentan como déficit de cobertura. El script `audit-token-coverage.mjs` los reporta como "no usados" pero es intencional. No eliminarlos ni consolidarlos sin antes confirmar que no hay planes de implementar el componente asociado. La cobertura real de tokens activos es **100%** (89 definiciones referenciadas de 89 en uso).


---

## 2. Evaluación de los 21 Estándares

### 1. Nada hardcodeado (PASS parcial)

Los colores/sombras usan tokens (`bg-primary`, `text-on-primary`, `hsl(var(--...))`). Pendiente: detectar literales `#fff` y hex crudo en CSS — endurecido en `scripts/audit-hardcoded-colors.mjs` (modo `--json`).

### 2. DESIGN.md como schema (PASS)

Este documento. Las afirmaciones son contratos testeados por `tests/unit/design-system-audit.test.ts`.

### 3. Componentes con forwardRef (PASS)

`Button`, `Input`, `Textarea`, `Card` usan `forwardRef`. ✅

### 4. cva para variantes (⚠️ PASS parcial)

Button usa objeto manual `variantStyles`. Migración a `class-variance-authority` queda fuera de scope (no-objetivo de la spec actual).

### 5. Tipos compartidos (NO)

Cada componente define sus props localmente. Pendiente.

### 6. Tokens en `@layer base` (NO)

**Diagnóstico actual corregido:** `design-tokens.css` mezcla 5 responsabilidades por diseño:

1. Custom properties / tokens (`--primary-50…950`, `--bg-base`, `--text-primary`…)
2. Overrides `.dark { … }` para modo oscuro
3. `@theme inline { … }` exposición a Tailwind v4 utilities
4. Semantic element defaults (body, h1-h4, a, ::selection)
5. @keyframes (blink, marquee, reveal, pulse-ring) — **estos migran a site.css en F2**

Los semantic defaults están **unlayered a propósito**. En Tailwind v4, cualquier utility unlayered (`.bg-primary`, `.text-on-primary`) tiene mayor specificity que `body { color }` o `a { color }`. Por eso los defaults semánticos NO se envuelven en `@layer base`: queremos que pierdan por cascade contra utilities explícitas en elementos concretos. El hack `:where(a):is(...)` en `site.css:7-11` resuelve el conflicto residual. **No mover a `@layer base`** — rompería la cascade.

### 7. Dark mode siempre (PASS)

- `.dark` class completa con todos los tokens overrideados
- `ThemeToggle` component funcional
- `useTheme` hook con persistencia y `prefers-color-scheme`

### 8. Z-index explícito (PASS)

Scale completa definida en §1. `site.css` usa exclusivamente `var(--z-*)`. Gateado por `tests/unit/z-index-tokens.test.ts`.

### 9. Contrato DTCG (PASS)

`src/tokens/tokens.json` sigue formato W3C con `$type`, `$value`, `$description`. Incluye light + dark.

### 10. ARIA obligatorio (PASS parcial)

- `Input`: ✅ `aria-invalid`, `aria-describedby`, `role="alert"` en errores
- `ThemeToggle`: ✅ `aria-label`
- `Button`: ❌ Sin `aria-pressed` para toggle, sin `aria-disabled` (solo `disabled` HTML)
- `Card`: ❌ Sin `role`, `aria-label` o `aria-describedby`

### 11. WCAG AA gate (PASS parcial)

12/12 pares de contraste pasan AA (≥4.5:1). Pendiente: script CI de verificación.

### 12. NN Heuristics (NO)

Sin revisión automática contra heurísticas de usabilidad.

### 13. Stories obligatorias (PASS parcial)

✅ `NewsletterForm`, `PurchaseCard`, `Testimonials`. ❌ Button, Input, Card, Textarea sin stories.

### 14. CWV constraints (PASS parcial)

- Imágenes lazy-loaded en proyectos
- Sin `font-display:swap` issues (next/font)
- **Imágenes picsum sin dimensiones explícitas pueden causar CLS** — convencional: cada `<Image>` con placeholder URL debe especificar `width` y `height` numéricos (ver §14)

### 15. Pipeline QA (NO)

Workflow QA automatizado pendiente.

### 16. Islands mode (PASS parcial)

- ✅ Server Components por defecto (Next.js App Router)
- ✅ `"use client"` solo en componentes interactivos

### 17. RSC awareness (PASS parcial)

En Next.js App Router, **`forwardRef` por sí solo NO convierte** un componente en Client Component. Un Server Component puede exportar un componente que use `forwardRef`. Lo que fuerza el boundary `"use client"` directive es **otro de**:

- Hooks de estado/efecto: `useState`, `useEffect`, `useRef` con mutaciones imperativas
- Event handlers: `onClick`, `onChange`, `onSubmit`, etc.
- APIs del navegador: `window`, `document`, `localStorage`, `IntersectionObserver`, etc.

Por eso `Button`/`Input`/`Textarea`/`Card` están marcados `"use client"`: no por el `forwardRef`, sino porque exponen handlers (`onClick`) o estado interno.

### 18. PE gate (NO)

Sin script de verificación de progressive enhancement.

### 19. Modern CSS (PASS)

- ✅ CSS Grid + Flexbox nativos
- ✅ CSS variables (`hsl(var(--...))`)
- ✅ `@layer` (via `@theme inline`)
- ✅ `backdrop-filter`, `aspect-ratio`
- ❌ Sin Container Queries ni CSS Nesting

### 20. Atomic taxonomy (PASS parcial)

- ✅ `ui/` — átomos
- ✅ `sections/` — organismos
- ❌ Sin moléculas explícitas (`FormField` que componga Label + Input + Error)

### 21. i18n infra (NO)

Sitio monolingüe (es-ES). Sin RTL. Pendiente.

---

## 3. Arquitectura de Componentes

```

components/
├── ui/ ← ÁTOMOS
│ ├── Button.tsx
│ ├── Input.tsx
│ ├── Textarea.tsx
│ ├── Card.tsx
│ ├── Icon.tsx
│ ├── Reveal.tsx
│ └── index.ts
├── sections/ ← ORGANISMOS
│ ├── Header.tsx
│ ├── Footer.tsx
│ ├── home/
│ │ ├── Hero.tsx
│ │ ├── HomeFeaturedProjects.tsx
│ │ ├── HomeServices.tsx
│ │ ├── Testimonials.tsx
│ │ └── HomeCTA.tsx
│ ├── services/ServicesView.tsx
│ ├── projects/ProjectsList.tsx
│ ├── blog/BlogView.tsx
│ ├── checkout/PurchaseCard.tsx
│ ├── contact/ContactView.tsx
│ ├── stack/StackGraph.tsx
│ ├── coming-soon/ComingSoon.tsx
│ ├── Marquee.tsx
│ ├── Terminal.tsx
│ ├── NewsletterForm.tsx
│ └── ThemeToggle.tsx
├── blog/BlogSearch.tsx
└── JsonLd.tsx ← Server Component

````

### Patrón actual (Button)

```typescript
const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const variantStyles = { primary: "bg-cta text-on-primary", secondary: "...", ghost: "..." };
    const classNames = cn(baseStyles, variantStyles[variant], className);
    return href ? <a ref={...} ... /> : <button ref={...} ... />;
  }
);
Button.displayName = "Button";
````

---

## 4. Gaps Prioritarios

| Prio | Área                        | Acción                                                                                 |
| ---- | --------------------------- | -------------------------------------------------------------------------------------- |
| 🔴   | **DUPs activos en CSS**     | Cerrar 9 duplicaciones (DUP-1..9) en F2                                                |
| 🔴   | **HC críticos**             | Sustituir hardcoding color/spacing/font en F2                                          |
| 🔴   | **VISUAL activos**          | Resolver 6 bugs visuales con E2E                                                       |
| 🔴   | **Score global 47/100**     | Llevar a ≥85% cerrando F1..F4 del spec                                                 |
| 🟡   | **Tests F0**                | Mantener `pnpm test:coverage tests/unit/design-system-*.test.ts` en verde (pre-commit) |
| 🟡   | **Auto-validador del spec** | `pnpm run spec:audit` reporta coherencia de los 4 artefactos                           |
| 🟢   | **Stories**                 | Añadir CSF 3.0 para Button, Input, Card, Textarea                                      |
| 🟢   | **Container Queries**       | Evaluar uso en componentes responsivos                                                 |

---

## 5. Matriz de Estados por Componente

| Componente          | idle    | hover            | active   | focus | disabled | loading | error | empty |
| ------------------- | ------- | ---------------- | -------- | ----- | -------- | ------- | ----- | ----- |
| **Button**          | ✅      | ✅               | ✅       | ✅    | ✅       | ❌      | N/A   | N/A   |
| **Input**           | ✅      | ✅               | N/A      | ✅    | ✅       | N/A     | ✅    | N/A   |
| **Textarea**        | ✅      | ✅               | N/A      | ✅    | ✅       | N/A     | ✅    | N/A   |
| **Card**            | ✅      | ✅ (interactive) | N/A      | ❌    | N/A      | N/A     | N/A   | ❌    |
| **Select**          | N/A     | N/A              | N/A      | N/A   | N/A      | N/A     | N/A   | N/A   |
| **Step (.ak-step)** | ✅ on   | N/A              | ✅ done  | N/A   | N/A      | N/A     | N/A   | N/A   |
| **Skeletons**       | shimmer | static           | N/A      | N/A   | N/A      | N/A     | N/A   | ✅    |
| **Calendar day**    | ✅      | ✅ (av)          | ✅ (sel) | N/A   | N/A      | N/A     | N/A   | ✅    |

---

## 6. Mapa de Archivos CSS

| Archivo             | `@layer`            | Vive en       | Importa                  | Importado por | Fuente de verdad de                                                      |
| ------------------- | ------------------- | ------------- | ------------------------ | ------------- | ------------------------------------------------------------------------ |
| `globals.css`       | n/a                 | `src/app/`    | `tailwindcss`, `@source` | nadie         | entry point único                                                        |
| `design-tokens.css` | unlayered           | `src/styles/` | nada                     | `globals.css` | tokens, dark, semantic defaults, `@theme inline` (sin keyframes tras F2) |
| `site.css`          | `@layer components` | `src/styles/` | nada                     | `globals.css` | ak-* base + organismos + keyframes                                       |
| `_projects.css`     | `@layer components` | `src/styles/` | nada                     | `globals.css` | projects sidebar + masonry                                               |
| `_contact.css`      | `@layer components` | `src/styles/` | nada                     | `globals.css` | **form/calendar/channels (única fuente de verdad del formulario)**       |
| `_navbar.css`       | `@layer components` | `src/styles/` | nada                     | `globals.css` | mobile nav + scrolled header                                             |
| `_services.css`     | `@layer components` | `src/styles/` | nada                     | `globals.css` | **destino de `services/ServicesView.css` post-merge**                    |

### Orden canónico de `@import` en `globals.css`

```css
@import "tailwindcss" source(none);
@source "../../src/**/*.{ts,tsx,js,jsx,css}";
@import "../styles/design-tokens.css"; /* tokens, dark, semantic defaults, @theme */
@import "../styles/site.css"; /* ak-* base + organismos */
@import "../styles/_projects.css"; /* projects sidebar */
@import "../styles/_contact.css"; /* form */
@import "../styles/_navbar.css"; /* mobile nav */
@import "../styles/_services.css"; /* services */
```

Este orden es testeado por `tests/unit/css-architecture.test.ts` (TU-0.6). **No reordenar sin actualizar el contrato.**

### Convención arquitectónica

- **Todo CSS global vive en `src/styles/`.** Ningún `.tsx`/`jsx` importa `.css` directamente. Validado por `TU-0.7.*` y `TU-0.6`.
- Si un componente requiere estilos específicos extensos (>50 líneas), mover a `_X.css` dentro de `src/styles/`.

---

## 7. Regla ak-* vs Tailwind

Decisión arquitectónica irreversible. Mezclar paradigmas de forma incorrecta rota la cascade.

| Paradigma              | Uso canónico                                                                                               | Ejemplo correcto                                             | Ejemplo prohibido                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **`ak-*`**             | Estructura de organismos. Define la mayor parte del bloque (padding, gap, color de tema, border).          | `<button className="ak-btn ak-btn-primary">Guardar</button>` | `<div className="ak-form-card p-4">` ← pisa el padding interno del ak-*                             |
| **Tailwind utilities** | Variación atómica puntual. Offsets, anchos, animaciones, hover/focus overrides específicos del componente. | `<button className="ak-btn-primary mt-4">`                   | `<a className="ak-btn-secondary text-link">` ← pisa el color del ak-* con el color de link          |
| **Mezcla prohibida**   | ak-* y utility sobre la misma propiedad. La última gana por cascade (puede ser impredecible).              | —                                                            | `<a className="bg-primary text-on-primary ak-btn-primary">` ← bg + text redundantes, ak-* ya aporta |

### Hack `:where(a):is(...)`

El bloque `:where(a):is(.bg-primary, .bg-cta, .text-on-primary) { color: hsl(var(--text-on-primary)); }` en `site.css:7-11` corrige el conflicto entre `a { color: hsl(var(--text-link)) }` (unlayered en `design-tokens.css`) y utilities de color aplicadas a `<a>`. Limitaciones:

- Sólo cubre las 3 utilities listadas.
- Botones-enlace con `ak-btn-secondary` u otras variantes cubiertas parcialmente por `direct :hover` necesitan la lista extendida (pendiente RF9).

**Tabla en §8** documenta el ADR completo.

---

## 8. Decisiones de Cascade — ADR-001 sobre `:where(a):is`

### Contexto

`design-tokens.css` define `a { color: hsl(var(--text-link)) }` **unlayered** (intencional, ver §2.6). Tailwind v4 genera utilities unlayered con mayor specificity que `a { color }`. Resultado: cualquier `<a class="bg-primary text-on-primary">` debería mostrar `text-on-primary` (color claro sobre fondo primary), pero el `a { color }` unlayered del token puede ganarle por cascade si el orden de imports cambia.

### Decisión

`site.css:7-11` define:

```css
:where(a):is(.bg-primary, .bg-cta, .text-on-primary) {
  color: hsl(var(--text-on-primary));
}
```

- `:where(a)` aporta specificity 0 al selector `a`.
- `:is(.bg-primary, ...)` resuelve a la specificity de la utility aplicada (0,1,0).
- Resultado: la utility unlayered **mantiene** su specificity y el rule con `:where` + `:is` viene después en el orden de imports (`site.css` carga después de `design-tokens.css`), ganando por cascade.

### Prohibición explícita

**⚠️ No eliminar este bloque.** Cualquier modificación del comportamiento de los CTA-enlace pasa por extender `:is(...)`. Eliminarlo silenciosamente reintroduce el bug visual en todos los `<a>` con utility class de color.

### Estado actual

Sólo cubre 3 classes (`.bg-primary, .bg-cta, .text-on-primary`). La deuda abierta RF9/VISUAL-1 requiere extender la lista `.is(...)` con las clases ak-* que tiñen `<a>` con fondo o texto invertido: `.bg-highlight`, `.bg-sunken`, `.ak-btn-primary`, `.ak-btn-secondary`, `.ak-tier-pro`, `.ak-toggle button.on`, `.ak-tag.on`, `.ak-chip.on`, `.ak-side-filters button.on`, `.ak-step.on .ak-step-dot`.

### Plan B (NO aplicado)

Mover la regla `a { color: hsl(var(--text-link)) }` de `design-tokens.css` dentro de `@layer base`. Esto invierte el orden de cascade: utilities unlayered ganarían de forma nativa por specificity (0,1,0) sobre `@layer base` (que tiene specificity efectiva menor por estar wrapped). No aplicado en este spec porque cambia el comportamiento de todos los `<a>` no-utilitarios — el coste/beneficio no justifica.

---

## 9. Animations Canónicas

| `@keyframes`                  | Archivo canónico                                                                     | Consumido por                                        | Estado     |
| ----------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- | ---------- |
| `@keyframes blink`            | `design-tokens.css` → `site.css` (en F2.4)                                           | `.ak-cursor`                                         | canonical  |
| `@keyframes marquee`          | `design-tokens.css` → `site.css` (en F2.4)                                           | `.ak-marquee-track`                                  | canonical  |
| `@keyframes pulse-ring`       | `design-tokens.css` → `site.css` (en F2.4)                                           | `.ak-status-dot`, `.ak-note .ak-status-dot`          | canonical  |
| `@keyframes reveal`           | `design-tokens.css` (mantenido) + exposed como `--animate-reveal` en `@theme inline` | `.ak-tl-fade`, `[data-reveal]`                       | canonical  |
| `@keyframes pulse`            | `_contact.css` → `site.css` (en F2.4)                                                | `.ak-skeleton` widgets sin variante propia           | genérico   |
| `@keyframes skeleton-shimmer` | `site.css`                                                                           | `.ak-skeleton` (canónica)                            | canonical  |
| `@keyframes bob`              | `site.css`                                                                           | `.ak-scroll-cue`                                     | canonical  |
| `@keyframes rise`             | **DEPRECATED** — eliminar en F2.5                                                    | migrar a `@keyframes reveal` con `data-reveal-delay` | deprecated |

**Reglas:**

- `reveal` es la canónica para entradas de load-in. Usar siempre con duración explícita en el selector (`.ak-tl-fade` = 260ms; `[data-reveal]` = 650ms).
- `rise` se mantiene como alias **DEPRECATED** durante la transición F2.5. Después de F2.5, eliminar `@keyframes rise` de `site.css:265`.
- Cualquier keyframe nuevo debe documentarse en esta tabla.

---

## 10. Inventario de Clases `ak-*`

Inventario por categoría (mínimo recomendado para cobertura substantive — ver `tests/unit/inventory-coverage.test.ts`).

### Layout Patterns

`.ak-zz-row`, `.ak-zz-row.rev`, `.ak-zz-media`, `.ak-railwrap`, `.ak-rail`, `.ak-stack-layout`, `.ak-stack-side`, `.ak-proj-layout`, `.ak-proj-side`, `.ak-proj-bar`, `.ak-contact-grid`. [11 clases ≥ 8 ✓]

### Graph / Interactive

`.ak-graph`, `.ak-graph-inner`, `.ak-graph-svg`, `.ak-node`, `.ak-node-center`, `.ak-node-cat`, `.ak-node-leaf`, `.ak-node-center`, `.ak-edge`, `.ak-edge.hot`, `.ak-graph-controls`, `.ak-dotgrid`, `.ak-graph-hint`. [13 clases ≥ 7 ✓]

### Content

`.ak-srv-list`, `.ak-srv-row`, `.ak-srv-idx`, `.ak-srv-arrow`, `.ak-srv-name`, `.ak-srv-sub`, `.ak-srv-price`, `.ak-bloglist`, `.ak-blrow`, `.ak-blrow-date`, `.ak-blrow-title`, `.ak-blrow-rt`, `.ak-tcar`, `.ak-tcar-track`, `.ak-tcard`, `.ak-feat`, `.ak-zz-metrics`, `.ak-zz-metric`, `.ak-zz-metric.acc`, `.ak-layer`, `.ak-layers`. [20 clases ≥ 5 ✓]

### Form System

`.ak-form-card`, `.ak-steps`, `.ak-step`, `.ak-step-dot`, `.ak-step-line`, `.ak-progress`, `.ak-progress-bar`, `.ak-field`, `.ak-field-row`, `.ak-label`, `.ak-input`, `.ak-textarea`, `.ak-err-msg`, `.ak-form-actions`, `.ak-review`, `.ak-review-row`, `.ak-consent`, `.ak-cal`, `.ak-cal-head`, `.ak-cal-grid`, `.ak-cal-day`, `.ak-cal-dow`, `.ak-cal-sub`, `.ak-panel`, `.ak-channels`, `.ak-channel`, `.ak-channel-ic`. [27 clases ≥ 15 ✓]

### Skeleton

`.ak-skeleton` (canónica: shimmer), `.ak-skeleton-eyebrow`, `.ak-skeleton-title`, `.ak-skeleton-lead`, `.ak-skeleton-row`, `.ak-skeleton-col`, `.ak-skeleton-graph`, `.ak-skeleton-panel`, `.ak-skeleton-cal`, `.ak-skeleton-channels`, `.ak-skeleton-step`, `.ak-skeleton-input`. [12 clases ≥ 5 ✓]

### States

`.ak-node.dim`, `.ak-node.sel`, `.ak-step.on`, `.ak-step.done`, `.ak-cal-day.av`, `.ak-cal-day.sel`, `.ak-tl-dot.active`, `.ak-tl2-card.now`, `.ak-side-filters button.on`, `.ak-tag.on`, `.ak-chip.on`, `.dark .ak-*`. [12 estados ≥ 5 ✓]

**Total inventario: 94 referencias entre clases y estados**, distribuidas en 6 categorías con substancia para los 4 asserts TU-0.8.*

---

## 11–13. Adjuntos y otros

### Convenciones complementarias

- `.sr-only` migrado al patrón clip moderno (HC-7): `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;`
- `--fs-price: 1.875rem` (HC-4), `--fs-metric: 1.375rem` (HC-5) añadidos a type scale.
- `--header-height: 64px` (HC-3) y sticky-position via `calc(var(--header-height) + N)` documentados.
- `.ak-panel` vive **exclusivamente** en `_contact.css` (padding: 22px). `site.css` ya no la define — cierre irreversible de DUP-8 aplicado consolidando BEM en single class. Los 4 sitios JSX (`ContactView` L434/L489, `StackGraph` L239/L258) usan `className="ak-panel"` single class. Reintroducir la variante de 18px o el modificador `--md` dividiría el estado visual entre archivos — prohibido. **El valor `22px` es literal (no token). El lock en TU-0.2.f.2 verifica el valor literal, no el valor resuelto de un token; una migración a `var(--ak-panel-pad)` requiere rediseñar el lock simultáneamente (no basta con extender el regex para aceptar `var(...)`).**

### §14. Convención imágenes placeholder

Cuando se use `<Image>` de Next.js con URL placeholder dinámica (picsum.photos, unsplash, etc.), proporcionar SIEMPRE `width` y `height` numéricos. Caso contrario: CLS en LCP detectable por Lighthouse y `audit:lh`. Validar en cada PR.

---

## 6. Adjuntos

- `docs/DESIGN.md` — este documento
- `src/styles/design-tokens.css` — CSS variables (fuente de verdad visual)
- `src/tokens/tokens.json` — DTCG W3C format
- `src/tokens/tokens.ts` — Constantes TypeScript
- `src/components/ui/index.ts` — Barrel exports
- `specs/design-system-truth/` — Spec fuente de verdad (4 artefactos, 49 AC)
- `tests/unit/design-system-audit.test.ts` — gate de este documento (TU-0.1.a-g)
- `scripts/audit-spec-coherence.mjs` — auto-validador cross-spec

---

_Generado contra SHA: `8448a69`. Próxima revisión: post-cierre de F19 (cleanup tokens legacy completado)._
