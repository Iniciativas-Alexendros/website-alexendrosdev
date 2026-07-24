# Spec: design-system-fixes-batch2 — Delta sobre design-system-truth

**Feature**: `design-system-fixes-batch2`
**Estado**: borrador → testing en curso
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-24
**Spec padre**: `specs/design-system-truth/spec.md` (49 AC, 24 tests, ya implementados)
**SHA auditado**: post-F2-batch2 de `design-system-truth`

## Contexto y motivación

`design-system-truth` corrigió las 9 DUP, 7 HC, 6 VISUAL y los 4 errores factuales de DESIGN.md. Esta sub-spec `design-system-fixes-batch2` es **delta puntual** sobre ese estado: cierra las 2 violaciones `var(--ak-*, rgba)` que aún persisten en `src/components/sections/checkout/PurchaseCard.tsx` L216+L231 (de un total de 7 violaciones históricas), documenta los 18 tokens sin uso como **deprecated candidates** con política explícita, y lock-in con tests visuales (axe + computed-style) las 3 cards PayloadCard / TransferCard / FormCard.

**Decisión de arquitectura:** este spec NO redefine tokens, NO añade layout patterns, NO re-estructura archivos CSS. Es puramente un cierre de observaciones del scoreboard (`scripts/audit-design-system.mjs`) que ya centralizó las discrepancies. Heredamos todas las invariantes CSS del contrato padre (`specs/design-system-truth/contract.md` §1–§5); este spec sólo añade RF11–RF13 a nivel operacional.

**Aclaración importante:** el script `scripts/fix-token-coverage.mjs` (auto-fixer) tiene un bug de regex (`[^()]*` no soporta paréntesis anidados en fallbacks como `rgba(...)` o `hsl(...)`). Para este batch, **las 2 correcciones se aplican directamente con str_replace** sobre `PurchaseCard.tsx`. El fix del script queda en backlog (P3, no-objetivo de batch2) — es YAGNI hasta que aparezca una nueva generación masiva de violaciones.

## Scope

| En scope                                          | Fuera de scope                                        |
| ------------------------------------------------- | ----------------------------------------------------- |
| 2 violaciones reales en PurchaseCard.tsx          | Reescritura general del fix-token-coverage.mjs        |
| Documentación de 18 unused tokens como deprecated | 49 AC del truth spec (ya cerrados)                    |
| axe + computed-style locks para 3 cards           | Nuevas DUPs/HCs/VISUALs (no detectadas en 2026-07-24) |
| tests/unit + tests/e2e                            | Cambios en componentes fuera de PurchaseCard          |

## Requerimientos funcionales

### RF11 — Eliminar las 2 violaciones restantes de `PurchaseCard.tsx` (P0)

Las 2 ocurrencias de `"1px solid var(--ak-border, rgba(0,0,0,0.15))"` (líneas 216 y 231 según audit-token-coverage.json `doubleViolations[*].line`) son fallbacks hardcoded-clients. Reemplazar por el token canónico `--border` (definido en `design-tokens.css`, usado 32 veces — `audit-design-system.mjs score 90/99`):

| Antes                                                     | Después                                   |
| --------------------------------------------------------- | ----------------------------------------- |
| `border: "1px solid var(--ak-border, rgba(0,0,0,0.15))",` | `border: "1px solid hsl(var(--border))",` |

> Nota: `--ak-border` no existe como token definido (sólo como usage en PurchaseCard.tsx, count=2). El token canónico es `--border`. La estrategia de reemplazo NO mapear uno-a-uno sino renombrar al token canónico, garantizando que el cambio sea visible y testeable.

**AC46 — AC47.**

### RF12 — Política de deprecation para los 18 tokens unused

`docs/DESIGN.md` §1.5 ya contiene la tabla con la lista. Esta spec **NO cambia DESIGN.md** — sólo lockea con un TU que asserts la presencia de los 18 tokens en la sección de deprecation. Política por token:

| Categoría                                                                                                                            | Política                                 | Acción                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-6`, `--space-8`, `--space-12`, `--space-16`, `--space-20`, `--space-24` | **Consolidar**                           | 10 spacings legacy scale → conviven con `--space-2xs..3xl` (scale canónica). No eliminados aún por seguridad; auditoría post-MarkdownSectionSupport decidirá. |
| `--gutter-sm`, `--gutter-lg`                                                                                                         | **Re-evaluar tras CheckThat... rebrand** | Bloqueado en F18 (responsive + i18n). Mantener; re-evaluar.                                                                                                   |
| `--radius-interactive`                                                                                                               | **Eliminar**                             | Sin callers en código; `--radius-*` scale ya cubre todas las affordances actuales.                                                                            |
| `--z-modal`, `--z-overlay`, `--z-sticky`, `--z-tooltip`                                                                              | **Reservar**                             | Para futuras implementaciones de modales, tooltips, dropdowns (F18+). Mantenidos.                                                                             |
| `--ease-bounce`                                                                                                                      | **Reservar**                             | Sin uso aún; posible CTA emphasis en F18. Mantenido.                                                                                                          |

**AC48 — AC49.**

### RF13 — Lock-in visual de las 3 cards (P1)

3 elementos visuales que transportan el sistema de tokens a producción. Cada uno validado con axe-clean + computed-style lock + (opcional) snapshot:

| Card                              | Ruta                   | className                                                             | Tests                                                                                |
| --------------------------------- | ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **PurchaseCard** (Stripe buy)     | `/checkout`            | `.ak-tier`                                                            | axe `wcag2aa` 0 critical+serious, computed border-color matches `hsl(var(--border))` |
| **TransferCard** (transfer state) | `/checkout` (post-buy) | `.ak-tier` mismo selector, modo `data-testid="transfer-instructions"` | axe dinámico (visibilidad condicional)                                               |
| **ContactCard** (form)            | `/contacto`            | `.ak-form-card`                                                       | axe + snapshot vía `tests/e2e/visual-snapshot.spec.ts TE-3.2.a` ya existente         |

**AC50 — AC52.**

## Orden de ejecución (integrado con design-system-truth)

```
F2-truth (cerrado) ─┬─► F0-batch2 (READ tests lock-in, RED ahora) [ya cumplido: suite 543 → 545 tests]
                    │
                    ├─► F1-batch2 (este spec escrito)
                    │
                    ├─► F2-batch2 (hand-fix PurchaseCard.tsx ← ESTE TURN)
                    │
                    └─► F3-batch2 (validación final + sumisión)
```

## Métricas

| Métrica                        | Pre-batch2      | Post-batch2 (target)                                               |
| ------------------------------ | --------------- | ------------------------------------------------------------------ |
| `pnpm audit:tokens` violations | 2               | **0**                                                              |
| Token coverage                 | 90.91%          | 90.91% (sin cambio — usage count se mantiene; sólo renormalizamos) |
| axe `/checkout`                | (no medido)     | 0 critical/serious                                                 |
| axe `/contacto`                | (snapshot-only) | 0 critical/serious + snapshot match ≥95%                           |

## Dependencias

Sin nuevas. Mantengo `vitest`, `@playwright/test`, `@axe-core/playwright` ya en repo.

## Acceptance final

`pnpm test:coverage tests/unit/design-system-fixes-batch2.test.ts` → 100% verde, `pnpm e2e design-system-fixes-batch2` → 0 fail, `pnpm audit:tokens` → 0 violations. Lock-in.
