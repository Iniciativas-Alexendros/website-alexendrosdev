# Test Plan: catalog-pipeline-stripe

**Feature**: catalog-pipeline-stripe
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-04

---

## Estrategia

- **Unit** (Vitest/node): catálogo, invariantes, pipeline (transiciones válidas),
  auth CRM, generación invoice number, formatPrice.
- **Integración** (Vitest/node + vi.mock): 4 Route Handlers ampliados
  (checkout, stripe-webhook, CRM 10+ handlers). Mismo patrón `vi.hoisted()`.
- **Componentes** (Vitest/jsdom + RTL + MSW): `PurchaseCard` ampliada (toggle
  stripe/transferencia, recurring), `ServicesView` tiers recurring.
- **E2E** (Playwright + axe): flujos completos, a11y multi-ruta.
- **Agentes IA** (pytest + pytest-asyncio): 10 tests contra servicio FastAPI.

---

## F11 — Catálogo unificado

### Tests unit (10 tests)

| ID    | Assert                                                     |
| ----- | ---------------------------------------------------------- |
| T1.1  | `CATALOG.filter(i => i.type === "one_time").length >= 6`   |
| T1.2  | `CATALOG.filter(i => i.type === "recurring").length === 3` |
| T1.3  | `getCatalogItem("sesion-consultoria")?.amount === 6_000`   |
| T1.4  | `getCatalogItem("no-existe") === null`                     |
| T1.5  | `getCatalogItemsByType("recurring").length === 3`          |
| T1.6  | `CATALOG.every(i => i.amount >= 0)`                        |
| T1.7  | `new Set(CATALOG.map(i => i.id)).size === CATALOG.length`  |
| T1.8  | `PURCHASABLES.length === 3` (addon+consultoria)            |
| T1.9  | `TIERS.retainer.length === 3`                              |
| T1.10 | `formatPrice(69_000) === "690,00 €"`                       |

**Archivos**: ampliar `tests/unit/content-invariants.test.ts` + `tests/unit/checkout.test.ts`.

---

## F12 — Checkout unificado

### Integración (11 tests, ampliar `tests/integration/checkout.test.ts`)

| ID    | Assert                                                               |
| ----- | -------------------------------------------------------------------- |
| T2.1  | POST mode=subscription → `create` llamado con `mode: "subscription"` |
| T2.2  | POST recurring sin stripePriceId → `create` con `price_data`         |
| T2.3  | POST item one_time ignora mode=subscription → `create` con `payment` |
| T2.4  | POST con `{ item }` legacy → mismo comportamiento                    |
| T2.5  | POST con `itemId` + `item` → usa `itemId`                            |
| T2.6  | POST item inexistente → 422                                          |
| T2.7  | POST sin `itemId` ni `item` → 422                                    |
| T2.8  | Sin Stripe → 503 (mantener)                                          |
| T2.9  | Session sin URL → 502 (mantener)                                     |
| T2.10 | Stripe lanza → 502 (mantener)                                        |
| T2.11 | Rate-limit 5/min → 429 (mantener)                                    |

### Componente (5 tests, ampliar `tests/component/PurchaseCard.test.tsx`)

| ID    | Assert                                                          |
| ----- | --------------------------------------------------------------- |
| T2.12 | Recurring muestra "€1.290/mes"                                  |
| T2.13 | Recurring botón != "Pagar ahora"                                |
| T2.14 | Click recurring → POST con `mode: "subscription"` (MSW captura) |
| T2.15 | Loading state → botón disabled, "Redirigiendo…"                 |
| T2.16 | Error red → mensaje visible                                     |

### E2E (2 tests)

| ID    | Ruta          | Assert                             |
| ----- | ------------- | ---------------------------------- |
| T2.17 | `/servicios`  | Toggle retainer muestra 3 tiers    |
| T2.18 | `/escaparate` | PurchaseCards visibles con precios |

---

## F13 — Canal secundario

### Integración (10 tests, ampliar checkout.test.ts)

| ID    | Assert                                                                      |
| ----- | --------------------------------------------------------------------------- |
| T3.1  | POST transfer → `json.method === "transfer"`, `json.iban` definido          |
| T3.2  | POST transfer sin email → 422 (`fields.email`)                              |
| T3.3  | POST transfer sin name → 422                                                |
| T3.4  | POST transfer crea Invoice (`prisma.invoice.create` con `pending_transfer`) |
| T3.5  | POST transfer sin prisma → 503                                              |
| T3.6  | POST transfer sin TRANSFER_IBAN → 503                                       |
| T3.7  | Stripe session falla → paymentLink.create éxito → 200 `fallback: true`      |
| T3.8  | Ambos fallan → 502 `fallbackAttempted: true`                                |
| T3.9  | Sin Stripe → 503 con datos transferencia (si configurado)                   |
| T3.10 | Transfer email inválido → 422                                               |

### Componente (4 tests, ampliar PurchaseCard.test.tsx)

| ID    | Assert                                                  |
| ----- | ------------------------------------------------------- |
| T3.11 | Toggle Tarjeta/Transferencia visible                    |
| T3.12 | Modo transferencia: inputs email/name visibles          |
| T3.13 | POST transfer OK → instrucciones visibles (no redirige) |
| T3.14 | POST transfer error → mensaje error                     |

### E2E (2 tests)

| ID    | Ruta                         |
| ----- | ---------------------------- |
| T3.15 | Flujo transferencia completo |
| T3.16 | a11y PurchaseCard con toggle |

---

## F14 — Webhook ampliado + CRM API + Pipeline stages (9 stages)

### Migraciones: 3 nuevas (Subscription, seed stages, stripeInvoiceId).

### Webhook (6 tests, ampliar `tests/integration/stripe-webhook.test.ts`)

| ID   | Assert                                                                                  |
| ---- | --------------------------------------------------------------------------------------- |
| T4.1 | `invoice.paid` → `prisma.invoice.upsert` con `stripeInvoiceId`                          |
| T4.2 | `customer.subscription.updated` → `prisma.subscription.upsert`                          |
| T4.3 | `customer.subscription.deleted` → `subscription.cancelled` + `task.create`              |
| T4.4 | `checkout.session.completed` con `dealId` → `prisma.deal.update` stage "Cerrado ganado" |
| T4.5 | Sin prisma → 200 warn                                                                   |
| T4.6 | Persistencia falla → 500                                                                |

### CRM API (25 tests, nuevo `tests/integration/crm.test.ts`)

| ID    | Assert                                                          |
| ----- | --------------------------------------------------------------- |
| T4.7  | GET contacts → 200 array                                        |
| T4.8  | POST contact → 201                                              |
| T4.9  | POST email duplicado → 201 (Contact no unique email)            |
| T4.10 | POST sin firstName → 422                                        |
| T4.11 | GET deals → 200 array                                           |
| T4.12 | POST deal → 201 con stage "Nuevo" (order 0)                     |
| T4.13 | POST sin contactId → 422                                        |
| T4.14 | POST contactId inexistente → 422                                |
| T4.15 | PATCH deal stage → 200                                          |
| T4.16 | PATCH stageId inexistente → 422                                 |
| T4.17 | PATCH deal crea Activity transición                             |
| T4.18 | GET pipeline-stages → 200, 9 stages, ordenados                  |
| T4.19 | GET products → 200                                              |
| T4.20 | POST product → 201                                              |
| T4.21 | GET invoices → 200                                              |
| T4.22 | POST invoice → 201 con `number: "INV-YYYY-NNN"`                 |
| T4.23 | POST sin items → 422                                            |
| T4.24 | POST taxRate 0.21 → total correcto                              |
| T4.25 | PATCH invoice status: paid → 200                                |
| T4.26 | PATCH transición inválida → 422 (draft→paid sin pasar por sent) |
| T4.27 | Todos endpoints sin `X-API-Key` → 401                           |
| T4.28 | Key inválida → 401                                              |
| T4.29 | Sin `CRM_API_KEY` → 503                                         |
| T4.30 | Rate-limit 61 req → 429 + `Retry-After`                         |
| T4.31 | GET contacts `?status=CLIENT` filtra                            |

### Pipeline (10 tests unit, nuevo `tests/unit/pipeline.test.ts`)

| ID    | Assert                                                               |
| ----- | -------------------------------------------------------------------- |
| T4.32 | `getInitialStage` → stage con order 0 ("Nuevo")                      |
| T4.33 | `isValidTransition(0, 1)` → true (Nuevo → Contactado)                |
| T4.34 | `isValidTransition(0, 7)` → false (salto ilegal Nuevo → En progreso) |
| T4.35 | `isValidTransition(3, 9)` → true (Propuesta → Cerrado perdido)       |
| T4.36 | `isValidTransition(5, 6)` → true (Cerrado ganado → Onboarding)       |
| T4.37 | `isTerminalStage(5)` → true (Cerrado ganado)                         |
| T4.38 | `isTerminalStage(8)` → true (Entregado)                              |
| T4.39 | `isTerminalStage(9)` → true (Cerrado perdido)                        |
| T4.40 | `computeInvoiceTotals` calcula subtotal/tax/total                    |
| T4.41 | `generateInvoiceNumber` formato `INV-YYYY-NNN`                       |

Total F14: 6 + 25 + 10 = 41 tests.

---

## F15 — Agentes IA (servicio Python)

### Estructura: `agentes-ia-catalog/` con FastAPI + 5 routers + 3 agentes.

### Tests (10, pytest + pytest-asyncio)

| ID    | Assert                                                                 |
| ----- | ---------------------------------------------------------------------- |
| T5.1  | GET /health → 200, `status: "ok"`, agents definidos                    |
| T5.2  | POST /hooks/stripe → clasifica `payment_failure`                       |
| T5.3  | ≥3 fallos en 5 min → `escalate: true`                                  |
| T5.4  | POST /diagnose → ≥1 hipótesis con confidence                           |
| T5.5  | POST /repair retry_persistence → `success: true`                       |
| T5.6  | POST /repair con CRM API caída → `success: false`, operador notificado |
| T5.7  | POST /audit/deals → deals estancados, `alertsSent: true`               |
| T5.8  | Sin Ollama → health `ollama: false`, hooks siguen funcionando          |
| T5.9  | Sin cloud API → health `cloud_api: false`, diagnose error controlado   |
| T5.10 | Auditor envía email vía Resend                                         |

---

## F16 — E2E + Gates finales

### E2E (8 tests)

| ID   | Ruta                | Assert                            |
| ---- | ------------------- | --------------------------------- |
| T6.1 | `/servicios`        | Toggle retainer, 3 tiers visibles |
| T6.2 | `/servicios`        | 3 PurchaseCards addons visibles   |
| T6.3 | `/escaparate`       | ≥1 proyecto featured visible      |
| T6.4 | `/escaparate`       | 3 PurchaseCards visibles          |
| T6.5 | `/checkout/success` | Mensaje de confirmación           |
| T6.6 | `/servicios`        | axe-core sin críticos             |
| T6.7 | `/escaparate`       | axe-core sin críticos             |
| T6.8 | `/checkout/success` | axe-core sin críticos             |

### Gates de calidad (8 tests de sistema)

| ID    | Gate                | Comando              | Umbral              |
| ----- | ------------------- | -------------------- | ------------------- |
| T6.9  | Coverage statements | `pnpm test:coverage` | ≥85%                |
| T6.10 | Coverage branches   | `pnpm test:coverage` | ≥80%                |
| T6.11 | Coverage functions  | `pnpm test:coverage` | ≥85%                |
| T6.12 | Coverage lines      | `pnpm test:coverage` | ≥85%                |
| T6.13 | ESLint 0            | `pnpm lint`          | Exit 0              |
| T6.14 | TypeScript 0        | `pnpm typecheck`     | Exit 0              |
| T6.15 | Build               | `pnpm build`         | Exit 0, todas rutas |
| T6.16 | Formato             | `pnpm format:check`  | Exit 0              |

---

## Cobertura objetivo por fase

| Fase | Stmts | Brchs | Funcs | Lines | Nota                                 |
| ---- | ----- | ----- | ----- | ----- | ------------------------------------ |
| Base | 96    | 89    | 98    | 96    | Actual (101 tests)                   |
| F11  | 95    | 88    | 97    | 95    | Código nuevo sin tests aún           |
| F12  | 93    | 87    | 94    | 93    | Checkout ampliado                    |
| F13  | 92    | 86    | 93    | 92    | Transferencia + Payment Link         |
| F14  | 88    | 83    | 90    | 88    | CRM API (10+ handlers, mucho código) |
| F14+ | 90    | 85    | 92    | 90    | Tras 41 tests CRM                    |
| F16  | ≥85   | ≥80   | ≥85   | ≥85   | **Gate lock-in final**               |

---

## Orden de ejecución orquestada (DAG)

```
F11 (catálogo) ─┬─► F12 (checkout unified) ─► F13 (fallback)
                │
                └─► F14 (CRM API + webhook) ─► F15 (agentes IA)
                                                    │
                ┌───────────────────────────────────┘
                ▼
              F16 (E2E + gates)
```

**Paralelismo**: F14 arranca en worktree independiente tras F11 (no depende
de F12/F13, solo del schema Prisma existente y del catálogo). F12 y F13 son
secuenciales (F13 extiende el checkout de F12).

---

## Archivos a crear/modificar por fase

| Fase | CREATE                                                                                                                                                                                                                                                                                                                                                                                                                                    | EDIT                                                                                                                                                                                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F11  | `src/lib/content/catalog.ts`                                                                                                                                                                                                                                                                                                                                                                                                              | `services.ts`, `checkout.ts`, `types.ts`, `index.ts`, `tests/unit/content-invariants.test.ts`, `tests/unit/checkout.test.ts`                                                                                                                                    |
| F12  | —                                                                                                                                                                                                                                                                                                                                                                                                                                         | `app/api/checkout/route.ts`, `lib/validation.ts`, `components/sections/checkout/PurchaseCard.tsx`, `components/sections/services/ServicesView.tsx`, `tests/integration/checkout.test.ts`, `tests/component/PurchaseCard.test.tsx`, `tests/e2e/services.spec.ts` |
| F13  | —                                                                                                                                                                                                                                                                                                                                                                                                                                         | `app/api/checkout/route.ts`, `lib/validation.ts`, `lib/stripe.ts`, `PurchaseCard.tsx`, `tests/integration/checkout.test.ts`, `tests/component/PurchaseCard.test.tsx`, `tests/e2e/checkout.spec.ts`, `.env.example`                                              |
| F14  | `lib/crm-auth.ts`, `lib/crm/pipeline.ts`, `lib/crm/invoice-number.ts`, `app/api/crm/contacts/route.ts`, `app/api/crm/deals/route.ts`, `app/api/crm/deals/[id]/route.ts`, `app/api/crm/pipeline-stages/route.ts`, `app/api/crm/products/route.ts`, `app/api/crm/invoices/route.ts`, `app/api/crm/invoices/[id]/route.ts`, `app/api/crm/activities/route.ts`, 3 migraciones, `tests/integration/crm.test.ts`, `tests/unit/pipeline.test.ts` | `app/api/stripe/webhook/route.ts`, `lib/validation.ts`, `schema.prisma`, `tests/integration/stripe-webhook.test.ts`, `.env.example`                                                                                                                             |
| F15  | Repo `agentes-ia-catalog/` completo (16 archivos)                                                                                                                                                                                                                                                                                                                                                                                         | —                                                                                                                                                                                                                                                               |
| F16  | —                                                                                                                                                                                                                                                                                                                                                                                                                                         | `tests/e2e/*.spec.ts`, `vitest.config.ts`, `ROADMAP.md`, `ARCHITECTURE.md`, `CLAUDE.md`                                                                                                                                                                         |

---

## Instrucciones para MiniMax M3 (orquestador)

### Prompt de sesión para cada fase

```
[CACHÉ] Cargá specs/catalog-pipeline-stripe/{spec,contract,scenarios,test-plan}.md
[CACHÉ] Cargá ARCHITECTURE.md, ROADMAP.md, CLAUDE.md, prisma/schema.prisma

FASE [N]: [nombre de la fase]

DEPENDENCIAS COMPLETADAS: [lista de fases previas mergeadas a main]
WORKTREE: wt/catalog-pipeline-str-f[N] (crear desde main si no existe)

PASOS:
1. Leé test-plan.md sección F[N] → lista de tests a escribir.
2. Escribí los tests PRIMERO. Ejecutá → deben fallar (RED).
3. Implementá el código mínimo listado en la matriz de archivos.
4. Ejecutá tests → deben pasar (GREEN).
5. Refactorizá manteniendo GREEN.
6. Ejecutá pnpm lint && pnpm typecheck && pnpm build → 0 errors.
7. Si todo verde: merge a main, actualizá ROADMAP.md (marcar fase como hecha).
8. Reportá: tests ejecutados, cobertura, diff resumen.

REGLAS:
- No modificar archivos fuera de la matriz de la fase.
- No romper tests existentes (pnpm test:coverage completo antes de merge).
- Si un test existente falla, parar y diagnosticar con agente debug.
- Worktrees paralelos para F12+F14 (no comparten archivos críticos).
- Presupuesto: mensajes ≤500 palabras, código conciso.
```

### Sesión de cierre (F16)

```
FASE 16: E2E + Gates finales

WORKTREE: wt/catalog-pipeline-str-f16 (merge final desde main con todas las
fases previas integradas).

PASOS:
1. Ejecutar TODOS los tests: unit + integration + component + e2e.
2. Ajustar vitest.config.ts con thresholds finales (85/80/85/85).
3. Ejecutar pnpm lint && pnpm typecheck && pnpm format:check && pnpm build.
4. Ejecutar auditoría completa: pnpm audit:lh && pnpm audit:a11y.
5. Actualizar ROADMAP.md: marcar F11–F16 como hechas.
6. Actualizar ARCHITECTURE.md: nuevas rutas API CRM, nueva tabla Subscription.
7. Actualizar CLAUDE.md: stack (agentes IA Python), estado (CRM API funcional).
8. Commit final: "feat(catalog-pipeline): catálogo unificado, Stripe recurring,
   canal transferencia + Payment Link fallback, CRM API (9 stages), agentes IA
   autónomos (Python/FastAPI)."
9. Reporte final: cobertura, tests totales (unit+int+comp+e2e+pytest), build time.

Si algún gate falla → no mergear. Diagnosticar con agente debug.
```
