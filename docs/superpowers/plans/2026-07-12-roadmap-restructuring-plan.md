# Plan de reestructuración del roadmap — website-alexendrosdev

**Fecha:** 2026-07-12
**Estado:** aprobado, en ejecución (P0)
**Contexto:** auditoría de repositorio contrastada con el roadmap actual. La auditoría previa
(`AUDITORIA-CRITICA.md`, base F10) está **obsoleta**: DEFECTO-001/002/003/004/005/007 ya están
resueltos en código. El problema real es de **orden de inversión**, no de calidad base.

**Decisión de negocio (operador):** comercializar primero; los tiers de proyecto quedan como
"a consultar" (no comprables directo).

---

## 0. Premisa

El roadmap invirtió F11–F14b + F15 en **automatización interna** (CRM 8 endpoints, sync Notion
bidireccional, agentes IA autónomos) **antes** de las bases para vender y parecer profesional
(páginas legales/GDPR, contenido editorial, monitorización). Para un portfolio de una persona,
los agentes IA que escriben en el CRM aportan menos que un sitio monitorizado, con contenido y
jurídicamente correcto. Se reordena para servir al objetivo declarado.

---

## 1. Estado vs. auditoría previa (lo ya resuelto)

| Defecto previo                           | Estado   | Evidencia                                                                         |
| ---------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| DEFECTO-001 (webhook → 200 en fallo)     | RESUELTO | `src/app/api/stripe/webhook/route.ts:57-60` → 500                                 |
| DEFECTO-002/003 (rate-limit spoof/fuga)  | RESUELTO | `src/lib/rate-limit.ts:15-21` barrido; `clientIp` prefiere `x-real-ip`/último XFF |
| DEFECTO-004 (contact/newsletter ok:true) | RESUELTO | `src/app/api/contact/route.ts:91-96` → 502 si fallan todos                        |
| DEFECTO-005 (double opt-in)              | RESUELTO | `src/app/api/newsletter/route.ts` + `newsletter/confirm/route.ts`                 |
| DEFECTO-007 (JSON-LD XSS)                | RESUELTO | `src/components/JsonLd.tsx:5` escapa `<` → `\u003c`                               |

---

## 2. Hallazgos nuevos (código post-F10, no cubierto antes)

- **NUEVO-1 (MEDIO) · Auth CRM no timing-safe + sin rate-limit en fallos** — `src/lib/crm-auth.ts:29`
  compara con `!==` (no constante); `rateLimit` solo tras auth OK → fuerza bruta de `CRM_API_KEY`
  sin límite, y con ello disparo de `/api/agents/*` (gasto LLM).
- **NUEVO-2 (ALTO funcional) · `/api/crm/tasks` no existe** — el Reparador (`src/lib/agents/reparador.ts:174`,
  `crm-client.ts:151`) llama `POST /api/crm/tasks`; la ruta no está en disco (sí el modelo `Task`,
  schema:220). Su acción principal `create_followup_task` **falla siempre**.
- **NUEVO-3 (MEDIO) · Webhook inbound Notion traga errores** — `src/app/api/crm/notion-webhook/route.ts:150-152`
  captura y devuelve 200 → drift silencioso Postgres↔Notion.
- **NUEVO-4 (MEDIO) · Sync Notion best-effort sin reconciliación** — `src/lib/crm/notion-sync.ts`
  fire-and-forget; sin panel ni alerta de desvío.
- **NUEVO-5 (MEDIO) · LLM-in-the-loop escribe en CRM sin confirmación** — `reparador.ts` aplica
  `PATCH deal stage` / `create task/activity` con payload del LLM (autónomo).
- **NUEVO-6 (BAJO) · Roadmap/AGENTS/ARCHITECTURE desincronizados** — F15/F17 parcialmente _hechos_
  en código pero "pendiente"; F18.6 dice Plausible pero se usa `@vercel/analytics`.
- **NUEVO-7 (MEDIO) · Sin página legal/privacidad (GDPR, España)** — se captura consentimiento y
  email pero no hay `/privacidad` que enlazar.
- **NUEVO-8 (MEDIO) · Coherencia precios/comercial** — tiers de proyecto (€1.200/2.900/5.900 en
  `services.ts`) no son comprables en la UI (solo addons/retainers vía `PurchaseCard`); el checkout
  los aceptaría server-side (sin gate `active`). `HOME_SERVICES` "Landing desde €600" sin item.
- **NUEVO-9 (BAJO) · Social proof débil** — `testimonials.ts` enlaza repos propios, sin declaraciones
  de clientes reales.
- **NUEVO-10 (MEDIO) · F18 sin activar** — blog 6 posts sin calendario editorial, sin
  `POST /api/newsletter/send`, sin analytics de conversión, Resend sin `RESEND_API_KEY`.

---

## 3. Nueva secuencia de fases

```
P0  Hardening seguridad del código NUEVO      (1–2 días)
P1  Profesionalización & Comercialización      (1–2 semanas)  ← prioridad del operador
P2  Monitorización full-stack (F17, sube)      (1–2 semanas, paralelo a P1)
P3  Agentes IA (F15): mínimo viable/congelar   (solo desbloquear lo hecho)
P4  Pulido & gates de CI                        (higiene)
```

---

## 4. Tareas por fase

### P0 — Hardening del código nuevo

- **P0.1 (NUEVO-1):** `crm-auth.ts` → comparación timing-safe (`crypto.timingSafeEqual`) y
  rate-limit **también en fallos de auth** (bucket por IP, no por key).
- **P0.2 (NUEVO-2):** crear `src/app/api/crm/tasks/route.ts` (POST/GET/PATCH) coherente con el
  modelo `Task`. Alternativa: Reparador crea tareas vía Prisma directo (como `webhook/route.ts:211`).
- **P0.3 (NUEVO-3):** `notion-webhook/route.ts:150` → 500 en fallo de persistencia, no 200 silencioso.
- **P0.4 (NUEVO-6):** sincronizar `ROADMAP.md`/`AGENTS.md`/`ARCHITECTURE.md` con el estado real.

### P1 — Profesionalización & Comercialización

- **P1.1 (NUEVO-7):** página `/privacidad` (GDPR) + enlace en footer/formularios.
- **P1.2 (NUEVO-8):** proyectos "a consultar": `active:false` en `catalog.ts` + checkout filtra
  `active` + UI presupuesto; resolver "Landing desde €600".
- **P1.3 (NUEVO-9):** social proof real (2-3 declaraciones de clientes).
- **P1.4 (F18.1):** activar Resend (`RESEND_API_KEY` del operador).
- **P1.5 (F18.2–18.4):** `editorial-calendar.md` + 2 posts + templates newsletter.
- **P1.6 (F18.5):** `POST /api/newsletter/send` admin; CTA proyectos → contacto.

### P2 — Monitorización (F17, sube)

- **P2.1:** pulir `/api/health` + uptime externo.
- **P2.2:** OTel/SigNoz + alertas vía Resend (F17.8).

### P3 — Agentes IA (F15): mínimo viable / congelar

- Tras P0.2, lo hecho funciona. **No invertir más**: Reparador en modo determinista/dryRun por
  defecto en prod (sin LLM-write autónomo sin confirmación — NUEVO-5). F15 = fase 3 opcional.
- **P3.1:** tests de rama de fallo del Reparador y webhook de agentes.

### P4 — Pulido & gates

- **P4.1 (DEFECTO-006):** `pnpm audit --prod --audit-level=high` + `gitleaks` en CI.
- **P4.2 (DEFECTO-008/009/011):** borrar `_shot.mjs`, `.claude/worktrees/` en `.gitignore`,
  `key` estable, `engines` node≥22.
- **P4.3:** actualizar `AUDITORIA-CRITICA.md` (resueltos + NUEVO-1..10) y regenerar `defectos.csv`.

---

## 5. Criterios de aceptación

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde tras P0 y P1.
- Páginas legales accesibles/enlazadas; proyectos no comprables por error; health + uptime activos.
- `CRM_API_KEY` no fuerza-bruteable; Reparador operativo o en dryRun explícito.

## 6. Fuera de alcance

- Reescritura de CRM/Notion sync (funciona; solo se endurece el inbound).
- Nuevas features de agentes (asistente al cliente, etc.).
