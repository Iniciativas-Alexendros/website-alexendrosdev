# Plan de corrección de defectos visuales

> **Estado:** 1ª iteración ejecutada en PR #154 (2026-08-08). Matriz de 120 capturas local disponible en `docs/design-audit.md` y `tests/e2e/design-audit.spec.ts`.
>
> **Nota:** La numeración #45–#57 es histórica; los issues reales se crearon en FASE 1 del plan maestro de diseño.

## 1. Defectos detectados

### P0 — bloqueantes (accesibilidad y estabilidad)

- **Contraste insuficiente:** `text-tertiary` y placeholders en modo claro no alcanzan WCAG AA (4.5:1) sobre el fondo.
- **CLS (Cumulative Layout Shift):** imágenes de proyectos sin reserva explícita, marquee y fuentes sin `font-display: swap`.
- **Overflow horizontal en móvil:** contenedores flex/grid sin `min-width: 0` en hijos, marquee sin control de overflow en 360 px.
- **Focus visible:** algunos interactivos (links, botones, tarjetas clicables) carecen de `:focus-visible` accesible.

### P1 — consistencia

- **Tokens hardcodeados:** valores `px`, `hex`, `rgba` fuera de `src/tokens/` en componentes y páginas.
- **Escala tipográfica inconsistente:** tamaños y espaciados que no siguen la escala 4/8pt.
- **CTAs/botones no unificados:** estilos distintos en home, servicios, checkout y contacto.

### P2 — estados y responsive

- **Estados incompletos:** hover, active, focus, disabled, loading, empty en tarjetas, formularios y CTAs.
- **Header móvil:** faltan `aria-expanded`, focus trap y cierre con Esc.
- **Responsive 360–1920:** no hay paridad verificada entre breakpoints.
- **Motion sin `prefers-reduced-motion`:** algunas animaciones (marquee, terminal, reveal) no respetan la preferencia del usuario.
- **Dark mode:** posible flash de tema claro antes de hidratación; sombras/bordes no usan tokens semánticos.

### P3 — pulido

- **Grid/alineación:** Header, secciones y Footer no comparten un contenedor común (`--container-max: 1120px`).
- **Iconografía:** mezcla de estilos en ICON_MAP y componentes.
- **Imágenes:** faltan placeholders de blur en ProjectImage, falta especificar `sizes` para next/image.
- **Microcopy:** algunos titulares sin `text-wrap: balance`, truncado sin elegancia en tarjetas.
- **404 y /proximamente:** diseño por debajo del nivel de la home.

## 2. Plan de ejecución

### Fase 0 — Higiene y planificación

1. ~~Auditoría visual base~~ ✅ PR #154: matriz de 120 capturas (15 rutas × 4 viewports × 2 temas).
2. Crear issues en GitHub etiquetados `diseño` por prioridad.
3. Ramas por fase para PRs independientes y revisiones incrementales.

### Fase 1 — P0: accesibilidad y estabilidad

- **Contraste:** revisar `text-tertiary`, placeholders y estados disabled en ambos temas. Objetivo: WCAG AA (4.5:1 texto, 3:1 componentes).
- **CLS:** reservar aspect-ratio en ProjectImage, min-height en Marquee, `font-display: swap`.
- **Overflow móvil:** `min-width: 0` en hijos de flex/grid, overflow-x controlado en Marquee y Terminal.
- **Focus-visible:** añadir `:focus-visible` accesible en todos los interactivos.
- **Criterio:** axe-core en las 15 rutas × 2 temas sin violaciones critical/serious.
- **Criterio:** Lighthouse CLS < 0.1 en todas las rutas.

### Fase 2 — Gate de regresión visual

- Añadir `toMatchSnapshot()` con baselines versionadas en `design-audit.spec.ts`.
- Job CI que genere la matriz en PRs y falle ante diff no aprobado.
- Lighthouse CI con budget mínimo de accesibilidad (≥ 95).
- Documentar en `tests/README.md` cómo actualizar baselines y cuándo.

### Fase 3 — P1: consistencia

- **Tokenización estricta:** migrar px/hex/rgba restantes en `src/components/**` y `src/app/**` hacia tokens.
- **Escala tipográfica:** unificar a 5–6 tamaños (display, h1–h3, body, small, caption).
- **Espaciado:** aplicar escala 4/8pt de forma uniforme entre secciones.
- **Sistema de CTAs:** unificar botones en home, servicios, checkout y contacto.
- **Criterio:** `scripts/audit-hardcoded-colors.mjs` pasa sin violaciones nuevas.

### Fase 4 — P2: estados y responsive

- **Estados interactivos:** hover, active, focus, disabled, loading y empty en tarjetas, formularios y CTAs.
- **Header móvil:** añadir `aria-expanded`, focus trap y cierre con Esc.
- **Responsive:** validar paridad de información y acciones entre 360 px y desktop.
- **Motion:** aplicar `prefers-reduced-motion` a Marquee, Terminal y Reveal (ya existe `useReducedMotion`, extender donde falte).
- **Dark mode:** inyectar script de tema antes de hidratación para evitar flash; revisar sombras/bordes con tokens semánticos.

### Fase 5 — P3: pulido

- **Grid:** alinear Header, secciones y Footer al mismo contenedor común.
- **Iconografía:** unificar ICON_MAP y estilos de iconos.
- **Imágenes:** añadir blur placeholder en ProjectImage, especificar `sizes` para next/image.
- **Microcopy:** `text-wrap: balance` en titulares, truncado elegante en tarjetas.
- **404 y /proximamente:** elevar al nivel de la home.

## 3. Convenciones

- Commits: `fix(visual): …`, `feat(design-system): …`, `docs: …`.
- Ramas: `fix/p0-defectos-visuales`, `feat/regresion-visual-ci`, `feat/p1-consistencia`, `feat/p2-estados-responsive`, `feat/p3-pulido`.
- PRs: referenciar issue correspondiente; incluir captura antes/después cuando aplique.
- Tests: Vitest para unit/integración, Playwright para e2e/visual/a11y.
- CI: verde obligatorio (format, lint, typecheck, tests, build, playwright, axe).

## 4. Issues

| Issue | Título                                                          | Prioridad | Esfuerzo       |
| ----- | --------------------------------------------------------------- | --------- | -------------- |
| #156  | `[P0-DISEÑO] Auditoría visual base + docs/design-audit.md`      | P0        | S (✅ PR #154) |
| #157  | `[P0-DISEÑO] Contraste WCAG AA en ambos temas`                  | P0        | M              |
| #158  | `[P0-DISEÑO] Eliminar CLS (ProjectImage, Marquee, fuentes)`     | P0        | M              |
| #159  | `[P0-DISEÑO] Overflow horizontal móvil + focus-visible`         | P0        | S              |
| #160  | `[P1-DISEÑO] Tokenización estricta (cero valores hardcodeados)` | P1        | L              |
| #161  | `[P1-DISEÑO] Escala tipográfica y ritmo de espaciado únicos`    | P1        | M              |
| #162  | `[P1-DISEÑO] Sistema de CTAs/botones unificado`                 | P1        | S              |
| #163  | `[P2-DISEÑO] Estados completos de componentes interactivos`     | P2        | M              |
| #164  | `[P2-DISEÑO] Header móvil accesible + responsive 360–1920`      | P2        | M              |
| #165  | `[P2-DISEÑO] Motion scale + prefers-reduced-motion`             | P2        | S              |
| #166  | `[P2-DISEÑO] Dark mode sin flash, tokens semánticos por tema`   | P2        | M              |
| #167  | `[P2-DISEÑO] Regresión visual Playwright + axe en CI`           | P2        | M              |
| #168  | `[P3-DISEÑO] Pulido final: grid, iconos, microcopy, 404`        | P3        | M              |

**Orden sugerido:** Auditoría ✅ → #P0 contraste/CLS/overflow (en paralelo) → regresión visual CI → P1 → P2 → P3.

## 5. Referencias

- `src/tokens/` — fuente de verdad del sistema de diseño.
- `src/components/sections/` — Header, Footer, Marquee, Terminal, ThemeToggle, NewsletterForm.
- `docs/design-audit.md` — auditoría visual base y matriz de capturas.
- `tests/e2e/design-audit.spec.ts` — test Playwright de la matriz de 120 capturas.
- `tests/e2e/a11y.spec.ts` — test Playwright de accesibilidad axe-core.
- Issues relacionados: #41 (analítica), #42 (calendario), #43 (testimonios), #44 (monitorización).
