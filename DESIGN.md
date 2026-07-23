# DESIGN.md — Arctic Ocean Design System

> **Fuente de verdad visual del proyecto.**  
> Toda clase CSS, token de color, tamaño o animación que aparezca en el código
> debe estar definida aquí o ser una utilidad estándar de Tailwind v4.  
> Actualizar este documento en el mismo commit que introduce cualquier cambio de
> diseño. Nunca a posteriori.

---

## 1. Resumen del sistema

| Atributo        | Valor                                              |
|-----------------|----------------------------------------------------|
| Nombre          | Arctic Ocean                                       |
| Modo claro      | Arctic Frost (Steel Blue)                          |
| Modo oscuro     | Ocean Depths (Teal / Cyan)                         |
| Stack           | Next.js 15 · Tailwind CSS v4 · TypeScript strict   |
| Fuentes         | Geist (sans) · Geist Mono (mono UI) · JetBrains Mono (code) |
| Entry CSS       | `src/app/globals.css`                              |
| Tokens          | `src/styles/design-tokens.css`                     |
| Componentes     | `src/styles/site.css` + parciales `_*.css`         |

**Principios:**
1. Token-first — ningún valor de color, tamaño o duración se hardcodea fuera de `design-tokens.css`.
2. Prefijo de sistema — toda clase custom lleva prefijo `ak-`. Ninguna excepción.
3. Layer-safe — todos los componentes viven en `@layer components`. Las utilidades de Tailwind siempre ganan.
4. WCAG AA mínimo — contraste ≥ 4.5:1 texto normal, ≥ 3:1 texto grande. Verificado en ambos modos.
5. Motion-safe — toda animación tiene su contrapartida en `prefers-reduced-motion`.

---

## 2. Arquitectura de archivos CSS
src/app/globals.css ← Entry point. @import ordenados. @layer declarado aquí.
src/styles/
design-tokens.css ← :root + .dark tokens + @theme inline. SIN lógica de componente.
site.css ← @layer components. Todos los ak-* del site global.
_navbar.css ← @layer components. Clases exclusivas del header/nav.
_services.css ← @layer components. Clases exclusivas de /servicios.
_projects.css ← @layer components. Clases exclusivas de /proyectos.
_contact.css ← @layer components. Clases exclusivas de /contacto.


### Regla de orden de imports en globals.css

```css
/* 1. Declaración explícita de capas — SIEMPRE PRIMERA */
@layer reset, base, components, utilities;

/* 2. Framework (genera la capa utilities) */
@import "tailwindcss" source(none);
@source "../**/*.{ts,tsx,js,jsx,css}";

/* 3. Tokens (alimentan @theme → capa utilities de Tailwind) */
@import "../styles/design-tokens.css";

/* 4. Componentes del site (capa components) */
@import "../styles/site.css";
@import "../styles/_navbar.css";
@import "../styles/_services.css";
@import "../styles/_projects.css";
@import "../styles/_contact.css";
```

### Cuándo crear un parcial nuevo

Crear `_[ruta].css` cuando una página o sección tiene **≥ 5 clases exclusivas** que no se reutilizan en otra página. Añadir su `@import` a `globals.css` en el mismo commit.

---

## 3. Design Tokens

Todos los tokens son **canales HSL sin `hsl()`** en la declaración.  
Uso correcto: `color: hsl(var(--text-primary))` · `background: hsl(var(--bg-base) / 0.8)`.  
**Prohibido:** comentarios inline en el valor del token (`--primary: 213 60% 95% /* azul */`).

### 3.1 Color — Superficies

| Token             | Light (HSL)       | Dark (HSL)        | Uso                              |
|-------------------|-------------------|-------------------|----------------------------------|
| `--bg-base`       | 210 20% 98%       | 213 30% 15%       | Fondo de página, secciones        |
| `--bg-elevated`   | 0 0% 100%         | 213 28% 18%       | Cards, modales, dropdowns         |
| `--bg-sunken`     | 210 20% 96%       | 213 32% 12%       | Secciones recesadas, footer       |
| `--bg-highlight`  | 213 72% 90%       | 213 25% 21%       | Secciones CTA, selección activa   |
| `--bg-inset`      | 210 18% 93%       | 213 35% 9%        | Inputs, terminal, inset           |

### 3.2 Color — Texto

| Token                | Light           | Dark            | Contraste mín. | Uso                          |
|----------------------|-----------------|-----------------|----------------|------------------------------|
| `--text-primary`     | 213 30% 15%     | 140 20% 96%     | ≥ 7:1          | Títulos, texto principal      |
| `--text-secondary`   | 215 16% 30%     | 180 38% 76%     | ≥ 4.5:1        | Párrafos, descripciones       |
| `--text-tertiary`    | 213 20% 28%     | 195 25% 62%     | ≥ 4.5:1        | Metadatos, labels             |
| `--text-muted`       | 213 18% 38%     | 195 20% 52%     | ≥ 4.5:1        | Placeholders, deshabilitados  |
| `--text-link`        | 214 45% 32%     | 180 47% 52%     | ≥ 4.5:1        | Links, acentos interactivos   |
| `--text-on-primary`  | 0 0% 100%       | 213 30% 15%     | ≥ 4.5:1        | Texto sobre fondo `--cta`     |

### 3.3 Color — Semántico y Estado

| Token          | Light           | Dark            | Uso                              |
|----------------|-----------------|-----------------|----------------------------------|
| `--cta`        | var(--primary-400) | var(--primary-400) | Fondo de botones primarios    |
| `--success`    | 180 55% 28%     | 174 56% 55%     | Indicadores positivos, checks    |
| `--warning`    | 42 40% 56%      | 42 70% 64%      | Alertas, estrellas               |
| `--emergency`  | 3 37% 52%       | 0 55% 67%       | Errores, estados críticos        |
| `--info`       | 214 38% 47%     | 200 50% 59%     | Información neutra               |

### 3.4 Color — Bordes y Sombras

| Token               | Uso                                       |
|---------------------|-------------------------------------------|
| `--border`          | Bordes estándar de cards e inputs         |
| `--border-subtle`   | Separadores, bordes de bajo contraste     |
| `--border-focus`    | Ring de foco en inputs y botones          |
| `--elev-sm`         | Sombra mínima (tags, botones secundarios) |
| `--elev-md`         | Cards en estado normal                    |
| `--elev-lg`         | Cards en hover, modales                   |
| `--elev-xl`         | Overlays, drawers                         |
| `--elev-focus`      | Outline de foco (`:focus-visible`)        |

---

## 4. Tipografía

### Familias

| Variable        | Stack                                        | Uso                          |
|-----------------|----------------------------------------------|------------------------------|
| `--font-sans`   | Geist → system-ui → sans-serif               | Todo el UI, headings, body   |
| `--font-mono`   | Geist Mono → ui-monospace → monospace        | Metadatos, labels, UI mono   |
| `--font-code`   | JetBrains Mono → ui-monospace → monospace    | Bloques de código, terminal  |

Las variables `--font-geist`, `--font-geist-mono`, `--font-jetbrains` son inyectadas por `next/font` desde `app/layout.tsx`.

### Escala de tamaños

| Token            | Valor (clamp)                    | Clase utilitaria  | Uso                    |
|------------------|----------------------------------|-------------------|------------------------|
| `--fs-display`   | clamp(2.5rem, 5vw, 4rem)        | `.ak-display`     | Hero principal         |
| `--fs-h1`        | clamp(2rem, 4vw, 3rem)          | `.ak-h1` / `h1`  | Títulos de página      |
| `--fs-h2`        | clamp(1.5rem, 3vw, 2.25rem)     | `.ak-h2` / `h2`  | Títulos de sección     |
| `--fs-h3`        | 1.25rem                          | `h3`              | Títulos de card        |
| `--fs-h4`        | 1.125rem                         | `h4`              | Sub-títulos            |
| `--fs-body-lg`   | 1.125rem                         | `.body-lg`        | Lead / intro párrafo   |
| `--fs-body`      | 1rem                             | —                 | Texto de cuerpo        |
| `--fs-body-sm`   | 0.875rem                         | `.body-sm`        | Descripciones, listas  |
| `--fs-caption`   | 0.75rem                          | `.caption`        | Notas, legales         |
| `--fs-mono-sm`   | 0.8125rem                        | —                 | Tags, metadatos mono   |
| `--fs-mono-lg`   | 0.9375rem                        | `.mono-lg`        | Terminal, código       |

---

## 5. Espaciado, Radio y Motion

### Espaciado

| Token         | Valor   | Uso típico                          |
|---------------|---------|-------------------------------------|
| `--space-1`   | 0.25rem | Gap mínimo entre iconos             |
| `--space-2`   | 0.5rem  | Gap entre badges/tags               |
| `--space-4`   | 1rem    | Padding interno de botones          |
| `--space-6`   | 1.5rem  | Gap entre elementos de lista        |
| `--space-8`   | 2rem    | Padding de cards                    |
| `--space-12`  | 3rem    | Gap de grids                        |
| `--space-16`  | 4rem    | Padding de secciones (compacto)     |
| `--space-20`  | 5rem    | —                                   |
| `--space-24`  | 6rem    | Padding de secciones (estándar)     |

### Radio

| Token                | Valor  | Uso                                       |
|----------------------|--------|-------------------------------------------|
| `--radius-sm`        | 6px    | Tags, badges, chips pequeños              |
| `--radius-md`        | 8px    | Inputs, botones, dropdowns                |
| `--radius-lg`        | 12px   | Cards internas, principios                |
| `--radius-xl`        | 16px   | Cards principales, sidebars               |
| `--radius-2xl`       | 20px   | Hero cards, sections destacadas           |
| `--radius-full`      | 9999px | Pills, avatares, toggles, dots            |
| `--radius-interactive` | 9999px | Cualquier elemento con `:hover` marcado |

### Motion

| Token              | Valor                         | Uso                               |
|--------------------|-------------------------------|-----------------------------------|
| `--duration-fast`  | 150ms                         | Hover de botones, color de links  |
| `--duration-base`  | 200ms                         | Transiciones de cards, sidebar    |
| `--duration-slow`  | 300ms                         | Carousel, modales                 |
| `--ease-default`   | cubic-bezier(0.4, 0, 0.2, 1) | Transiciones estándar             |
| `--ease-bounce`    | cubic-bezier(0.34, 1.56, 0.64, 1) | Microinteracciones CTA       |
| `--ease-in-out`    | cubic-bezier(0.65, 0, 0.35, 1) | Reveals de entrada               |

**Regla:** toda `transition` o `animation` en un componente debe usar estos tokens.  
**Prohibido:** valores numéricos de duración hardcodeados como `transition: all 0.3s ease`.

---

## 6. Z-Index

| Token          | Valor | Uso                              |
|----------------|-------|----------------------------------|
| `--z-base`     | 1     | Elementos en flujo con z-context |
| `--z-content`  | 10    | Overlays sobre media (badges)    |
| `--z-sticky`   | 40    | Overlay de sidebar mobile        |
| `--z-header`   | 50    | Header sticky                    |
| `--z-overlay`  | 60    | Backdrop de modales              |
| `--z-modal`    | 70    | Modales                          |
| `--z-tooltip`  | 80    | Tooltips y popovers              |

---

## 7. Catálogo de componentes

Prefijo único: **`ak-`**. Toda clase custom del site usa este prefijo sin excepción.

### Layout

| Clase                | Archivo     | Descripción                                       |
|----------------------|-------------|---------------------------------------------------|
| `.ak-app`            | site.css    | Wrapper raíz de la aplicación                     |
| `.ak-scroll`         | site.css    | Scroll container principal (100vh, overflow-y)    |
| `.ak-container`      | site.css    | Max-width centrado con padding lateral            |
| `.ak-container-inner`| site.css    | Variante de container para rutas internas         |
| `.ak-section`        | site.css    | Sección con padding vertical estándar (72px)      |
| `.ak-section-sunken` | site.css    | Sección sobre `--bg-sunken`                       |
| `.ak-section-head`   | site.css    | Header de sección con eyebrow + h2 + sub          |
| `.ak-page-head`      | site.css    | Header de página interior (rutas /about, /blog…)  |

### Botones

| Clase                | Modificadores            | Descripción                              |
|----------------------|--------------------------|------------------------------------------|
| `.ak-btn`            | Base obligatoria          | Botón genérico (display:inline-flex)     |
| `.ak-btn-primary`    | + `.ak-btn`              | CTA principal (fondo `--cta`)            |
| `.ak-btn-secondary`  | + `.ak-btn`              | Acción secundaria (borde `--border`)     |
| `.ak-btn-ghost`      | + `.ak-btn`              | Acción terciaria (transparente)          |
| `.ak-btn-reset`      | Standalone               | Reset de filtros (proyectos)             |

**Regla:** todos los botones deben incluir `:focus-visible` con `box-shadow: var(--elev-focus)`.  
**Prohibido:** `outline: none` sin alternativa de foco visible.

### Navegación

| Clase              | Descripción                                       |
|--------------------|---------------------------------------------------|
| `.ak-header`       | Header sticky con z-index `--z-header`            |
| `.ak-header-scrolled` | Estado scrolled (backdrop-filter)             |
| `.ak-header-inner` | Inner layout del header (flex, gap)               |
| `.ak-logo`         | Logo monoespaciado con `b` en `--text-link`       |
| `.ak-nav`          | Nav horizontal (oculto en mobile ≤ 880px)         |
| `.ak-nav a.on`     | Link activo de navegación                         |
| `.ak-burger`       | Botón hamburguesa (visible solo en mobile)        |
| `.ak-mobile-nav`   | Nav vertical colapsable en mobile                 |
| `.ak-theme-toggle` | Toggle de tema claro/oscuro                       |

### Cards y Tiles

| Clase            | Modificadores          | Descripción                                 |
|------------------|------------------------|---------------------------------------------|
| `.ak-pcard`      | `.ak-pcard-rev`        | Project card zigzag (grid 2 columnas)       |
| `.ak-tile`       | —                      | Project tile masonry (break-inside: avoid)  |
| `.ak-tile-link`  | —                      | Tile como enlace completo (block)           |
| `.ak-card`       | —                      | Blog post card (grid)                       |
| `.ak-tcard`      | —                      | Testimonial card (carousel)                 |
| `.ak-principle`  | —                      | Card de principio/valor                     |
| `.ak-panel`      | —                      | Panel de sidebar informativo (Stack)        |

### Tags, Chips y Badges

| Clase         | Estado `.on`         | Descripción                               |
|---------------|----------------------|-------------------------------------------|
| `.ak-tag`     | No aplica            | Label mono, fondo `--bg-highlight`        |
| `.ak-chip`    | `.ak-chip.on`        | Filtro interactivo, pill completo         |
| `.ak-badge-star` | —                 | Badge "destacado" (fondo warning/14%)     |
| `.ak-tier-badge` | —                 | Badge sobre pricing tier (fondo `--cta`) |
| `.ak-note`    | —                    | Pill de estado (dot + texto success)      |

**Modificador de estado:** `.on` (activo/seleccionado) · nunca `.active`, `.selected` o `.is-active`.

### Formularios

| Clase           | Descripción                                          |
|-----------------|------------------------------------------------------|
| `.ak-field`     | Wrapper de campo (flex-col, gap-6px)                 |
| `.ak-label`     | Label de campo (600, 13px)                           |
| `.ak-input`     | Input de texto                                       |
| `.ak-textarea`  | Textarea redimensionable vertical                    |
| `.ak-caption`   | Texto de ayuda bajo el campo                         |
| `.ak-check`     | Wrapper checkbox + label                             |
| `.ak-form-card` | Tarjeta contenedora del formulario                   |
| `.ak-progress`  | Barra de progreso (multi-step contact)               |
| `.ak-progress-bar` | Fill animado de la barra de progreso            |

**Regla de foco en inputs:** `:focus` → `border-color: hsl(var(--border-focus))` + `box-shadow: 0 0 0 3px hsl(var(--border-focus) / 0.2)`.

### Pricing / Servicios

| Clase               | Modificadores           | Descripción                              |
|---------------------|-------------------------|------------------------------------------|
| `.ak-pricing`       | —                       | Grid de 3 columnas de tiers              |
| `.ak-tier`          | `.ak-tier-pro`          | Card de tier de precios                  |
| `.ak-tier-pro`      | —                       | Tier destacado (borde primary-400)       |
| `.ak-toggle`        | —                       | Toggle mensual/anual                     |
| `.ak-tiers-grid`    | —                       | Grid alternativo auto-fit               |
| `.ak-addons-grid`   | —                       | Grid de add-ons                          |
| `.ak-faq-item`      | `[open]`                | Ítem FAQ con `<details>`                 |
| `.ak-comparison-wrap` | —                    | Wrapper scroll-x de tabla comparativa    |
| `.ak-comparison`    | —                       | Tabla comparativa                        |

⚠️ **Inconsistencia activa:** `.ak-tier-pro` en `site.css` y `.ak-tier.pro` en `_services.css` definen el mismo estado. Usar exclusivamente `.ak-tier-pro` en todo el código. Eliminar `.ak-tier.pro`.

### Proyectos

| Clase                  | Descripción                                       |
|------------------------|---------------------------------------------------|
| `.ak-proj-layout`      | Grid sidebar 230px + main (Variant A)             |
| `.ak-proj-side`        | Sidebar sticky de filtros                         |
| `.ak-projects-page`    | Grid sidebar 260px + main (Variant B)             |
| `.ak-projects-sidebar` | Sidebar con offcanvas en mobile                   |
| `.ak-sidebar-toggle`   | Botón de apertura del sidebar — **solo mobile**   |
| `.ak-sidebar-close`    | Botón de cierre dentro del sidebar                |
| `.ak-sidebar-overlay`  | Backdrop del sidebar en mobile                    |
| `.ak-masonry`          | Grid de columnas CSS (3→2→1 en breakpoints)       |
| `.ak-masonry-tile`     | Tile dentro del masonry (break-inside: avoid)     |
| `.ak-filter-group`     | Grupo de filtro con label                         |
| `.ak-chip.on`          | Tag/chip de filtro activo                         |

⚠️ `.ak-sidebar-toggle` debe tener `display: none` en `@media (min-width: 881px)`.

### Timeline y About

| Clase           | Modificadores           | Descripción                         |
|-----------------|-------------------------|-------------------------------------|
| `.ak-timeline`  | —                       | Timeline vertical simple (sidebar)  |
| `.ak-tl-item`   | —                       | Ítem del timeline                   |
| `.ak-tl-dot`    | `.active`               | Punto del timeline                  |
| `.ak-tl-card`   | `.active`               | Card del timeline                   |
| `.ak-tl2`       | —                       | Timeline alternado centrado         |
| `.ak-tl2-item`  | `.left` / `.right`      | Item alternado                      |
| `.ak-tl2-card`  | `.now`                  | Card con borde primary activo       |
| `.ak-railwrap`  | —                       | Layout year-rail + body (About B)   |
| `.ak-rail`      | —                       | Rail de años sticky                 |

### Contacto / Stepper ⚠️ PENDIENTE `_contact.css`

| Clase              | Descripción                                           |
|--------------------|-------------------------------------------------------|
| `.ak-steps`        | Contenedor del stepper (flex, align-items: center)    |
| `.ak-step`         | Paso del stepper                                      |
| `.ak-step.on`      | Paso activo                                           |
| `.ak-step-dot`     | Indicador visual del paso                             |
| `.ak-step-line`    | Línea separadora (flex: 1, height: 1px)               |
| `.ak-channels`     | Grid de canales de contacto                           |
| `.ak-channel`      | Card de canal individual                              |
| `.ak-channel-ic`   | Icono del canal                                       |
| `.ak-cal-grid`     | Grid 7 columnas del calendario                        |
| `.ak-cal-day`      | Celda de día del calendario                           |
| `.ak-cal-day.on`   | Día seleccionado                                      |
| `.ak-success`      | Estado de envío exitoso (flex-col, centrado)          |

### Globales y Utilidades

| Clase               | Descripción                                    |
|---------------------|------------------------------------------------|
| `.ak-eyebrow`       | Label mono pequeño de sección (text-link)      |
| `.ak-sr-only`       | Visualmente oculto, accesible para screen readers |
| `.ak-skeleton`      | Shimmer de carga (gradient animado)            |
| `.ak-ph`            | Placeholder de imagen (hatching + gradient)    |
| `.ak-ph-grad`       | Placeholder con gradiente de color             |
| `.ak-avatar`        | Avatar circular con gradiente                  |
| `.ak-status`        | Pill de estado "Disponible"                    |
| `.ak-status-dot`    | Dot animado de estado (pulse-ring)             |

---

## 8. Patrones de composición

### Grid de cards con filtros

```tsx
<div className="ak-proj-controls">
  <div className="ak-search">…</div>
  <div className="ak-chips">
    <button className="ak-chip on">Todos</button>
    <button className="ak-chip">Web</button>
  </div>
</div>
<div className="ak-masonry">
  <div className="ak-masonry-tile">
    <a className="ak-tile-link">…</a>
  </div>
</div>
```

### Sidebar responsivo (Variant B)

```tsx
{/* Overlay — solo visible en mobile cuando sidebar está abierto */}
{open && <div className="ak-sidebar-overlay" onClick={close} />}

{/* Sidebar */}
<aside className={`ak-projects-sidebar ${open ? "open" : ""}`}>
  <div className="ak-sidebar-header">
    <span className="ak-h3">Filtros</span>
    <button className="ak-sidebar-close" onClick={close} aria-label="Cerrar filtros">…</button>
  </div>
  …
</aside>

{/* Toggle — SOLO visible en mobile gracias al CSS */}
<button className="ak-sidebar-toggle" onClick={open}>Filtros →</button>
```

### Stepper multi-paso (contacto)

```tsx
<div className="ak-steps" role="list">
  {steps.map((s, i) => (
    <Fragment key={s}>
      <div className={`ak-step ${i === current ? "on" : ""}`} role="listitem">
        <div className="ak-step-dot">{i + 1}</div>
        <span className="ak-step-label">{s}</span>
      </div>
      {i < steps.length - 1 && <div className="ak-step-line" aria-hidden="true" />}
    </Fragment>
  ))}
</div>
<div className="ak-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
  <span className="ak-progress-bar" style={{ width: `${pct}%` }} />
</div>
```

### Calendario con offset de día

```tsx
const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // lunes = 0
const cells = [
  ...Array(firstDay).fill(null),       // celdas vacías de offset
  ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
];
```

---

## 9. Reglas de extensión

### Añadir un nuevo token de color

1. Definir el canal HSL en `:root` de `design-tokens.css` (con el nombre semántico correcto).
2. Definir el valor dark en `.dark`.
3. Si se necesita como utilidad Tailwind, exponer en `@theme inline` como `--color-[nombre]: hsl(var(--token))`.
4. Documentar en la tabla de §3 de este archivo.

### Añadir un nuevo componente

1. Elegir archivo destino: si es exclusivo de una página, ir al parcial `_[página].css`; si es global, ir a `site.css`.
2. Escribir la clase dentro de `@layer components { … }`.
3. Usar exclusivamente tokens del sistema. Prohibido hardcodear colores, tamaños o duraciones.
4. Nombrar: `ak-[bloque]`, modificadores: `ak-[bloque]--[mod]` o `ak-[bloque] [mod]` — **elegir uno y ser consistente en todo el componente**.
5. Añadir la clase a la tabla §7 de este archivo.

### Prohibiciones absolutas

- ❌ `!important` en ningún archivo de `src/styles/`
- ❌ Valores de color hardcodeados fuera de `design-tokens.css` (ej.: `color: #2d3748`)
- ❌ Clases CSS sin prefijo `ak-` (ej.: `.pro`, `.active`, `.open` como clase principal)
- ❌ `outline: none` sin alternativa `:focus-visible`
- ❌ `transition: all` (especificar siempre las propiedades: `transform, box-shadow`)
- ❌ Comentarios inline en valores de variables CSS (rompen `hsl(var())` en Turbopack)
- ❌ Variables CSS que se auto-referencien en `@theme inline` (ej.: `--font-sans: var(--font-sans)`)
- ❌ Animaciones sin `@media (prefers-reduced-motion: reduce)` como contrapartida

---

## 10. Accesibilidad (WCAG 2.2 AA)

| Requisito                     | Implementación en este sistema                    |
|-------------------------------|---------------------------------------------------|
| Contraste texto ≥ 4.5:1       | Verificado en §3.2. Usar solo tokens semánticos. |
| Contraste texto grande ≥ 3:1  | `--fs-h1` y superiores con `--text-primary`      |
| Focus visible                 | `:focus-visible` con `var(--elev-focus)` en todos los interactivos |
| Reduced motion                | `prefers-reduced-motion` en `design-tokens.css` y site.css |
| Botones icon-only             | Requieren `aria-label` descriptivo               |
| `<details>/<summary>`         | No añadir `role="button"` (redundante)           |
| Inputs de formulario          | `<label htmlFor>` obligatorio; nunca `placeholder` como único label |
| Calendarios                   | `role="grid"`, días con `aria-label="DD de MMMM"` |

---
