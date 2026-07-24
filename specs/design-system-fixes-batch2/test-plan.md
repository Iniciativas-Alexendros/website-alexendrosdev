# Test Plan: design-system-fixes-batch2

**Feature**: `design-system-fixes-batch2`
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-24

---

## Files to create

| Path                                            | Tipo   | Descripción                      |
| ----------------------------------------------- | ------ | -------------------------------- |
| `tests/unit/design-system-fixes-batch2.test.ts` | CREATE | TU-1.1..1.5 + lock regresivo     |
| `tests/e2e/design-system-fixes-batch2.spec.ts`  | CREATE | TE-1.1..1.4 axe + computed-style |

---

## TU — Tests Unit (Vitest node)

Archivo: `tests/unit/design-system-fixes-batch2.test.ts`

| ID         | Assert                                                                                                                                 | Cómo                                                                                                                                                               | Vinculado a |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| **TU-1.1** | `PurchaseCard.tsx` no contiene `var(--ak-` (zero matches)                                                                              | `grep` source via `readFileSync` + regex `/var\(--ak-/g` count                                                                                                     | RF11 AC46   |
| **TU-1.2** | `PurchaseCard.tsx` no contiene `var(--*-con-fallback-literal)` — específicamente `rgba(`, `#`, `hsl(` dentro de `var(...)` segundo arg | regex `/var\(--[^,]+,\s*(?:rgba                                                                                                                                    | #           | hsl)/g` count = 0 | RF11 AC47 |
| **TU-1.3** | `audit-token-coverage.mjs --json` reporta `violations.count === 0`                                                                     | `execSync('node scripts/audit-token-coverage.mjs --json')` + parse                                                                                                 | RF11 AC48   |
| **TU-1.4** | `PurchaseCard.tsx` líneas 216 + 231 contienen `hsl(var(--border))`                                                                     | `readFileSync` + split lines + assertion                                                                                                                           | RF11 AC46   |
| **TU-1.5** | `docs/DESIGN.md` §1.5 contiene los 18 nombres de tokens                                                                                | `readFileSync` + match string array `[ 'ease-bounce', 'gutter-lg', 'gutter-sm', 'radius-interactive', 'space-1', 'space-12', ..., 'z-tooltip' ]` cada uno presente | RF12 AC49   |

## TE — Tests E2E (Playwright + axe-core)

Archivo: `tests/e2e/design-system-fixes-batch2.spec.ts`. Imports axe-core via `@axe-core/playwright`.

| ID         | Ruta        | Assert                                                                                                                                                                 | Vinculado a |
| ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **TE-1.1** | `/checkout` | `axe.run({ tags: ['wcag2a', 'wcag2aa', 'wcag21aa'] })` 0 violations `critical` o `serious`. Carrego con `data-theme="light"` por default.                              | RF13 AC50   |
| **TE-1.2** | `/checkout` | `getComputedStyle(emailInput).borderColor !== 'rgb(0, 0, 0)'` AND `borderColor.match(/^rgb\(/)` (lock de que proviene de hsl(var(--border)) y NO de un literal negro). | RF11 + RF13 |
| **TE-1.3** | `/contacto` | axe-core 0 violations critical/serious (mismas tags)                                                                                                                   | RF13 AC51   |
| **TE-1.4** | `/contacto` | `.ak-form-card` element exists + visible + computed border-color via `--border`                                                                                        | RF13 AC52   |

### TS — Accept criteria scripts

| ID         | Comando             | Criterio                                                                                | Vinculado a |
| ---------- | ------------------- | --------------------------------------------------------------------------------------- | ----------- |
| **TS-1.1** | `pnpm spec:audit`   | exit 0; el nuevo spec `design-system-fixes-batch2/` aparece en el set, 0 refs huérfanas | Cross-ref   |
| **TS-1.2** | `pnpm audit:tokens` | exit 0; violations count = 0                                                            | RF11        |

---

## Mocking & fixtures

- **Sin mocks** para TU: leemos filesystem y audit-script outputs directamente.
- **Para TE**: Playwright levanta `next build` vía webServer (config existente en `playwright.config.ts` con baseURL `http://localhost:${PORT}` y `webServer: { command: 'pnpm dev', ... }` o similar). Sin mocks de red.

---

## Acceptance final

```bash
# Trio de CI
pnpm lint                             # 0 errors
pnpm typecheck                        # 0 errors
pnpm test                             # 545 tests verdes (543 heredados + 2-5 nuevos batch2)
pnpm audit:tokens                     # 0 violations
pnpm spec:audit                       # exit 0; design-system-fixes-batch2/ tracked
pnpm e2e design-system-fixes-batch2   # 0 violations axe + 0 computed-style mismatches
```

### Criterio de cierre

- ✅ TU-1.1..1.5 todos pasan.
- ✅ TE-1.1..1.4 todos pasan (axe + computed-style).
- ✅ TS-1.1, TS-1.2 todos pasan.
- ✅ Total delta: +5 unit tests (TU), +4 e2e tests (TE).
- ✅ `audit-design-system.mjs` score baja un peldaño en "violations" pero coverage mantener ≥90%.

### File lock-in

`PurchaseCard.tsx` con `hsl(var(--border))` en líneas 216 + 231 (post-fix) es estado locked-in. Cualquier revert reintroducirá `var(--ak-border, …)` que rompe TU-1.1, TU-1.2, TU-1.4.

---

## Cobertura final esperada

| Suite                  | Antes                                                                                                                                             | Después | Δ   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --- |
| Unit (Vitest)          | 543                                                                                                                                               | 548     | +5  |
| E2E (Playwright + axe) | ya con `tests/e2e/a11y.spec.ts` axe base + `tests/e2e/visual-snapshot.spec.ts` snapshots → batch2 añade +4 a `design-system-fixes-batch2.spec.ts` | +       |

Total Δ: **+5 unit + 4 e2e = 9 tests nuevos**, sin tocar suites existentes.
