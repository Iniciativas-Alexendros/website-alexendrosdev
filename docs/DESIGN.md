# ARCTIC OCEAN — Design System Status

> **Version:** 1.0.0 — Auditoría: 2026-07-20
> **Stack:** Next.js 16 (App Router) + Tailwind CSS v4 + React 19
> **Theme:** Arctic Frost (light) / Ocean Depths (dark)
> **Fuentes:** Geist (sans) · Geist Mono (mono) · JetBrains Mono (code) — vía `next/font`

---

## Resumen Ejecutivo

| Dimensión           | Estado                            | Score |
| ------------------- | --------------------------------- | ----- |
| **Token system**    | ✅ Sólido                         | 90%   |
| **Componentes UI**  | ⚠️ Base sólida, faltan estándares | 65%   |
| **ARIA / A11y**     | ⚠️ Parcial                        | 55%   |
| **Testing / QA**    | ❌ Sin pipeline de diseño         | 30%   |
| **Infraestructura** | ⚠️ Modern CSS sí, i18n/RTL no     | 60%   |

**Puntuación global: 60/100** · 12/21 estándares cumplidos (total o parcial)

---

## 1. Token System

### Ubicación

| Archivo                        | Función                                       |
| ------------------------------ | --------------------------------------------- |
| `src/styles/design-tokens.css` | CSS variables — single source of truth visual |
| `src/styles/site.css`          | Clases semánticas `ak-*` componiendo tokens   |
| `src/app/globals.css`          | `@import` entry point                         |
| `src/tokens/tokens.json`       | DTCG W3C format (nuevo)                       |
| `src/tokens/tokens.ts`         | Constantes TypeScript tipadas (nuevo)         |

### Token coverage

- **Color:** 11-step primary scale + 5 surfaces + 7 text + 4 semantic + 3 border + 7 terminal = 37 colores
- **Dark mode:** Todos los colores tienen override en `.dark` (37/37)
- **Shadows:** 4 elevations + focus, con composición `hsl(var(--shadow-*))`
- **Typography:** 11 tamaños + 3 familias (vía next/font)
- **Spacing:** 10 steps (0.25rem → 6rem)
- **Radius:** 7 steps (6px → 9999px)
- **Motion:** 3 durations + 3 easings
- **Z-index:** ❌ No hay tokens de z-index. Solo `z-index: 50` hardcodeado en `.ak-header`

**✅ DTCG:** `tokens.json` exportado en formato W3C Design Tokens (60+ tokens, light + dark).
**✅ Tailwind v4 `@theme`:** Todos los tokens expuestos como utilidades Tailwind en `@theme inline`.

---

## 2. Evaluación de los 21 Estándares

### ✅ 1. Nada hardcodeado (PASS parcial)

Los colores/sombras usan tokens (`bg-primary`, `text-on-primary`, `hsl(var(--...))`). Sin embargo:

- Clases utilitarias en componentes (`"inline-flex items-center justify-center..."`) son strings planos, no composiciones tokenizadas
- Valores de spacing en componentes JSX usan clases `p-6`, `gap-2` etc. de Tailwind — aceptable
- `font-semibold` en Button es hardcodeado

### ❌ 2. DESIGN.md como schema (NO)

No existía DESIGN.md. Este documento es el primero. Faltan:

- Matrix de estados por componente
- Composición de layouts
- Mapeo ARIA

### ✅ 3. Componentes con forwardRef (PASS)

`Button`, `Input`, `Textarea`, `Card` usan `forwardRef`. ✅

### ❌ 4. cva para variantes (NO)

Button usa un objeto `const variantStyles = { primary: "...", secondary: "..." }` manual. No usa `class-variance-authority`.

### ❌ 5. Tipos compartidos (NO)

Cada componente define sus props localmente. No hay `types.ts` compartido con `Size`, `Variant`, `State`, `Orientation`, `Side`.

### ❌ 6. Tokens en @layer base (NO)

`design-tokens.css` usa `@theme inline` (Tailwind v4). Los defaults semánticos (`body`, `h1`, etc.) están en `site.css` sin `@layer base`. Esto causa problemas de especificidad (hay un fix con `:where()` en site.css).

### ✅ 7. Dark mode siempre (PASS)

- `.dark` class completa con todos los tokens overrideados
- `ThemeToggle` component funcional
- `useTheme` hook con persistencia y `prefers-color-scheme`

### ❌ 8. Z-index explícito (NO)

No hay `--z-*` tokens. El único z-index del sistema (`50` en `.ak-header`) está hardcodeado.

### ✅ 9. Contrato DTCG (PASS)

`src/tokens/tokens.json` sigue formato W3C con `$type`, `$value`, `$description`. Incluye light + dark. Se creó `src/tokens/index.ts` como barrel.

### ⚠️ 10. ARIA obligatorio (PASS parcial)

- `Input`: ✅ `aria-invalid`, `aria-describedby`, `role="alert"` en errores
- `ThemeToggle`: ✅ `aria-label`
- `Button`: ❌ Sin `aria-pressed` para toggle, sin `aria-disabled` (solo `disabled` HTML)
- `Card`: ❌ Sin `role`, `aria-label` o `aria-describedby`
- No hay hook/helper ARIA compartido (`useAriaLive` / `ariaAttributes.ts` referenciados pero no existen)

### ⚠️ 11. WCAG AA gate (PASS parcial)

- ✅ 12/12 pares de contraste comprobados pasan AA (≥4.5:1)
- ❌ No hay script CI que verifique contraste automáticamente

### ❌ 12. NN Heuristics (NO)

No hay revisión automática contra heurísticas de usabilidad.

### ⚠️ 13. Stories obligatorias (PASS parcial)

- ✅ Existen: `NewsletterForm.stories.tsx`, `PurchaseCard.stories.tsx`, `Testimonials.stories.tsx`
- ❌ Faltan: Button, Input, Card, Textarea — los primitivos del sistema no tienen stories

### ⚠️ 14. CWV constraints (PASS parcial)

- ✅ Imágenes lazy-loaded en proyectos
- ✅ Sin font-display:swap issues (next/font)
- ❌ Imágenes picsum sin dimensiones explícitas pueden causar CLS
- ❌ Sin script de verificación Lighthouse

### ❌ 15. Pipeline QA (NO)

No hay workflow de diseño automatizado. Sin gates de contraste, ARIA, PE, stories.

### ⚠️ 16. Islands mode (PASS parcial)

- ✅ Server Components por defecto (Next.js App Router)
- ✅ `"use client"` solo en componentes interactivos (Button, Input, ThemeToggle)
- ❌ Contenido estático renderizado con React, no HTML puro. Sin progressive enhancement nativo.

### ⚠️ 17. RSC awareness (PASS parcial)

- ✅ Layout y páginas son Server Components
- ✅ `JsonLd.tsx` es Server Component correctamente
- ⚠️ UI primitives (Button, Input, Card) están en `components/ui/` sin `"use client"` pero son clientes por `forwardRef`. Next.js los trata como Client Components automáticamente.

### ❌ 18. PE gate (NO)

Sin script de verificación de progressive enhancement. No se verifica que el markup funcione sin JS.

### ✅ 19. Modern CSS (PASS)

- ✅ CSS Grid + Flexbox nativos
- ✅ CSS variables (`hsl(var(--...))`)
- ✅ `@layer` (via `@theme inline`)
- ✅ `backdrop-filter`, `aspect-ratio`
- ❌ Sin Container Queries
- ❌ Sin CSS Nesting (usando Tailwind utilities en su lugar)

### ⚠️ 20. Atomic taxonomy (PASS parcial)

- ✅ `ui/` — átomos: Button, Input, Textarea, Card, Icon, Reveal
- ✅ `sections/` — organismos: Header, Footer, Hero, Testimonials, etc.
- ❌ Sin moléculas explícitas (e.g. FormField que componga Label + Input + Error)
- ❌ Sin `templates/` layer (layout compositions)
- ✅ `index.ts` barrel export en ui/

### ❌ 21. i18n infra (NO)

- Sitio monolingüe (es-ES). Sin soporte RTL.
- CSS margins/paddings direccionales (`margin-left`, `padding-right`) no usan logical properties (`margin-inline-start`, `padding-inline-end`)
- Sin tokens RTL/LTR

---

## 3. Arquitectura de Componentes

```
components/
├── ui/                    ← ÁTOMOS
│   ├── Button.tsx         forwardRef, variant/size, no cva, no stories
│   ├── Input.tsx          forwardRef, aria-invalid/describedby, no stories
│   ├── Textarea.tsx       forwardRef, similar a Input
│   ├── Card.tsx           forwardRef, interactive/padded, no ARIA
│   ├── Icon.tsx           Phosphor icons wrapper, type IconName
│   ├── Reveal.tsx         Framer Motion wrapper, reveal animation
│   └── index.ts           Barrel export
├── sections/              ← ORGANISMOS
│   ├── Header.tsx         Sticky header, nav, burger menu
│   ├── Footer.tsx         Footer with terminal, links, newsletter
│   ├── home/
│   │   ├── Hero.tsx
│   │   ├── HomeFeaturedProjects.tsx
│   │   ├── HomeServices.tsx
│   │   ├── Testimonials.tsx
│   │   └── HomeCTA.tsx
│   ├── services/ServicesView.tsx
│   ├── projects/ProjectsList.tsx
│   ├── blog/BlogView.tsx
│   ├── checkout/PurchaseCard.tsx
│   ├── contact/ContactView.tsx
│   ├── stack/StackGraph.tsx
│   ├── coming-soon/ComingSoon.tsx
│   ├── Marquee.tsx
│   ├── Terminal.tsx
│   ├── NewsletterForm.tsx
│   └── ThemeToggle.tsx
├── blog/BlogSearch.tsx
└── JsonLd.tsx              ← Server Component
```

### Patrón de componentes

```typescript
// Estándar actual (Button como ejemplo)
const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const variantStyles = { primary: "...", secondary: "..." };  // ← manual
    const sizeStyles = { sm: "...", md: "...", lg: "..." };      // ← manual
    const classNames = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
    return href ? <a ref={...} ... /> : <button ref={...} ... />;
  }
);
Button.displayName = "Button";
```

### Patrón deseado (skill)

```typescript
// Ideal: cva + types compartidos
import { cva } from "class-variance-authority";
import type { Size, Variant } from "@/components/ui/types";

const buttonVariants = cva("inline-flex ...", {
  variants: {
    variant: { primary: "bg-primary ...", secondary: "...", ghost: "..." },
    size: { sm: "h-8 ...", md: "h-10 ...", lg: "h-12 ..." },
  },
});
```

---

## 4. Gaps Prioritarios

| Prioridad | Área                  | Acción                                                                   | Impacto | Esfuerzo |
| --------- | --------------------- | ------------------------------------------------------------------------ | ------- | -------- |
| 🔴        | **Stories**           | Añadir CSF 3.0 stories para Button, Input, Card, Textarea                | Alto    | Medio    |
| 🔴        | **ARIA**              | Añadir roles/attrs a Card (role="region"), Button (aria-pressed)         | Alto    | Bajo     |
| 🔴        | **Z-index**           | Crear `--z-*` tokens y migrar `z-index: 50` a `z-index: var(--z-sticky)` | Alto    | Bajo     |
| 🟡        | **cva**               | Migrar variantes manuales a `class-variance-authority`                   | Medio   | Bajo     |
| 🟡        | **Tipos compartidos** | Crear `types.ts` con Size, Variant, State                                | Medio   | Bajo     |
| 🟡        | **PE gate**           | Verificar que el markup funciona sin JS                                  | Medio   | Medio    |
| 🟡        | **WCAG AA CI**        | Script de verificación de contraste automático                           | Medio   | Bajo     |
| 🟢        | **@layer base**       | Mover defaults semánticos a `@layer base` en CSS                         | Bajo    | Bajo     |
| 🟢        | **i18n**              | Migrar margins direccionales a logical properties                        | Bajo    | Alto     |
| 🟢        | **Container Queries** | Evaluar uso en componentes responsivos                                   | Bajo    | Medio    |

---

## 5. Matriz de Estados por Componente

| Componente   | idle | hover            | active | focus | disabled | loading | error | empty |
| ------------ | ---- | ---------------- | ------ | ----- | -------- | ------- | ----- | ----- |
| **Button**   | ✅   | ✅               | ✅     | ✅    | ✅       | ❌      | N/A   | N/A   |
| **Input**    | ✅   | ✅               | N/A    | ✅    | ✅       | N/A     | ✅    | N/A   |
| **Textarea** | ✅   | ✅               | N/A    | ✅    | ✅       | N/A     | ✅    | N/A   |
| **Card**     | ✅   | ✅ (interactive) | N/A    | ❌    | N/A      | N/A     | N/A   | ❌    |
| **Select**   | N/A  | N/A              | N/A    | N/A   | N/A      | N/A     | N/A   | N/A   |

---

## 6. Adjuntos

- `src/styles/design-tokens.css` — CSS variables (fuente de verdad visual)
- `src/tokens/tokens.json` — DTCG W3C format
- `src/tokens/tokens.ts` — Constantes TypeScript
- `src/components/ui/index.ts` — Barrel exports

---

_Generado con design-system-builder skill. Próxima revisión: post-implementación de gaps priorizados._
