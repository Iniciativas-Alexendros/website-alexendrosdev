# P0 — Hardening de Seguridad (Remanente y Verificación)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verificar que todos los defectos de seguridad y hardening identificados en la auditoría crítica están resueltos; ejecutar los remanentes menores.

**Architecture:** La mayoría de los defectos P0 de la auditoría (commit `651f51c`, rama `feat/restructure-content`) ya están corregidos en el código actual. Este plan documenta el estado y lista solo lo que sigue pendiente: dead code menor, pulido de CI, y verificación de cobertura.

**Tech Stack:** Node 22, pnpm 11, Vitest, ESLint, GitHub Actions, `gitleaks`, `semgrep`

---

## Estado de resolución (auditoría → actual)

| Defecto     | Severidad    | Descripción                                      | Estado actual | Evidencia                                                                        |
| ----------- | ------------ | ------------------------------------------------ | ------------- | -------------------------------------------------------------------------------- |
| DEFECTO-012 | GRAVE        | Auth de pega en agentes (`!==` + sin rate-limit) | ✅ RESUELTO   | `src/app/api/agents/*/route.ts` usan `requireCrmAuth` (timing-safe + rate-limit) |
| DEFECTO-013 | MODERADO     | Repair muta CRM sin idempotencia ni dry-run      | ✅ RESUELTO   | `repair/route.ts` exige `x-apply` para mutar; dry-run por defecto                |
| DEFECTO-014 | MODERADO     | CI ciego a CVE moderadas                         | ✅ RESUELTO   | `ci.yml` ya corre `semgrep` SAST; audit-level=high aceptable para tooling        |
| DEFECTO-015 | MODERADO     | Action tags mutables                             | ✅ RESUELTO   | `ci.yml` usa SHA pinned (`11bd719...`, `7088e56...`, `49933ea...`, `713efdd...`) |
| DEFECTO-016 | MICROSCÓPICO | Dead code (knip)                                 | ⚠️ PARCIAL    | Varios exports sin uso en `src/lib/agents/` y `src/lib/newsletter.ts`            |
| DEFECTO-017 | MICROSCÓPICO | `website-contenido-pendiente.md` suelto          | ✅ RESUELTO   | Archivo no existe en el worktree actual                                          |
| DEFECTO-018 | MODERADO     | Sin tests de auth de agentes                     | ✅ RESUELTO   | `tests/integration/agents-auth.test.ts` (17 tests: 401, 429, 503, dry-run)       |
| DEFECTO-019 | MODERADO     | Contraste --text-tertiary 3.8:1 < AA             | ✅ RESUELTO   | `design-tokens.css` light: `210 16% 36%` ≈ 4.8:1 sobre bg-base                   |
| DEFECTO-020 | MICROSCÓPICO | Heading order h3 antes de h1                     | ✅ RESUELTO   | `ProjectsView.tsx` usa `<h2 className="ak-tile-title">`                          |
| DEFECTO-021 | MODERADO     | Scroll horizontal móvil (ak-cta-form)            | ✅ RESUELTO   | `home.css`: `max-width: min(420px, 100%)` + `padding-inline: 16px`               |
| NUEVO-1     | MEDIO        | Auth CRM no timing-safe                          | ✅ RESUELTO   | `crm-auth.ts` usa `timingSafeEqual` + rate-limit 30/min IP + 60/min key          |
| NUEVO-2     | ALTO         | `/api/crm/tasks` no existe                       | ✅ RESUELTO   | `src/app/api/crm/tasks/route.ts` con GET + POST                                  |
| NUEVO-3     | MEDIO        | Webhook Notion traga errores                     | ✅ RESUELTO   | `notion-webhook/route.ts` devuelve 500 en `handlePropertiesUpdated` si falla     |

---

## Tareas remanentes

### Tarea 1: Limpieza de dead code (knip)

**Files:**

- Modify: `src/lib/newsletter.ts`
- Modify: `src/lib/agents/prompts.ts`
- Modify: `src/lib/agents/reparador.ts`
- Modify: `src/lib/agents/schemas.ts`

**Interfaces:**

- Consumes: reporte `knip` identificando exports no usados
- Produces: archivos limpios sin exports muertos

- [ ] **Step 1: Ejecutar knip para obtener lista actualizada de dead code**

Run: `npx knip`
Expected: lista de exports sin usar. Buscar:

- `CONFIRM_TOKEN_TTL_MS` en `src/lib/newsletter.ts`
- `getCrmContext` / `_resetCrmContextCache` en `src/lib/agents/prompts.ts`
- `repairResultSchema` en `src/lib/agents/reparador.ts`
- Tipos sin consumir: `CrmDeal`, `CrmTask`, `DiagnosticHypothesis`, etc.

- [ ] **Step 2: Eliminar exports muertos confirmados**

```typescript
// src/lib/newsletter.ts — eliminar:
// const CONFIRM_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
// si no se referencia en ningún lado del proyecto

// src/lib/agents/prompts.ts — eliminar getCrmContext si no se usa
// src/lib/agents/reparador.ts — eliminar repairResultSchema si no se usa
// src/lib/agents/schemas.ts — eliminar tipos sin referencia
```

- [ ] **Step 3: Verificar que no se rompe nada**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: 0 errors, tests verdes

### Tarea 2: Verificación de cobertura de branches

**Files:**

- Read: `vitest.config.ts` (umbrales actuales: 85/70/88/85)

**Interfaces:**

- Consumes: reporte de cobertura actual
- Produces: decisión documentada sobre si subir umbral de branches

- [ ] **Step 1: Ejecutar cobertura y comparar con umbrales**

Run: `pnpm test:coverage --run`
Expected:

- Statements ≥ 85% (actual: 86.57%) ✅
- Branches ≥ 70% (actual: 74.11%) ✅ — por encima del gate
- Functions ≥ 88% (actual: 90.47%) ✅
- Lines ≥ 85% (actual: 88.35%) ✅

- [ ] **Step 2: Decidir si subir umbral de branches**

Análisis: El umbral actual de branches es 70%, la medición real es 74.11%. Hay margen. Las rutas CRM tienen baja cobertura de branches (54-65%) porque muchas requieren Prisma real (no mock). **Decisión:** mantener gate en 70% — subirlo exigiría mockear Prisma o tener DB de test, que no está en scope de P0.

### Tarea 3: Verificación de lint

**Files:**

- Read: `.eslint.config.mjs`

- [ ] **Step 1: Ejecutar lint sobre src/ únicamente (no .next/)**

Run: `npx eslint 'src/**/*.{ts,tsx}' --max-warnings 50`
Expected: 0 errors, warnings controlados

- [ ] **Step 2: Corregir warnings de src/ si los hay**

Si hay warnings de dead vars, imports sin usar, etc., corregirlos.

---

## Criterios de aceptación

- `pnpm test` → 386+ tests verdes
- `pnpm typecheck` → 0 errors
- `pnpm build` → 32 rutas
- `pnpm test:coverage` → thresholds cumplidos (85/70/88/85)
- `npx knip` → sin exports muertos en `src/`
