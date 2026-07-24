# Scenarios: design-system-truth

**Feature**: `design-system-truth`
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-23

---

## Happy Paths

### HP1 — `pnpm test:coverage` F0 en RED → GREEN tras F2

1. Estado inicial (F0 aún sin mergear): diseño auditado muestra 9 duplicaciones, 7 hardcodings, 2 keyframes equivalentes.
2. `pnpm test:coverage` SIN F0 → tests verdes (tests existentes sólo cubren JS).
3. F0 mergea `tests/unit/design-system-audit.test.ts` y `tests/unit/css-invariants.test.ts` con asserts `TU-0.1.*` y `TU-0.2.*`.
4. `pnpm test` ahora en **RED**: TU-0.1.a falla (encuentra "❌ No hay tokens de z-index" en §1), TU-0.2.a falla (encuentra `@keyframes rise` en `site.css:265`), etc.
5. F1 mergea `docs/DESIGN.md` corregido → TU-0.1.* verdes.
6. F2 mergea `site.css / _contact.css / _services.css / design-tokens.css` refactorizados → TU-0.2.* verdes.
7. F4 cierra F con gates verdes completos.

**Asserts:** AC33-38 verdes.

### HP2 — DESIGN.md §1 z-index legítimamente documentado

1. Auditor abre `docs/DESIGN.md`.
2. Encuentra §1 "Token coverage" sin bullet `❌ No hay tokens de z-index`.
3. Encuentra subsección `### Z-index scale` con tabla de 7 tokens: `--z-base: 1`, `--z-content: 10`, `--z-sticky: 40`, `--z-header: 50`, `--z-overlay: 60`, `--z-modal: 70`, `--z-tooltip: 80`.
4. Cada token tiene columna "Uso canónico" (ej. `--z-header` → `<header>` sticky).

**Asserts:** AC1, AC2 verdes.

### HP3 — `site.css` sin duplicados detectables por grep canónico

1. Auditor corre: `for cls in ak-eyebrow ak-form-card ak-field ak-input ak-textarea ak-panel ak-skeleton ak-side-group-t; do count=$(grep -lE "^\.${cls}" src/styles/*.css 2>/dev/null | wc -l); echo "${cls}: ${count} archivos"; done`
2. Salida esperada:
   ```
   ak-eyebrow: 1 archivo
   ak-form-card: 1 archivo
   ak-field: 1 archivo
   ak-input: 1 archivo
   ak-textarea: 1 archivo
   ak-panel: 1 archivo (base) + 1 modificador --md
   ak-skeleton: 1 archivo
   ak-side-group-t: 1 archivo
   ```
3. Si algún count > 1 → AC10-18 rojos hasta corrección.

**Asserts:** AC10-18 verdes.

### HP4 — E2E hover sobre CTA con `ak-btn-primary` muestra color correcto

1. Usuario navega a `/contacto`.
2. CTA primario es `<a className="ak-btn ak-btn-primary ...">`.
3. Test e2e hover sobre el CTA.
4. `getComputedStyle(el).color` evaluado.
5. **Esperado:** `rgb(255, 255, 255)` (text-on-primary en light) o equivalente en dark — NO el color de `text-link`.

**Asserts:** AC26, AC27 verdes.

### HP5 — `pnpm audit:hardcoded-colors` exit 0

1. Estado pre-F2: el script detecta `color: #fff` en `site.css:236-237` (.ak-tile-stat) → exit 1.
2. F2 cierra HC-1 → `#fff` → `hsl(var(--text-on-primary))`.
3. `pnpm audit:hardcoded-colors` ahora exit 0.
4. Auditor confirma: el script también rechaza hex 3/6/8 y `rgb()/rgba()` fuera de transparente.

**Asserts:** AC19, AC37 verdes.

### HP6 — `:where(a):is(...)` cubre 14 clases tras RF9 VERDICT

1. Lista actual 3 clases (`.bg-primary, .bg-cta, .text-on-primary`).
2. F2.8 (VISUAL-1) añade 11 más: `.bg-highlight`, `.bg-sunken`, `.ak-btn-primary`, `.ak-btn-secondary`, `.ak-tier-pro`, `.ak-toggle button.on`, `.ak-tag.on`, `.ak-chip.on`, `.ak-side-filters button.on`, `.ak-step.on .ak-step-dot`, ….
3. Lista total ≥ 11 → todas las variantes ak-* que tiñen `<a>` con color invertido cubiertas.
4. `<a className="ak-btn-secondary">` ahora muestra color `text-on-primary` también.

**Asserts:** AC26, AC27 verdes.

### HP7 — Servicios CSS migrado a `src/styles/_services.css`

1. `src/components/sections/services/ServicesView.css` (45 líneas).
2. F2.10 (RFA RF10.1) mueve contenido a `src/styles/_services.css` (estaba 17 bytes).
3. F2.10 (RFA RF10.2) actualiza `src/app/globals.css` import.
4. F2.10 (RFA RF10.3) busca `import "./ServicesView.css"` → 0 hits.
5. `pnpm build` verde (32 rutas compilan).

**Asserts:** AC32, AC42 verdes.

### HP8 — `.ak-skeleton` con shimmer único

1. Página `/stack` muestra `<div className="ak-skeleton ak-skeleton-graph">` durante `isLoading`.
2. Test e2e inspecciona: `getComputedStyle(el).animationName === 'skeleton-shimmer'`.
3. Pulse animation-name ya no aparece en `_contact.css` (eliminado en F2).
4. Light + dark: shimmer funciona correctamente con tokens `--bg-sunken` + `--bg-elevated`.

**Asserts:** AC17, AC29 verdes.

### HP9 — Skeleton pre-F2 muestra `pulse` (RED inicial)

1. Antes de F2.7 (DUP-7): `grep '@keyframes pulse' src/styles/_contact.css` → 1 hit.
2. `_contact.css .ak-skeleton` usa animation: pulse 1.6s → visible en /contacto durante loading.
3. `site.css .ak-skeleton` usa animation: skeleton-shimmer → NO visible (pierde cascade).

RED stage: scripts generan reportes que distinguen cuál skeleton se está renderizando (snapshot de animationName Playwright).

### HP10 — `pnpm build` verde tras refactor

1. 32 rutas compilan sin error (incluido `/`, `/contacto`, `/stack`, `/proyectos`, `/sobre`, `/servicios`, `/escaparate`).
2. `--turbopack` emite advertencias sólo por HMR (esperables en F4).
3. Sin clase huérfana que haga que un componente import fall.

---

## Edge Cases

### EC1 — `:where(a):is(...)` con clase ak-* en componente hijo

Escenario: dentro de `.ak-side-filters button.on`, hay un `<a>`. El selector `:where(a):is(.ak-side-filters button.on)` no incluye `<a>` nieto; sólo target si el `<a>` TIENE la clase (no si está bajo contenedor con la clase).

**Acción:** evaluar; si afecta, usar selector alternativo `:is(.ak-side-filters button.on a)` o probar si `:is()` tolera descendientes en v4 (probable: NO). Antipatrón: profundizar la jerarquía CSS.

**Plan B:** si `:is()` con descendientes falla el cast de specificity, ampliar el ADR-001 con nota.

### EC2 — `ak-tier-pro` hereda `text-link` para nombre

`.ak-tier-pro .ak-tier-name { color: hsl(var(--text-link)) }` usa `:where(a):is(.ak-tier-pro)` debería colorear el nombre si está en `<a>`, pero el tier-precio NO es `<a>` (es div). Sin efecto en este caso.

### EC3 — `data-density="compact"` intervals y reveal

`[data-density="compact"] .ak-section { padding-top: 46px; padding-bottom: 46px; }` está en site.css. `[data-reveal]` con `reveal` no afecta esta variante. Sin colisión.

### EC4 — `:where()` con secuencias repetidas largas

`:where(a):is(.ak-btn-primary,.ak-btn-secondary,.ak-toggle button.on,.ak-tag.on,.ak-chip.on,.ak-side-filters button.on,.ak-step.on .ak-step-dot) { color: ... }`. Browsers pueden tener límites de longitud de selector (256 clases por selector en algunos motores). Validar en Chrome/Firefox/Safari post-F2.

**Mitigación:** partir en dos rules si supera 256.

### EC5 — Modal `--z-modal` y `--z-overlay` sin consumidor activo

Tokens definidos, pero no usados por ningún componente actual. **Riesgo:** hay un modal a futuro que use `--z-modal` sin override → debería estar en DESIGN.md §1 (uso canónico = "contenido modal").

### EC6 — Dark mode + shimmer combination

`.ak-skeleton` con shimmer animado bajo `@media (prefers-reduced-motion: reduce) { animation: none }`. **Verificar que el estado final del shimmer (sin animar) NO muestre un color confuso.** Riesgo: gradiente al 0% del keyframe deja color superior (hsl(var(--bg-sunken))) con degradación al medio (hsl(var(--bg-elevated))). En pausa, queda estático en posición 0%. Verificar visualmente.

### EC7 — `data-reveal` con `reveal` 650ms vs `tl-fade` 260ms — duración distinta

`@keyframes reveal` se usa con `260ms` por `.ak-tl-fade` y `650ms` por `[data-reveal]`. **Sin colisión** — la duración está en `animation:` shorthand del elemento, no en el keyframe en sí. OK.

### EC8 — Prettier reformatea `padding-inline: var(--container-px);`

Prettier no toca CSS dentro de `@layer` (sólo JS/TS). Sin riesgo. Pero si se activa `prettier-plugin-tailwindcss` podría reordenar utilities; dentro de `*.css` aplica Prettier sí expande `@layer components { … }` con indent styles.

### EC9 — Scripts antiguos fallan al ejecutarse en CI sin nuevos tokens

`scripts/validate-tokens.sh` (existente) puede no reconocer `--container-px`, `--header-height`, `--gutter-md`. **Acción:** extender el script (RF11.6).

### EC10 — `_services.css` vacío + contenido de ServicesView.css — colisión de clases

`_services.css` actual (17 bytes) está vacío. Si ServicesView.css define clases con mismo nombre que `site.css`, la versión de `site.css` gana (orden de @import, `site.css` antes). Auditar merge.

### EC11 — `:where(a):is` con `a:hover` separado

`:where(a):is(...):hover { color: text-on-primary; }` necesario para que hover no vuelva a `text-link`. Si se omite, hovers en primary CTAs parpadean a text-link. **CRÍTICO mantener la segunda regla.**

### EC12 — `contactrange` límites y `transition` shorthand conflict

`.ak-input { transition: border-color var(--duration-fast), box-shadow var(--duration-fast); }` en `_contact.css`. Si se elimina la versión de `site.css` con valores distintos, verificar que esta transición es coherente con otros inputs del sitio (`.ak-search input` no tiene transition; `.ak-cta-form input` no). **Acción:** documentar.

### EC13 — `pnpm build` warnings por CSS duplicado no resuelto

Si quedan duplicados post-F2, Sentry/build puede no warn pero axe-core sí puede detectar estilos computados contradictorios. **Acción:** axe-core snapshot test.

### EC14 — Imágenes picsum sin dimensiones explícitas (VISUAL-4)

Documentado en DESIGN.md §14: las imágenes placeholder (picsum, unsplash) requieren `width`/`height` explícitos en Next.js `Image` component para evitar CLS. Si un componente nuevo hereda `<Image>` sin esos attrs, Lighthouse marcará LCP regression. **Acción:** grep `picsum.photos\|unsplash.*\.com` + assert que el `<Image>` adyacente tiene `width` y `height` numéricos.

---

## Errores esperados

| Tipo               | Condición                          | Comportamiento esperado                                                   |
| ------------------ | ---------------------------------- | ------------------------------------------------------------------------- |
| FAIL test          | RED initial state (pre-F2)         | Errores explícitos listando archivos:línea que aún contienen la violación |
| FAIL coverage gate | Cobertura <85% tras F4             | Bloqueo via `vitest.config.ts` thresholds                                 |
| FAIL build         | `'@import' SCSS-like error`        | El orden de imports en globals.css debe ser estricto                      |
| WARN tailwindcss   | Utilities no usadas                | OK; report no bloqueante                                                  |
| WARN linter CSS    | Use of color literal `#fff` futuro | Ahora bloqueado por script (TS-0.2.a strengthened)                        |

---

## Diagrama de flujo: Refactor por fase

```
       AUDITORÍA (5f8fd9b)
               │
               ▼
       ┌─── PLAN generado ───┐
       │                     │
       │  Pre-F0: tests red  │
       │           (RED)     │
       └────────────────────┘
               │
               ▼
F0: Crear tests invariantes ─┐
                              │
F1 (paralelo): Reescribir     │ paralelo (no comparten
    DESIGN.md con realidad    │ archivos críticos)
                              │
       ┌──────────────────────┘
       ▼
F2 (secuencial): Refactor CSS
   ├─ RF6: mover keyframes
   ├─ RF7: DUP-1…9
   ├─ RF8: HC-1…7
   ├─ RF9: VISUAL-1…6
   ├─ RF10: ARCH-5
   │     (todos verificados por TU-0.2.*)
       │
       ▼
F3 (post-F2): Visual regression
   ├─ Playwright snapshots
   ├─ axe-core
       │
       ▼
F4 (cierre): Gates finales
   ├─ pnpm test:coverage ≥ 85
   ├─ pnpm lint/typecheck/build
   ├─ pnpm audit:hardcoded-colors exit 0
   └─ Score ≥ 85/100
```

---

## Diagrama: Cascade de archivos CSS

```
src/app/globals.css (entry point)
│
├── @import "tailwindcss" source(none)
├── @source "../../src/**/*.{ts,tsx,js,jsx,css}"
├── @import "../styles/design-tokens.css"          [unlayered: tokens + dark + semantic defaults + @theme]
│                                                    ← NO contiene animations/keyframes tras F2
├── @import "../styles/site.css"                    [components: ak-* base + organismos + keyframes (except reveal)]
├── @import "../styles/_projects.css"               [components: ak-projects-*]
├── @import "../styles/_contact.css"                [components: ak-form-* fuente de verdad]
├── @import "../styles/_navbar.css"                 [components: ak-nav-on]
└── @import "../styles/_services.css"               [components: services content (post-merge)]
```

**Componentes React:** 0 imports CSS directos. Toda su presentación sale de
las clases `ak-*` aplicadas + utilities puntuales.

---

## Diagrama: Cascade del `:where(a):is(...)` — caso CTA `/`

```
<a href="/contacto" className="ak-btn ak-btn-primary text-on-primary">
  Hablemos
</a>

CSS cascade:
1. design-tokens.css:[unlayered] `a { color: hsl(var(--text-link)); }`     specificity (0,0,1)
2. design-tokens.css:[unlayered] `.text-on-primary { color: ...; }`        specificity (0,1,0)
3. design-tokens.css:@theme exposes `--color-on-primary` → utility            (idem)
4. site.css:[unlayered] `:where(a):is(.bg-primary, .bg-cta, .text-on-primary,
   .bg-highlight, .bg-sunken, .ak-btn-primary,
   .ak-btn-secondary, .ak-tier-pro, .ak-toggle button.on,
   .ak-tag.on, .ak-chip.on, .ak-side-filters button.on,
   .ak-step.on .ak-step-dot) { color: hsl(var(--text-on-primary)); }`     specificity (?)

Difference:
- `a` (0,0,1) — wins unlayered > any layered
- `.text-on-primary` (0,1,0) — utility unlayered, wins by specificity over `a`
- `:where(a):is(.text-on-primary)` — `:where` gives 0 specificity for `a`,
  `:is` resolves to `.text-on-primary` → effective specificity (0,1,0)

So: utility `.text-on-primary` and `:where(a):is(.text-on-primary)` tie.
Cascade resolution: last in source order wins. `site.css` is loaded AFTER
`design-tokens.css`, so `:where(a):is(.text-on-primary)` wins → color
text-on-primary.

Resultado: link con fondo cta → texto blanco. Correcto.
```

---

## Diagrama: cascade de dos archivos — `.ak-form-card` (pre/post F2)

**Pre-F2:**

```
.aform-card (site.css:585)
  padding: 40px;
  border-radius: var(--radius-2xl);

.ak-form-card (_contact.css)
  padding: 28px 32px;
  border-radius: var(--radius-xl);

In document order: _contact.css overrides site.css.
=> Effective: padding 28px 32px, radius-xl.
```

**Post-F2:**

```
site.css: NO define .ak-form-card (eliminado)
_contact.css:
  padding: 28px 32px;
  border-radius: var(--radius-xl);
=> Single source of truth.
```

---

## Tabla de escenarios por AC

| AC                                         | HP            | EC             |
| ------------------------------------------ | ------------- | -------------- |
| AC1-2 (z-index)                            | HP2           | —              |
| AC3 (§2.6)                                 | HP1           | —              |
| AC4 (§2.17)                                | HP1           | —              |
| AC5 (mapa)                                 | HP1           | —              |
| AC6 (regla)                                | HP1           | —              |
| AC7 (ADR)                                  | HP1           | EC1, EC11      |
| AC8 (keyframes)                            | HP1, HP9      | EC6, EC7       |
| AC9-18 (DUP)                               | HP3, HP8      | —              |
| AC19 (HC-1)                                | HP5           | —              |
| AC20-25 (HC-2…7)                           | HP1           | EC6, EC12      |
| AC26-31 (VISUAL)                           | HP4, HP6, HP8 | EC1, EC2, EC11 |
| AC32 (ServicesView)                        | HP7           | EC10           |
| AC33-38 (tests)                            | HP1           | —              |
| AC39 (inventario ≥30)                      | HP1           | —              |
| AC39a-c (substance por categoría)          | HP1           | —              |
| AC21b (sticky tops)                        | HP1           | EC3            |
| AC40-43 (gates)                            | HP10          | —              |
| AC28 (.ak-form-card único en _contact.css) | HP3           | —              |
| AC30 (picsum width/height)                 | HP1           | EC14           |
| AC34-36 (3 archivos de tests verdes)       | HP1           | —              |
| AC44 (score ≥85 scoreboard)                | HP10          | —              |
| TE-3.1.g (tile color text-on-primary)      | HP1           | —              |
