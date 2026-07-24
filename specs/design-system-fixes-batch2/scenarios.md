# Scenarios: design-system-fixes-batch2

**Feature**: `design-system-fixes-batch2`
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-24

---

## Happy Paths

### HP-1 · PurchaseCard renders with token-based border

**Given** el usuario navega a `/checkout`
**When** la página carga con la `PurchaseCard` (`.ak-tier`) renderizada
**Then** el `border` del campo email y nombre debe leerse `hsl(var(--border))` (no `rgba(0,0,0,0.15)` literal)
**And** axe-core debe devolver 0 violations `critical`/`serious` con tags `wcag2aa`
**Vinculado a**: AC46 · TU-1.4 · TE-1.1 · TE-1.2

### HP-2 · TransferCard renders in transfer mode

**Given** el usuario selecciona método `transferencia` en `PurchaseCard`
**When** completa los campos `email` + `nombre` y pulsa "Solicitar datos de transferencia"
**While** la petición `POST /api/checkout` con `paymentMethod=transfer` resuelve 200 con `{ method: "transfer", iban, beneficiary, ... }`
**Then** la misma `PurchaseCard (.ak-tier)` se re-renderiza con `[data-testid="transfer-instructions"]`
**And** la computed-color de border se mantiene estable entre los dos estados (token-driven).
**Vinculado a**: AC50 · TE-1.2

### HP-3 · ContactCard renders in /contacto

**Given** el usuario navega a `/contacto`
**When** la página renderiza con `ContactView` y termina de hidratar
**Then** el elemento `.ak-form-card` es visible con border aplicado vía `--border` token
**And** axe-core 0 violations critical/serious
**Vinculado a**: AC51 · TE-1.3 · TE-1.4

### HP-4 · Token coverage report sin violations

**Given** corres `node scripts/audit-token-coverage.mjs` (o `pnpm audit:tokens`)
**When** la salida JSON se genera
**Then** `violations.count === 0` y `violations.byKind['var-with-hardcoded-fallback']` es 0
**And** `coverage.coveragePercent` se mantiene ≥90% (90/99)
**Vinculado a**: AC48 · TU-1.3

### HP-5 · DESIGN.md §1.5 deprecation table refleja los 18 tokens

**Given** `docs/DESIGN.md` §1.5 está generada con el flujo `--out` del script
**When** parseas la tabla markdown
**Then** los 18 tokens specific aparecen listados bajo su categoría con su acción recomendada
**Vinculado a**: AC49 · TU-1.5

---

## Edge Cases

### EC-1 · Dark mode fuerza semantic color sobre PurchaseCard

**Given** el sitio tiene `data-theme="dark"` activo en `<html>`
**When** navegas a `/checkout`
**Then** el border-color computado del input email/nombre debe ler `rgb(<dark-border-rgb>)` (distinto de light — thicker contrast)
**And** la REVERSE: no aparece `rgb(255,255,255)` ni `rgb(0,0,0)` literales como border-color.
**Vinculado a**: TE-1.2 (computed style assertion con parameter `theme`).

### EC-2 · Viewport <360px mantiene border-color token

**Given** viewport reducido a 320px (mobile ultra-estrecho)
**When** navegas a `/checkout`
**Then** el `border-color` del input sigue siendo el valor dark/light-mode del token, no se reduce a `transparent` ni override
**Vinculado a**: TE-1.1 (axe passes con viewport ajustado).

### EC-3 · Token `--border` realmente definido en design-tokens.css

**Given** el sistema carga en cold-start (microtask reset de tokens)
**When** parseas `--border` desde el CSS computado de PurchaseCard
**Then** el valor en `:root` debe ser un triplet HSL válido (e.g. `220 13% 91%` o similar — no `none`, no `unset`).
**Vinculado a**: TU-1.4 (cross-with audit).

### EC-4 · `purchaseCard.tsx` con cold-cache sin tokens resueltos

**Given** el `var(--border)` resuelve a `unset` por error de orden de @import
**When** PurchaseCard renderiza
**Then** el último en cascada (token-driven) gana → no debería haber fallback visible.
**Vinculado a**: EC-3 (defensa en profundidad).

### EC-5 · Imports orden es estable

**Given** globals.css
**When** parseas las líneas `@import`
**Then** el orden es EXACTAMENTE `tailwindcss source(none); @source …; design-tokens.css; site.css; _projects.css; _contact.css; _navbar.css; _services.css` (no se introducen líneas divergentes)
**Vinculado a**: TS-1.1 (cross-ref con truth spec §2.1).

---

## Resumen de cobertura

Cobertura total: 5 happy paths + 5 edge cases = 10 escenarios verificables, cada uno con al menos un test (TU-TE-TS) que lo cubre.
