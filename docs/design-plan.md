# Plan de corrección de defectos visuales y diseño

> Documento de trabajo para elevar la calidad visual y de diseño del portafolio
> sin romper funcionalidad ni el stack actual (Next.js App Router + `src/tokens` + CSS).
> La ejecución se gestiona como issues etiquetados `[P#-DISEÑO]`, coherentes con la
> convención ya usada en el repo (`[P2-COMERCIAL]`, `[P3-CONFIANZA]`, etc.).

## 0. Objetivo y alcance

- Corregir defectos visuales detectables en todas las rutas públicas.
- Consolidar un sistema de diseño consistente basado en `src/tokens`.
- Garantizar accesibilidad (WCAG 2.2 AA) en ambos temas (claro/oscuro).
- Prevenir regresiones visuales con tooling automatizado en CI.

Rutas en alcance: `/`, `/servicios`, `/proyectos`, `/stack`, `/sobre-mi`,
`/contacto`, `/checkout`, `/newsletter`, `/legal`, `/proximamente` y 404.

## 1. Auditoría previa (diagnóstico)

Antes de tocar nada, documentar el estado actual:

- **Capturas base** de todas las rutas en:
  - Viewports: 360, 768, 1280 y 1920 px.
  - Tema claro **y** oscuro (verificar `ThemeToggle` en ambos).
- **Auditoría automatizada**: Lighthouse (Performance, A11y, Best Practices) + axe-core por ruta.
- **Inventario de inconsistencias**: espaciados, tamaños de fuente, radios, sombras
  y colores usados fuera de `src/tokens`.
- **Entregable**: `docs/design-audit.md` con capturas y tabla de hallazgos.

## 2. Defectos a corregir, por prioridad

### P0 — Bloqueantes visuales (rompen la percepción profesional)

1. **Contraste WCAG AA** en ambos temas: texto secundario, placeholders de
   formularios (`NewsletterForm`, formularios de `contact/`) y estados disabled.
   Mínimo 4.5:1 (texto) y 3:1 (componentes/gráficos).
2. **Layout shift (CLS)**: dimensionar `ProjectImage` (width/height o
   `aspect-ratio`), reservar espacio del `Marquee` y del `Terminal` mientras
   hidratan; `font-display: swap` y preload de la fuente principal.
3. **Overflow horizontal en móvil**: típicamente causado por marquees, tablas del
   stack o bloques de código del `Terminal`. `min-width: 0` en hijos de grid/flex
   y `overflow-x` controlado.
4. **Estados de foco visibles**: ningún elemento interactivo sin `:focus-visible`
   claro en ambos temas.

### P1 — Consistencia del sistema de diseño

5. **Tokenización estricta**: migrar valores hardcodeados (px, hex, rgba) en
   `src/components/**` y `src/app/**` hacia `src/tokens`. Regla: cero
   colores/espaciados literales fuera de tokens (verificable con lint custom o
   grep en CI).
6. **Escala tipográfica única**: máximo 5–6 tamaños (display, h1–h3, body, small,
   caption); eliminar tamaños huérfanos entre secciones.
7. **Ritmo de espaciado vertical**: una escala (p. ej. 4/8 pt) aplicada de forma
   consistente entre secciones de la home y páginas internas; márgenes de sección
   uniformes.
8. **Jerarquía de botones y CTAs**: un solo estilo primario, uno secundario y uno
   ghost, aplicados igual en `home`, `services`, `checkout` y `contact`.

### P2 — Estados, responsive y motion

9. **Estados completos de componentes**: hover, active, focus, disabled, loading
   y empty en tarjetas de proyecto, formularios y CTAs.
10. **Responsive real en todos los breakpoints**: misma información y acciones en
    360 px que en desktop; menú móvil del `Header` accesible (`aria-expanded`,
    focus trap, cierre con Esc).
11. **Motion con propósito**: duraciones de una escala (150/250/400 ms), easing
    consistente y respeto a `prefers-reduced-motion` en `Marquee`, transiciones y
    animaciones del `Terminal`.
12. **Dark mode pulido**: sin flash de tema incorrecto en carga (script de tema
    antes de hidratar en `layout.tsx`); sombras y bordes adaptados por tema vía
    tokens semánticos (no utilidades `dark:` ad hoc dispersas).

### P3 — Detalle y acabado

13. **Alineación y grid**: todo el contenido anclado a un contenedor y grid
    comunes; corregir desalineaciones entre `Header`, secciones y `Footer`.
14. **Iconografía e imágenes**: un solo estilo/tamaño de iconos; `ProjectImage`
    con placeholders/blur y `sizes` correctos para `next/image`.
15. **Microcopy visual**: truncado elegante en tarjetas, `text-wrap: balance` en
    titulares, viudas controladas.
16. **Página 404 y `proximamente`**: llevarlas al mismo nivel de acabado que la home.

## 3. Verificación y prevención de regresiones

- **Playwright** (`playwright.config.ts` ya existe): añadir tests de regresión
  visual (screenshot comparison) por ruta × viewport × tema, en CI contra
  previews de Vercel.
- **axe-core + htmlvalidate** en CI: fallar el build ante errores de contraste,
  landmarks o foco.
- **Criterios de aceptación globales**:
  - Lighthouse ≥ 95 en Accessibility y Best Practices.
  - CLS < 0.1 en todas las rutas.
  - Contraste AA verificado en ambos temas.
  - Cero regresiones visuales no aprobadas.
- Cada PR visual incluye capturas antes/después.

## 4. Desglose en issues

| Issue | Título | Prioridad | Esfuerzo |
| ----- | ------ | --------- | -------- |
| #45 | `[P0-DISEÑO] Auditoría visual base + docs/design-audit.md` | P0 | S |
| #46 | `[P0-DISEÑO] Contraste WCAG AA en ambos temas` | P0 | M |
| #47 | `[P0-DISEÑO] Eliminar CLS (ProjectImage, Marquee, fuentes)` | P0 | M |
| #48 | `[P0-DISEÑO] Overflow horizontal móvil + focus-visible` | P0 | S |
| #49 | `[P1-DISEÑO] Tokenización estricta (cero valores hardcodeados)` | P1 | L |
| #50 | `[P1-DISEÑO] Escala tipográfica y ritmo de espaciado únicos` | P1 | M |
| #51 | `[P1-DISEÑO] Sistema de CTAs/botones unificado` | P1 | S |
| #52 | `[P2-DISEÑO] Estados completos de componentes interactivos` | P2 | M |
| #53 | `[P2-DISEÑO] Header móvil accesible + responsive 360–1920` | P2 | M |
| #54 | `[P2-DISEÑO] Motion scale + prefers-reduced-motion` | P2 | S |
| #55 | `[P2-DISEÑO] Dark mode sin flash, tokens semánticos por tema` | P2 | M |
| #56 | `[P2-DISEÑO] Regresión visual Playwright + axe en CI` | P2 | M |
| #57 | `[P3-DISEÑO] Pulido final: grid, iconos, microcopy, 404` | P3 | M |

**Orden sugerido**: #45 → #46–#48 (P0 en paralelo) → #56 (protege el resto) →
P1 → P2 → P3.

## 5. Referencias

- `src/tokens` — fuente de verdad del sistema de diseño.
- `src/components/sections` — Header, Footer, Marquee, Terminal, ThemeToggle,
  NewsletterForm.
- Issues relacionados: #41 (analítica), #42 (calendario), #43 (testimonios),
  #44 (monitorización).
