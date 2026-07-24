# Contract: design-system-fixes-batch2 (delta)

**Feature**: `design-system-fixes-batch2`
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-24
**Spec padre (full contract)**: `specs/design-system-truth/contract.md`

---

## 1. Herencia explícita

Este contract añade **sólo deltas** sobre `design-system-truth/contract.md`. Cualquier invariante de CSS no mencionada aquí permanece EXACTAMENTE como en el padre. En concreto:

- §1 tokens canónicos de `design-tokens.css` (incl. `--z-*`, `--container-px`, `--header-height`, `--gutter-md`, `--fs-price`, `--fs-metric`) → **invariante heredada**.
- §2 inventario de archivos CSS y convención arquitectónica → **invariante heredada**.
- §3 clases canónicas por archivo → **invariante heredada**.
- §4 ADR-001 sobre `:where(a):is(...)` → **invariante heredada**.
- §5 hash de invariantes CSS (TU-X.Y) → **invariante heredada**.

---

## 2. Token mapping de RF11 (única sustitución de este batch)

### 2.1 Mapping table

Esta es la **única sustitución** permitida en este batch. Otros patrones `var(--ak-*, fallback)` no están en scope.

| Token incorrecto  | Fallback actual    | Token canónico sucesor | Uso final            |
| ----------------- | ------------------ | ---------------------- | -------------------- |
| `var(--ak-border` | `rgba(0,0,0,0.15)` | `var(--border)`        | `hsl(var(--border))` |

### 2.2 Forma del reemplazo

**Antes (verbatim):** `"1px solid var(--ak-border, rgba(0,0,0,0.15))"`
**Después (verbatim):** `"1px solid hsl(var(--border))"`

### 2.3 Por qué `hsl(var(--border))` y no `var(--border)` directas

`--border` en `design-tokens.css` está definido como un valor `H S L` triplete sin la función `hsl(...)` envolvente (convención HSL channels para permitir `<alpha>` modifiers en `hsl(--border / 0.2)` style). El valor directo `var(--border)` daría `H S L` que es CSS inválido. La forma canónica de aplicación es `hsl(var(--border))`. Esto es la práctica ya extendida en el repo (ver `audit-token-coverage.mjs` `usedTokens[*].hits[*].context` — todas las hits usan `hsl(...)` envolvente).

### 2.4 Pre-condición del reemplazo

PurchaseCard.tsx debe **NO** contener `var(--ak-` ni `var(--ak-border` ni ningún `var(--*-fallback` después de aplicado.

---

## 3. Deprecation policy para los 18 tokens unused (RF12)

### 3.1 Tabla de tokens declared-but-unused (canonical de audit-token-coverage)

Origen: `audit-token-coverage.mjs` `unusedTokens[].length === 18` (estado 2026-07-24).

Cada token tiene una **política de deprecation** locked-in en DESIGN.md §1.5 (ya existe desde F1 del truth spec). Este contrato re-clasifica por categoría para guiar futuras decisiones de removal/consolidation:

| #   | Token                | Categoría            | Política lockada | Acción recomendada                     |
| --- | -------------------- | -------------------- | ---------------- | -------------------------------------- |
| 1   | `ease-bounce`        | Motion easing        | Reservar         | Mantener hasta F18 (i18n motion work). |
| 2   | `gutter-lg`          | Layout gutter        | Re-evaluar F18   | Bloqueado en F18 responsive.           |
| 3   | `gutter-sm`          | Layout gutter        | Re-evaluar F18   | Bloqueado en F18 responsive.           |
| 4   | `radius-interactive` | Radius scale         | **Eliminar**     | Sin callers; `--radius-*` scale cubre. |
| 5   | `space-1`            | Spacing scale legacy | Consolidar       | Subset de `--space-2xs..3xl` canónica. |
| 6   | `space-2`            | Spacing scale legacy | Consolidar       | Idem.                                  |
| 7   | `space-3`            | Spacing scale legacy | Consolidar       | Idem.                                  |
| 8   | `space-4`            | Spacing scale legacy | Consolidar       | Idem.                                  |
| 9   | `space-6`            | Spacing scale legacy | Consolidar       | Idem.                                  |
| 10  | `space-8`            | Spacing scale legacy | Consolidar       | Idem.                                  |
| 11  | `space-12`           | Spacing scale legacy | Consolidar       | Idem.                                  |
| 12  | `space-16`           | Spacing scale legacy | Consolidar       | Idem.                                  |
| 13  | `space-20`           | Spacing scale legacy | Consolidar       | Idem.                                  |
| 14  | `space-24`           | Spacing scale legacy | Consolidar       | Idem.                                  |
| 15  | `z-modal`            | Z-index reserved     | Reservar         | Mantener hasta F18 (modal system).     |
| 16  | `z-overlay`          | Z-index reserved     | Reservar         | Idem.                                  |
| 17  | `z-sticky`           | Z-index reserved     | Reservar         | Idem.                                  |
| 18  | `z-tooltip`          | Z-index reserved     | Reservar         | Idem.                                  |

### 3.2 Tabla canon en DESIGN.md §1.5 (referencia)

Esta spec NO modifica `docs/DESIGN.md`. La tabla en §1.5 está generada automáticamente por `scripts/fix-token-coverage.mjs --json` (estado actual ya renderizado desde F1-truth). El lock-in test `TU-1.5` valida que la tabla contiene los 18 tokens names.

---

## 4. Rutas e2e validadas para RF13 (lock-in 3 cards)

| Card         | Ruta canónica Next.js                            | Página archivo                              | Componente                                          | className                                              |
| ------------ | ------------------------------------------------ | ------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| PurchaseCard | `/checkout`                                      | `src/app/checkout/page.tsx`                 | `src/components/sections/checkout/PurchaseCard.tsx` | `.ak-tier`                                             |
| TransferCard | `/checkout` (mismo path, modo transfer post-buy) | Idem                                        | Idem                                                | `.ak-tier` con `[data-testid="transfer-instructions"]` |
| ContactCard  | `/contacto`                                      | `src/app/contacto/page.tsx` (autoverificar) | form system                                         | `.ak-form-card`                                        |

---

## 5. Schema de tests (vinculado a test-plan.md)

| Test ID | Tipo   | Archivo                                         | Assert principal                                                                                               |
| ------- | ------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| TU-1.1  | Unit   | `tests/unit/design-system-fixes-batch2.test.ts` | `PurchaseCard.tsx` no contiene `var(--ak-`                                                                     |
| TU-1.2  | Unit   | Idem                                            | `PurchaseCard.tsx` no contiene `var(--*-fallback` con `rgba(`, `#`, `hsl(` en fallback                         |
| TU-1.3  | Unit   | Idem                                            | `audit-token-coverage --json` running muestra `violations.count === 0`                                         |
| TU-1.4  | Unit   | Idem                                            | `PurchaseCard.tsx` lines 216+231 Post-fix contienen `hsl(var(--border))` (verifica la sustitución aplicada)    |
| TU-1.5  | Unit   | Idem                                            | `docs/DESIGN.md §1.5` lista los 18 tokens por nombre                                                           |
| TE-1.1  | E2E    | `tests/e2e/design-system-fixes-batch2.spec.ts`  | `/checkout` axe-core 0 critical/serious (wcag2aa tags)                                                         |
| TE-1.2  | E2E    | Idem                                            | `/checkout` `.ak-tier` computed `border-color` matches `hsl(<border-rgb-value>)` (locks the token application) |
| TE-1.3  | E2E    | Idem                                            | `/contacto` axe-core 0 critical/serious                                                                        |
| TE-1.4  | E2E    | Idem                                            | `/contacto` `.ak-form-card` computed border same lock                                                          |
| TS-1.1  | Script | `scripts/audit-spec-coherence.mjs`              | Cambio cohérence: este spec entra en el set; cross-refs OK                                                     |

---

## 6. Sin nuevas variables de entorno

Sin additions. Spec puramente de cliente.

## 7. Sin nuevas deps

## 8. Sin nuevas migraciones (no toca DB)
