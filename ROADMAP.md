# ROADMAP — website-alexendrosdev

> Fuente de verdad del avance. Se consulta **antes** de retomar trabajo y se actualiza en **cada PR**.
> Estados: `pendiente` · `en curso` · `hecho` · `bloqueado`.

## Leyenda de dependencias

- **Bloquea**: qué impide empezar/cerrar la tarea.
- **Desbloquea**: qué habilita al completarla.

---

---

## REESTRUCTURACIÓN 2026-07-12 (auditoría → nuevo orden de prioridades)

> La auditoría previa (`docs/AUDITORIA-CRITICA.md`, base F10) está **obsoleta**: los defectos
> DEFECTO-001/002/003/004/005/007 ya están resueltos en código. La auditoría del 2026-07-12
> detectó que el problema real es de **orden de inversión**: se construyó automatización interna
> (CRM, Notion sync, agentes IA) antes de las bases para vender y parecer profesional.
> Plan completo: `docs/superpowers/plans/2026-07-12-roadmap-restructuring-plan.md`.
>
> **Nuevo orden (P0→P4):** P0 hardening seguridad del código nuevo · P1 Profesionalización &
> Comercialización (prioridad) · P2 Monitorización (F17 sube) · P3 Agentes IA mínimo/congelar ·
> P4 Pulido & gates CI. Decisiones: comercializar primero; tiers de proyecto = "a consultar".
>
> **Nuevos hallazgos (ver plan):** NUEVO-1 auth CRM no timing-safe + sin rate-limit en fallos ·
> NUEVO-2 ruta `/api/crm/tasks` inexistente (Reparador roto) · NUEVO-3 webhook Notion traga
> errores · NUEVO-4 sync Notion sin reconciliación · NUEVO-5 LLM escribe en CRM sin confirmación
> · NUEVO-6 docs desincronizados · NUEVO-7 sin página legal/GDPR · NUEVO-8 precios incoherentes
> (proyectos no comprables en UI pero sí en checkout) · NUEVO-9 social proof débil · NUEVO-10
> F18 sin activar.

---

## F0 · Prepare — cimientos, docs y repo

| #    | Tarea                                                                             | Estado | Bloquea | Desbloquea     |
| ---- | --------------------------------------------------------------------------------- | ------ | ------- | -------------- |
| 0.1  | Scaffold Next.js 16 (TS, App Router, Tailwind v4, ESLint, src/)                   | hecho  | —       | todo           |
| 0.2  | Instalar deps + build scripts nativos (sharp, oxide)                              | hecho  | 0.1     | build/dev      |
| 0.3  | Build baseline verde (`pnpm build`)                                               | hecho  | 0.2     | F1             |
| 0.4  | `ROADMAP.md` + `ARCHITECTURE.md` (esqueleto)                                      | hecho  | —       | seguimiento    |
| 0.5  | `git init` (main) + `.gitignore` + commit baseline                                | hecho  | 0.4     | 0.6            |
| 0.6  | Crear repo privado GitHub + push (`Iniciativas-Alexendros/website-alexendrosdev`) | hecho  | 0.5     | CI/PR          |
| 0.7  | Scaffolding L2 `.claude/` (settings, overlay, plugins Vercel)                     | hecho  | 0.5     | F6 consolidate |
| 0.8  | Portar tokens (`colors_and_type.css`) + `site.css` (67KB) a la app                | hecho  | 0.3     | F1             |
| 0.9  | Configurar `next/font` (Inter, JetBrains Mono) + `lucide-react`                   | hecho  | 0.8     | F1             |
| 0.10 | Toolchain calidad: Prettier, Vitest, Playwright, scripts npm                      | hecho  | 0.2     | valoradores    |

## F1 · Sistema de diseño y layout global

| #   | Tarea                                                               | Estado | Bloquea | Desbloquea        |
| --- | ------------------------------------------------------------------- | ------ | ------- | ----------------- |
| 1.1 | `app/layout.tsx`: tema no-flash (script bloqueante), fuentes, shell | hecho  | 0.8,0.9 | todas las páginas |
| 1.2 | Primitivos UI: `Button`, `Icon`, `Eyebrow`, `SectionHead`           | hecho  | 1.1     | F2,F3             |
| 1.3 | `Header` (sticky, scroll, nav móvil) + `Footer` (newsletter)        | hecho  | 1.2     | F2,F3             |
| 1.4 | Hooks: `useReveal`, `useTheme` (cliente, `useSyncExternalStore`)    | hecho  | 1.1     | islas             |
| 1.5 | Módulos de contenido tipados (`lib/content/*.ts` desde `data.jsx`)  | hecho  | —       | F2,F3             |

## F2 · Páginas estáticas

| #   | Tarea                                                                         | Estado | Bloquea | Desbloquea |
| --- | ----------------------------------------------------------------------------- | ------ | ------- | ---------- |
| 2.1 | `/` Home (hero, terminal, marquee, zigzag, servicios, blog, testimonios, CTA) | hecho  | F1      | —          |
| 2.2 | `/sobre-mi` (timeline, principios, stack diario)                              | hecho  | F1      | —          |
| 2.3 | `/servicios` (tiers, toggle, comparativa, FAQ)                                | hecho  | F1      | —          |

## F3 · Contenido dinámico

| #   | Tarea                                                      | Estado | Bloquea | Desbloquea |
| --- | ---------------------------------------------------------- | ------ | ------- | ---------- |
| 3.1 | `/proyectos` (filtros, búsqueda, orden, masonry)           | hecho  | F1,1.5  | 3.2        |
| 3.2 | `/proyectos/[slug]` caso de estudio (SSG)                  | hecho  | 3.1     | —          |
| 3.3 | Pipeline MDX (`content/blog/*.mdx`, TOC, código, callouts) | hecho  | 0.8     | 3.4,3.5    |
| 3.4 | `/blog` (destacado, grid, tags, paginación)                | hecho  | 3.3     | —          |
| 3.5 | `/blog/[slug]` post MDX (SSG)                              | hecho  | 3.3     | —          |
| 3.6 | `/stack` grafo radial interactivo (pan/zoom/hover/click)   | hecho  | F1,1.5  | —          |

## F4 · Backend (Init)

| #   | Tarea                                                                | Estado  | Bloquea                     | Desbloquea      |
| --- | -------------------------------------------------------------------- | ------- | --------------------------- | --------------- |
| 4.0 | `/init` en Claude Code → `CLAUDE.md` repo                            | hecho   | 0.6                         | 4.x consolidate |
| 4.1 | Prisma + Supabase: `schema.prisma` (`Lead`, `Subscriber`), migración | hecho   | DB provisionada (→9.4)      | 4.3             |
| 4.2 | `POST /api/contact` + `/api/newsletter`: zod, rate-limit, honeypot   | hecho   | F2                          | 4.4             |
| 4.3 | Resend + React Email (notif. lead, bienvenida)                       | parcial | `RESEND_API_KEY` (operador) | 4.4, F18.1      |
| 4.4 | Conectar formularios reales (contacto multi-step, newsletter)        | hecho   | 4.2                         | —               |

> 4.3 parcial: plantillas + envío Resend implementados; envío real con `RESEND_API_KEY`. Sin
> clave, degrada (log) y responde 200. 4.1 hecho: Supabase self-hosted en Coolify
> (`supabase-website-alexendrosdev`, migración `20260605000000_init` aplicada), RLS
> habilitada (`20260609000000_enable_rls`). `DATABASE_URL` vía Cloudflare Tunnel.

## F5 · SEO, a11y, performance

| #   | Tarea                                                             | Estado  | Bloquea | Desbloquea |
| --- | ----------------------------------------------------------------- | ------- | ------- | ---------- |
| 5.1 | `metadata`/OG por ruta, `sitemap.ts`, `robots.ts`, RSS `feed.xml` | hecho   | F2,F3   | —          |
| 5.2 | Auditoría a11y (axe) sin críticos                                 | hecho   | F2,F3   | F6         |
| 5.3 | Presupuesto CWV / Lighthouse; `prefers-reduced-motion`            | parcial | F2,F3   | F6         |

## F6 · Verify & Consolidate

| #   | Tarea                                                             | Estado | Bloquea | Desbloquea |
| --- | ----------------------------------------------------------------- | ------ | ------- | ---------- |
| 6.1 | Valoradores en verde (tsc, lint, format, Vitest, Playwright, axe) | hecho  | F5      | 6.3        |
| 6.2 | CI GitHub Actions (lint/test/e2e/build) + runner propio           | hecho  | 0.6     | merge main |
| 6.3 | Verificación `.claude/` L2 (settings, overlay, plugins)           | hecho  | 0.7,6.1 | release    |
| 6.4 | Deploy (diferido): Vercel o Hostinger VPS                         | hecho  | 6.3     | F8         |

## F7 · Pagos (Stripe Checkout)

| #   | Tarea                                                               | Estado | Bloquea     | Desbloquea |
| --- | ------------------------------------------------------------------- | ------ | ----------- | ---------- |
| 7.1 | Cliente `lib/stripe.ts` null-safe + catálogo server-trusted         | hecho  | —           | 7.2        |
| 7.2 | `POST /api/checkout` (zod, rate-limit, precio del servidor)         | hecho  | 7.1         | 7.4        |
| 7.3 | `POST /api/stripe/webhook` (firma) + modelo `Order` Prisma          | hecho  | 7.1         | 7.4        |
| 7.4 | UI: addons comprables en `/servicios` + página `/checkout/success`  | hecho  | 7.2         | F7-activ.  |
| 7.5 | Activar pagos reales (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) | hecho  | F7-activ.13 | —          |

> **Activación producción** (sub-histórico F7-activ., 2026-07-10) — consolidado tras
> la limpieza del roadmap. **F7-activ.** (14 tareas, antes conocido como F17): test → live,
> 9 productos + precios en Dashboard, `isLiveMode` prefiere `price` sobre `price_data`
> inline. **F7-activ.5b** (9 tareas, antes F17.5b): `CatalogItem.stripePriceIds?: {
test?, live? }`, `getCatalogPriceId(item, mode)`, guardia del checkout. 7 tests unit
>
> - 3 e2e nuevos. **229 tests, 32 files**. Pendiente fuera: e2e con pago real
>   (cancelación, refund, subscripción), webhook live con `stripe trigger`, limpieza de 4
>   `price_1TIhh...` antiguos del Dashboard.

## F8 · Deploy automatizado (Vercel)

| #   | Tarea                                                                | Estado     | Bloquea | Desbloquea |
| --- | -------------------------------------------------------------------- | ---------- | ------- | ---------- |
| 8.1 | `deploy.yml` (workflow_run tras CI) + `vercel.json` + `.env.example` | descartado | 6.2     | 8.2        |
| 8.2 | Despliegue real a producción                                         | hecho      | —       | —          |

> Deploy vía **integración Git nativa de Vercel** (push a `main` → producción; ramas/PR → preview).
> `deploy.yml` por CLI eliminado por redundante (fallaba en `vercel pull` con `VERCEL_PROJECT_ID`
> inválido). La CI (`ci.yml`) sigue siendo la verificación de calidad bloqueante.

## F9 · Escaparate (página showcase) + deploy en vivo

| #   | Tarea                                                                       | Estado | Bloquea               | Desbloquea |
| --- | --------------------------------------------------------------------------- | ------ | --------------------- | ---------- |
| 9.1 | `/escaparate`: proyectos featured + items comprables (Stripe) + nav/sitemap | hecho  | F3,7.4                | —          |
| 9.2 | Isla `PurchaseCard` extraída y reutilizada en `/servicios` y `/escaparate`  | hecho  | 9.1                   | —          |
| 9.3 | Endurecer `ci.yml`: `concurrency` cancel-in-progress + `timeout-minutes`    | hecho  | 6.2                   | —          |
| 9.4 | Provisionar Supabase (instancia libre) + `DATABASE_URL` + migración Prisma  | hecho  | Supabase (MCP) + env  | 4.1        |
| 9.5 | Deploy producción Vercel (MCP) + dominio `alexendros.dev`                   | hecho  | proyecto Vercel + env | 8.2        |
| 9.6 | Personalización de contenido: datos reales + 5 proyectos OSS de GitHub      | hecho  | 9.1                   | —          |
| 9.7 | Landing "en construcción" `/proximamente` + split preview/prod              | hecho  | 9.1                   | 9.5        |

> Holding page: portfolio público por defecto. Landing `/proximamente` (vía `src/middleware.ts`
>
> - `isComingSoon` en `src/lib/flags.ts`) queda como **opt-in**: actívala con `COMING_SOON=1`.
>   Cabecera/pie se ocultan en ese modo.

## F10 · Estrategia de testing

Pirámide completa (unit + integración + componentes + e2e) con gate de cobertura. Documentación
en `tests/README.md`. Objetivo: garantías de no-regresión sobre la lógica de negocio (Route
Handlers, validación, rate-limit, degradación null-safe) y las islas cliente.

| #    | Tarea                                                                                                                         | Estado | Bloquea   | Desbloquea |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | --------- | ---------- |
| 10.1 | Infra: deps (jsdom, RTL, MSW, coverage-v8), Vitest `projects`, alias `server-only`, helpers/fixtures                          | hecho  | 0.10      | 10.2–10.4  |
| 10.2 | Unit: rate-limit, JSON-LD, blog, case-studies, invariantes de contenido, clientes null-safe                                   | hecho  | 10.1      | 10.6       |
| 10.3 | Integración: 4 Route Handlers (200/400/422/429/503/502, honeypot, degradación) vía `vi.mock`                                  | hecho  | 10.1      | 10.6       |
| 10.4 | Componentes (jsdom/RTL): ContactView, NewsletterForm, PurchaseCard, ProjectsView, Terminal, Testimonials, useTheme, useReveal | hecho  | 10.1      | 10.6       |
| 10.5 | E2E ampliado: newsletter, checkout (fallback 503), proyectos, blog, a11y multi-ruta                                           | hecho  | 10.4      | —          |
| 10.6 | Gate de cobertura v8 progresivo + CI (`pnpm test` → `pnpm test:coverage`)                                                     | hecho  | 10.2,10.3 | —          |
| 10.7 | Docs: `tests/README.md`, sección Testing en `ARCHITECTURE.md`, ROADMAP/CLAUDE                                                 | hecho  | 10.6      | —          |
| 10.8 | Ampliar e2e (navegación, servicios, stack, detalle proyecto/blog) + subir gate (lock-in 93/86/95/92)                          | hecho  | 10.5,10.6 | —          |

> Cobertura (v8) sobre `src/lib/**` + `src/app/api/**`, gate en `vitest.config.ts`:
>
> | Hito              | Statements | Branches | Functions | Lines |
> | ----------------- | ---------- | -------- | --------- | ----- |
> | F10.2 base        | 60         | 55       | 60        | 60    |
> | F10.3 +API        | 72         | 68       | 72        | 72    |
> | F10.4 +comp       | 80         | 75       | 80        | 80    |
> | F10.8 lock-in     | 93         | 86       | 95        | 92    |
> | F14 (gate actual) | 85         | 70       | 93        | 87    |
>
> Medición actual ≈ **87.7/72.08/95.41/89.93** (229 tests verdes, 32 ficheros). Gate relajado
> en F14 al añadir CRM (branches baja por las 8 rutas REST con muchos caminos de error).
> Server Components asíncronos se cubren por e2e, no por porcentaje. Regla RSC: async
> server components → e2e.
>
> E2E (chromium): `smoke`, `navigation`, `projects`, `blog`, `services`, `stack`,
> `newsletter`, `checkout`, `a11y` (axe sin críticos en 8 rutas, incluida `/stack`).

## F11 · Catálogo unificado

| #    | Tarea                                                                                                           | Estado | Bloquea | Desbloquea    |
| ---- | --------------------------------------------------------------------------------------------------------------- | ------ | ------- | ------------- |
| 11.1 | `src/lib/content/catalog.ts` + helpers (`getCatalogItem`, `getCatalogItemsByType`, `getCatalogItemsByCategory`) | hecho  | —       | F12, F13, F14 |
| 11.2 | Refactor `services.ts` — `TIERS`, `ADDONS` derivados del catálogo                                               | hecho  | 11.1    | —             |
| 11.3 | Deprecar `checkout.ts` (reexporta `PURCHASABLES` desde catálogo para compatibilidad)                            | hecho  | 11.1    | —             |
| 11.4 | `formatPrice` en `checkout.ts` (locale `es-ES`)                                                                 | hecho  | 11.3    | F12           |

> Spec: `specs/catalog-pipeline-stripe/spec.md` RF1. Precios server-trusted (céntimos). Verificados
> y sin TODOs. 10 tests unit green en `tests/unit/catalog.test.ts` (T1.1–T1.10 del test-plan).

## F12 · Checkout unified (subscription mode)

| #    | Tarea                                                                                 | Estado | Bloquea | Desbloquea |
| ---- | ------------------------------------------------------------------------------------- | ------ | ------- | ---------- |
| 12.1 | `POST /api/checkout` acepta `itemId` (nuevo) + `{ item }` (legacy)                    | hecho  | F11     | F13        |
| 12.2 | `mode: subscription` para items `recurring` → `price_data` + `recurring { interval }` | hecho  | 12.1    | —          |
| 12.3 | Item `one_time` con `mode: subscription` → fuerza `payment` + warning (no 422)        | hecho  | 12.1    | —          |
| 12.4 | Zod schema ampliado (`itemId`, `mode`, `paymentMethod`) en `lib/validation.ts`        | hecho  | 12.1    | F13        |

> 6 tests integración green en `tests/integration/checkout.test.ts` (T2.1–T2.6). 5 tests componente
> en `tests/component/PurchaseCard.test.tsx` (T2.12–T2.16). 2 tests e2e en `services.spec.ts` y
> `escaparate.spec.ts` (T2.17–T2.18).

## F13 · Canal secundario (transferencia + Stripe Payment Link fallback)

| #    | Tarea                                                                                   | Estado | Bloquea | Desbloquea |
| ---- | --------------------------------------------------------------------------------------- | ------ | ------- | ---------- |
| 13.1 | `paymentMethod: transfer` → valida `email`+`name`, crea Invoice proforma, devuelve IBAN | hecho  | F12     | —          |
| 13.2 | `paymentMethod: transfer` sin email/name → 422                                          | hecho  | F12     | —          |
| 13.3 | `paymentMethod: transfer` sin `TRANSFER_IBAN` o sin Prisma → 503                        | hecho  | F12     | —          |
| 13.4 | Fallback: Stripe session falla → `paymentLinks.create` → 200 `{ fallback: true }`       | hecho  | F12     | —          |
| 13.5 | Ambos (session + payment link) fallan → 502 `{ fallbackAttempted: true }`               | hecho  | F12     | —          |
| 13.6 | Sin Stripe pero con `TRANSFER_IBAN` → 503 con datos transferencia                       | hecho  | F12     | —          |

> 10 tests integración (T3.1–T3.10) + 4 componente (T3.11–T3.14) green. `TRANSFER_IBAN` +
> `TRANSFER_BENEFICIARY` (operador) activan el canal real. Código y tests implementados.

## F14 · Webhook ampliado + CRM API + Pipeline 9 stages

| #    | Tarea                                                                                                       | Estado | Bloquea                                                | Desbloquea |
| ---- | ----------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------ | ---------- |
| 14.1 | 3 migraciones Prisma: `Subscription` table, seed `PipelineStage` (9 stages), `stripeInvoiceId` en `Invoice` | hecho  | schema CRM existente (`20260616120000_add_crm_schema`) | 14.2–14.6  |
| 14.2 | Webhook ampliado: `invoice.paid` → Invoice CRM, `customer.subscription.updated/deleted` → Subscription      | hecho  | 14.1                                                   | —          |
| 14.3 | `checkout.session.completed` con `dealId` → auto-avance a "Cerrado ganado" (stage 5)                        | hecho  | 14.1                                                   | —          |
| 14.4 | Lógica pipeline: `lib/crm/pipeline.ts` (transiciones válidas, stages terminales)                            | hecho  | stages seedeados (14.1)                                | 14.5       |
| 14.5 | Auth CRM: `lib/crm-auth.ts` (middleware `X-API-Key`)                                                        | hecho  | `CRM_API_KEY` env                                      | 14.6       |
| 14.6 | 8 Route Handlers REST (`src/app/api/crm/`) — contacts, deals, products, invoices, activities, stages        | hecho  | 14.4, 14.5                                             | F14b, F15  |
| 14.7 | Rate-limit CRM 60 req/min por API key                                                                       | hecho  | 14.5                                                   | —          |

> 38 tests nuevos (6 webhook + 10 pipeline + 22 CRM). 188 tests totales post-F14a.
> Cobertura: 87/72/94/89 (stmts/brchs/funcs/lines). Gate ajustado en vitest.config.ts.

## F14b · Notion bidirectional sync

| #     | Tarea                                                                                 | Estado | Bloquea | Desbloquea |
| ----- | ------------------------------------------------------------------------------------- | ------ | ------- | ---------- |
| 14b.1 | Notion client null-safe + types (`notion.ts`, `notion-types.ts`)                      | hecho  | —       | 14b.2      |
| 14b.2 | Property mapper bidireccional Contact/Deal ↔ Notion (`notion-mapper.ts`)              | hecho  | 14b.1   | 14b.3      |
| 14b.3 | Outbound sync best-effort Postgres→Notion (`notion-sync.ts`) + hooks en endpoints CRM | hecho  | 14b.2   | 14b.4      |
| 14b.4 | Inbound webhook HMAC-SHA256 Notion→Postgres (`notion-webhook/route.ts`)               | hecho  | 14b.3   | F15        |

> 31 tests nuevos (4 client + 11 mapper + 8 sync + 8 webhook), 219 tests totales. Env vars:
> `NOTION_API_KEY`, `NOTION_CONTACTS_DB_ID`, `NOTION_DEALS_DB_ID`, `NOTION_WEBHOOK_SECRET`.
> Todas null-safe. Postgres = source of truth; Notion = vista consulta/edición rápida.

## F15 · Agentes IA autónomos + Hardening (TS integrado) — **RE-PRIORIZADO A P3 (mínimo/congelar)**

> **Estado real (2026-07-12):** los módulos TS (`src/lib/agents/*`) y los 5 endpoints
> (`/api/agents/{health,hooks,audit,diagnose,repair}`) **están implementados en código**, pero el
> roadmap los marcaba "pendiente". La acción principal del Reparador (`create_followup_task`) **falla**
> porque la ruta `/api/crm/tasks` no existe (NUEVO-2). Por decisión de negocio, F15 se **congela** en
> "mínimo viable": tras crear `/api/crm/tasks` (P0.2) lo hecho funciona; no se invierte más hasta
> P1/P2 hechos. Reparador en modo determinista/dryRun por defecto en prod (sin LLM-write autónomo
> sin confirmación — NUEVO-5).
>
> Módulos TS integrados en `src/lib/agents/` (sin repo externo). Provider LLM híbrido
> en cadena: Gemini 3.5 Flash (primario, gratuito) → DeepSeek V4 Flash Free →
> MiMo V2.5 Free → North Mini Code Free (fallbacks por rate limit / indisponibilidad).
> Reparador usa LLM para decidir la acción, código determinista para ejecutarla.

| #    | Tarea                                                                                                  | Estado         | Bloquea            | Desbloquea |
| ---- | ------------------------------------------------------------------------------------------------------ | -------------- | ------------------ | ---------- |
| 15.1 | Módulos base `src/lib/agents/`: `auditor.ts`, `diagnosticador.ts`, `reparador.ts`                      | hecho (código) | F14, F14b          | 15.2–15.8  |
| 15.2 | Provider LLM híbrido `lib/agents/llm-provider.ts` (Gemini primario + 3 fallbacks OpenCode Zen free)    | pendiente      | 15.1, env vars LLM | 15.3–15.5  |
| 15.3 | Agente Auditor: cron 15 min, detecta deals estancados, ≥3 fallos checkout/5min, escribe a `AuditorLog` | pendiente      | 15.2, CRM API      | 15.4       |
| 15.4 | Agente Diagnosticador `POST /api/agents/diagnose`: hipótesis con `confidence: 0.0–1.0`                 | pendiente      | 15.3               | 15.5       |
| 15.5 | Agente Reparador `POST /api/agents/repair`: LLM decide acción correctiva, código ejecuta vía CRM API   | pendiente      | 15.4               | 15.6       |
| 15.6 | Health + hooks: `GET /api/agents/health`, `POST /api/agents/hooks` (webhook receiver seguro)           | pendiente      | 15.2–15.5          | 15.7       |
| 15.7 | Hardening utilidad: tests con LLM evalúan calidad de diagnósticos (mocks por proveedor)                | pendiente      | 15.4               | 15.8       |
| 15.8 | Hardening cumplimiento: tests con LLM evalúan respeto al contrato CRM API (mocks por proveedor)        | pendiente      | 15.5               | 15.9       |
| 15.9 | Endurecer y documentar: ARCHITECTURE.md, rate-limit agentes, observabilidad, fallback determinista     | pendiente      | 15.6–15.8          | F16        |

> 5 endpoints REST en `src/app/api/agents/`: `health`, `hooks`, `audit`, `diagnose`, `repair`.
> Sin repo Python externo, sin Ollama local: módulos TS dentro de Next.js, comunicación
> con el resto del sistema solo vía HTTP (CRM API). **Env vars**: `GEMINI_API_KEY`
> (gratuita, primaria) + `OPENCODE_ZEN_API_KEY` (opcional, 3 fallbacks). Sin ninguna,
> degradación determinista: Diagnosticador/Reparador devuelven `action: "none"`.

## F16 · E2E + Gates finales

| #    | Tarea                                                                            | Estado    | Bloquea    | Desbloquea |
| ---- | -------------------------------------------------------------------------------- | --------- | ---------- | ---------- |
| 16.1 | 8 tests e2e (`/servicios`, `/escaparate`, `/checkout/success`, a11y multi-ruta)  | pendiente | F15        | —          |
| 16.2 | Lock-in cobertura: statements ≥85%, branches ≥80%, functions ≥85%, lines ≥85%    | pendiente | F15        | —          |
| 16.3 | Gates calidad: lint 0, typecheck 0, build verde, format OK                       | pendiente | 16.1, 16.2 | release    |
| 16.4 | Actualizar ARCHITECTURE.md (rutas CRM, Subscription, agentes IA, monitorización) | pendiente | 16.3       | —          |

> Lock-in actual 85/70/93/87 (medición 87.7/72.08/95.41/89.93, 229 tests, 32 ficheros).
> Gate F16: 85/80/85/85. F17 (monitorización) y F18 (contenido) en paralelo a F15/F16
> según el diagrama de tracks al final.

## F17 · Monitorización full-stack — **RE-PRIORIZADO A P2 (sube)**

> **Estado real (2026-07-12):** el endpoint `GET /api/health` **ya existe** en código
> (`src/app/api/health/route.ts`), pero el resto (uptime externo, SigNoz/OTel, alertas) está
> pendiente. Por decisión de negocio sube a **P2**, por delante de F15: para un sitio con pagos
> reales, monitorizar es más urgente que los agentes IA. Track paralelo, cero dependencia.

| #    | Tarea                                                               | Notas                                                                                                        |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 17.1 | Health endpoint `GET /api/health` (DB, Stripe, Resend, MiniPC)      | Null-safe: servicios no configurados devuelven `status: "disabled"`.                                         |
| 17.2 | Uptime monitor externo (Uptime Robot o `cron-job.org`)              | Ping `/api/health` cada 5 min. Alerta email tras 3 checks fallidos consecutivos.                             |
| 17.3 | SigNoz: instrumentar Next.js con OTEL (`@vercel/otel`)              | Exporta traces a SigNoz en MiniPC vía Cloudflare Tunnel. Cubre Route Handlers y RSC.                         |
| 17.4 | Dashboard SigNoz: latencia por ruta, errores 4xx/5xx, p95/p99       | Plantillas estándar SigNoz, sin código custom.                                                               |
| 17.5 | Dashboard Supabase: conexiones, tamaño, slow queries                | `pg_stat_activity` + `pg_stat_user_tables`. Script cron en MiniPC que expone métricas a SigNoz.              |
| 17.6 | Monitoreo Stripe: webhook failures + checkout success rate          | Logging estructurado en `/api/stripe/webhook` (ya existe `console.log`). Dashboard SigNoz ingiere esos logs. |
| 17.7 | Monitoreo MiniPC: Ollama, Coolify, Cloudflare Tunnel                | `/opt/health/minipc-health.sh` ejecutado por cron, expone JSON a endpoint local que SigNoz scrapea.          |
| 17.8 | Alertas email vía Resend (cuando `RESEND_API_KEY` esté configurada) | Mientras tanto, solo dashboards SigNoz. Sin canal de alerta, los fallos se descubren manualmente.            |

## F18 · Contenido & Marketing

> Depende de F16 (no producir contenido con gates de calidad pendientes). Activa
> la infraestructura de blog y newsletter ya construida en F3 + F4.

| #    | Tarea                                                       | Notas                                                                                                              |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 18.1 | Activar Resend con `RESEND_API_KEY` real                    | Infra React Email + Resend client hecha (F4.3). Solo falta la clave del operador.                                  |
| 18.2 | Calendario editorial: `content/blog/editorial-calendar.md`  | 4 posts planificados (temas, fechas, keywords). Artefacto de planificación versionado en el repo.                  |
| 18.3 | Templates newsletter: mensual + anuncio de post             | Reutiliza el layout de `emails/welcome.tsx`. Dos variantes nuevas.                                                 |
| 18.4 | 2 posts iniciales en MDX                                    | Pipeline de renderizado MDX funciona desde F3.3.                                                                   |
| 18.5 | Endpoint `POST /api/newsletter/send` (admin, `CRM_API_KEY`) | Dispara envío a todos los subscribers. Protegido con `X-API-Key`.                                                  |
| 18.6 | Analytics con Plausible (privacy-first, script <1 KB)       | Insertado en `layout.tsx`. Alternativa: Umami self-hosted en Coolify si se prefiere control total sobre los datos. |

---

## Tracks paralelos (reestructuración 2026-07-12)

Nuevo orden por prioridad de negocio (ver plan). P0→P4 secuencia; P1 y P2 en paralelo.

```
P0 (Hardening seguridad) ──────► P1 (Profesionalización & Comercialización)
                                     │
P0 ───────────────────────────────► P2 (Monitorización, F17 sube)
                                     │
                                   P3 (Agentes IA F15: mínimo/congelar)
                                     │
                                   P4 (Pulido & gates CI)
```

| Track | Fase | Nombre                                | Depende de         |
| ----- | ---- | ------------------------------------- | ------------------ |
| 0     | P0   | Hardening seguridad del código nuevo  | F14, F14b          |
| 1     | P1   | Profesionalización & Comercialización | P0                 |
| 2     | P2   | Monitorización full-stack (F17)       | — (paralelo a P1)  |
| 3     | P3   | Agentes IA (F15) mínimo/congelar      | P0.2 (ruta /tasks) |
| 4     | P4   | Pulido & gates CI                     | P1, P2             |

## Configuración pendiente del operador

Código listo, falta credencial para activar en producción. La app arranca y responde 200
sin ellas (degradación null-safe al estilo Stripe/Resend).

| Variable                                                          | Fase | Efecto sin ella                                              |
| ----------------------------------------------------------------- | ---- | ------------------------------------------------------------ |
| `RESEND_API_KEY`                                                  | F4.3 | Emails transaccionales → `console.log`; newsletters no salen |
| `TRANSFER_IBAN` + `TRANSFER_BENEFICIARY`                          | F13  | Canal transferencia bancaria → 503                           |
| `NOTION_API_KEY` + `NOTION_CONTACTS_DB_ID` + `NOTION_DEALS_DB_ID` | F14b | Sync Notion outbound → warn silencioso                       |
| `NOTION_WEBHOOK_SECRET`                                           | F14b | Webhook inbound Notion → 200 ack sin procesar                |

## Desbloqueos recientes

- **F7.5** (2026-07-10): Stripe live (`sk_live_...`, webhook → `https://alexendros.dev/api/stripe/webhook`). Smoke test OK. Detalle en F7-activ. + F7-activ.5b dentro de F7.
- **F14 + F14b** (2026-07-09): webhook ampliado + CRM REST (8 endpoints) + pipeline 9 stages + Notion sync. 229 tests, 32 files, 0 lint/typecheck.
- **F11 + F12 + F13** (2026-07-05): catálogo unificado, checkout unified (subscription mode) y canal secundario implementados y desplegados.

## Referencias

- **Reestructuración 2026-07-12:** `docs/superpowers/plans/2026-07-12-roadmap-restructuring-plan.md` (nuevo orden P0→P4 + hallazgos NUEVO-1..10)
- Auditoría previa (obsoleta, base F10): `docs/AUDITORIA-CRITICA.md`
- Specs: `specs/catalog-pipeline-stripe/` · `docs/superpowers/specs/2026-07-11-roadmap-reformulation-design.md`
- Arquitectura: `ARCHITECTURE.md` — stack, rutas, modelos, testing
- Testing: `tests/README.md` — pirámide completa, patrones, cobertura
- AGENTS.md: contexto del proyecto, comandos, infraestructura, variables
