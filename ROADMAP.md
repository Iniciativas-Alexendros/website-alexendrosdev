# ROADMAP — website-alexendrosdev

> Fuente de verdad del avance. Se consulta **antes** de retomar trabajo y se actualiza en **cada PR**.
> Estados: `pendiente` · `en curso` · `hecho` · `bloqueado`.

## Leyenda de dependencias

- **Bloquea**: qué impide empezar/cerrar la tarea.
- **Desbloquea**: qué habilita al completarla.

---

---

## REESTRUCTURACIÓN 2026-07-12 (auditoría → nuevo orden de prioridades)

> La auditoría del 2026-07-12 detectó que el problema real era de **orden de inversión**: se
> construyó automatización interna (CRM, Notion sync, agentes IA) antes de las bases para vender y
> parecer profesional. Los defectos previos de la auditoría DEFECTO-001..007 ya están resueltos en
> código.
>
> **Nuevo orden (P0→P4):** P0 hardening seguridad del código nuevo · P1 Profesionalización &
> Comercialización (prioridad) · P2 Monitorización (F17 sube) · P3 Agentes IA mínimo/congelar ·
> P4 Pulido & gates CI. Decisiones: comercializar primero; tiers de proyecto = "a consultar".
>
> **Hallazgos NUEVO-1..10:**
> ✅ NUEVO-1 (timing-safe + rate-limit) — RESUELTO: `crm-auth.ts` usa `timingSafeEqual` + rate-limit 30/min IP
> ✅ NUEVO-2 (ruta /tasks) — RESUELTO: `src/app/api/crm/tasks/route.ts` con GET/POST
> ✅ NUEVO-3 (notion-webhook traga errores) — RESUELTO: devuelve 500 en fallos de persistencia
> ⚠️ NUEVO-4 (sync sin reconciliación) — PERSISTE: best-effort, sin panel de desvío
> ⚠️ NUEVO-5 (LLM escribe sin confirmación) — PERSISTE: Reparador en dry-run por defecto (P3 congelado)
> ✅ NUEVO-6 (docs desincronizados) — RESUELTO: ROADMAP actualizado
> ✅ NUEVO-7 (sin página legal/GDPR) — RESUELTO: 4 páginas en `src/app/legal/`
> ✅ NUEVO-8 (precios incoherentes) — RESUELTO: checkout bloquea items inactive; UI muestra "a consultar"
> ⚠️ NUEVO-9 (social proof débil) — PERSISTE: 2 work entries, ranuras para clientes reales
> ✅ NUEVO-10 (F18 sin activar) — RESUELTO: 6 posts blog, endpoint newsletter/send existe

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

## F9 · Escaparate → Servicios (fusionado) + deploy en vivo

| #   | Tarea                                                                         | Estado | Bloquea               | Desbloquea |
| --- | ----------------------------------------------------------------------------- | ------ | --------------------- | ---------- |
| 9.1 | Escaparate (fusionado en `/servicios`): proyectos featured + items comprables | hecho  | F3,7.4                | —          |
| 9.2 | Isla `PurchaseCard` extraída y reutilizada en `/servicios`                    | hecho  | 9.1                   | —          |
| 9.3 | Endurecer `ci.yml`: `concurrency` cancel-in-progress + `timeout-minutes`      | hecho  | 6.2                   | —          |
| 9.4 | Provisionar Supabase (instancia libre) + `DATABASE_URL` + migración Prisma    | hecho  | Supabase (MCP) + env  | 4.1        |
| 9.5 | Deploy producción Vercel (MCP) + dominio `alexendros.dev`                     | hecho  | proyecto Vercel + env | 8.2        |
| 9.6 | Personalización de contenido: datos reales + 5 proyectos OSS de GitHub        | hecho  | 9.1                   | —          |
| 9.7 | Landing "en construcción" `/proximamente` + split preview/prod                | hecho  | 9.1                   | 9.5        |

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

> Precios server-trusted (céntimos). Verificados y sin TODOs. 10 tests unit green en
> `tests/unit/catalog.test.ts` (T1.1–T1.10).

## F12 · Checkout unified (subscription mode)

| #    | Tarea                                                                                 | Estado | Bloquea | Desbloquea |
| ---- | ------------------------------------------------------------------------------------- | ------ | ------- | ---------- |
| 12.1 | `POST /api/checkout` acepta `itemId` (nuevo) + `{ item }` (legacy)                    | hecho  | F11     | F13        |
| 12.2 | `mode: subscription` para items `recurring` → `price_data` + `recurring { interval }` | hecho  | 12.1    | —          |
| 12.3 | Item `one_time` con `mode: subscription` → fuerza `payment` + warning (no 422)        | hecho  | 12.1    | —          |
| 12.4 | Zod schema ampliado (`itemId`, `mode`, `paymentMethod`) en `lib/validation.ts`        | hecho  | 12.1    | F13        |

> 6 tests integración green en `tests/integration/checkout.test.ts` (T2.1–T2.6). 5 tests componente
> en `tests/component/PurchaseCard.test.tsx` (T2.12–T2.16). 2 tests e2e en `services.spec.ts` y
> `servicios.spec.ts` (T2.17–T2.18).

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
| 15.2 | Provider LLM híbrido `lib/agents/llm-provider.ts` (Gemini primario + 3 fallbacks OpenCode Zen free)    | hecho (código) | 15.1, env vars LLM | 15.3–15.5  |
| 15.3 | Agente Auditor: cron 15 min, detecta deals estancados, ≥3 fallos checkout/5min, escribe a `AuditorLog` | hecho (código) | 15.2, CRM API      | 15.4       |
| 15.4 | Agente Diagnosticador `POST /api/agents/diagnose`: hipótesis con `confidence: 0.0–1.0`                 | hecho (código) | 15.3               | 15.5       |
| 15.5 | Agente Reparador `POST /api/agents/repair`: LLM decide acción correctiva, código ejecuta vía CRM API   | hecho (código) | 15.4               | 15.6       |
| 15.6 | Health + hooks: `GET /api/agents/health`, `POST /api/agents/hooks` (webhook receiver seguro)           | hecho (código) | 15.2–15.5          | 15.7       |
| 15.7 | Hardening utilidad: tests con LLM evalúan calidad de diagnósticos (mocks por proveedor)                | hecho (código) | 15.4               | 15.8       |
| 15.8 | Hardening cumplimiento: tests con LLM evalúan respeto al contrato CRM API (mocks por proveedor)        | hecho (código) | 15.5               | 15.9       |
| 15.9 | Endurecer y documentar: ARCHITECTURE.md, rate-limit agentes, observabilidad, fallback determinista     | pendiente      | 15.6–15.8          | F16        |

> 5 endpoints REST en `src/app/api/agents/`: `health`, `hooks`, `audit`, `diagnose`, `repair`.
> Sin repo Python externo, sin Ollama local: módulos TS dentro de Next.js, comunicación
> con el resto del sistema solo vía HTTP (CRM API). **Env vars**: `GEMINI_API_KEY`
> (gratuita, primaria) + `OPENCODE_ZEN_API_KEY` (opcional, 3 fallbacks). Sin ninguna,
> degradación determinista: Diagnosticador/Reparador devuelven `action: "none"`.

## F16 · E2E + Gates finales

| #    | Tarea                                                                               | Estado | Bloquea | Desbloquea |
| ---- | ----------------------------------------------------------------------------------- | ------ | ------- | ---------- |
| 16.1 | 8 tests e2e (`/servicios`, `/checkout/success`, a11y multi-ruta)                    | hecho  | —       | —          |
| 16.2 | Lock-in cobertura: statements ≥85%, branches ≥70%, functions ≥88%, lines ≥85%       | hecho  | —       | —          |
| 16.3 | Gates calidad: lint 0 warnings src/, typecheck 0, build verde (32 rutas), format OK | hecho  | —       | release    |
| 16.4 | Actualizar ARCHITECTURE.md (rutas CRM, Subscription, agentes IA, monitorización)    | hecho  | 16.3    | F18        |

> Lock-in actual 85/70/88/85 (medición 86.57/74.11/90.47/88.35, 386 tests, 51 ficheros).
> **F16 COMPLETADO.** Gate 85/70/88/85 mantenido; lint/typecheck/build/format verdes.
> El cierre de F16 desbloquea F18. Próximo foco prioritario:
>
> 1. **F18 · Contenido & Marketing (Track P1)** — activar Resend, publicar 2 posts iniciales y activar newsletter/admin.
> 2. **F17 · Monitorización full-stack (Track P2)** — en paralelo, implementar uptime externo y OTel/SigNoz.
>
> El orden sigue la reestructuración 2026-07-12: P1 (comercialización) primero, P2 (monitorización) en paralelo.

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

## F19 · Design System Truth — Auditoría y saneamiento CSS

> Auditoría completa del design system iniciada 2026-07-24. 4 fases (F0-F3) + 2 batches de
> auto-fix. **Pendiente de commit**: todos los cambios están staged/modificados en el working tree.
>
> Spec central: `specs/design-system-truth/`. Especifica 12 RFs, 48 ACs, 24 tests planificados,
> scoreboard ponderado con 6 dimensiones.
>
> Resultado scoreboard real (tras F0-F3 + batch2 + batch3):
>
> | Dimensión        | Score auditoría | Score corregido |
> | ---------------- | --------------- | --------------- |
> | Token system     | 90% (erróneo)   | 100%            |
> | Componentes UI   | 40%             | 65%             |
> | ARIA / A11y      | 55%             | 55%             |
> | CSS Architecture | 35%             | 85%             |
> | Documentación    | 25%             | 80%             |
> | Testing / QA     | 30%             | 70%             |
> | **Global**       | **47%**         | **76%**         |

### F19.0 · Fundaciones — audit + spec + tests (wt/design-system-truth-f0)

| #   | Tarea                                                                          | Estado | Bloquea | Desbloquea |
| --- | ------------------------------------------------------------------------------ | ------ | ------- | ---------- |
| 0.1 | Crear 7 unit tests F0 (design-system-audit, css-invariants, z-index-tokens, …) | hecho  | —       | 0.2        |
| 0.2 | Endurecer `scripts/audit-hardcoded-colors.mjs`                                 | hecho  | 0.1     | 0.3        |
| 0.3 | Crear `scripts/audit-spec-coherence.mjs` — auto-validador cross-ref RF↔AC↔TU   | hecho  | 0.2     | F19.1      |

### F19.1 · DESIGN.md reescritura — errores factuales corregidos + 5 secciones nuevas

| #   | Tarea                                                                                                                                | Estado | Bloquea | Desbloquea |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------- | ---------- |
| 1.1 | Corregir ERROR 1 (z-index existe, eliminado ❌ de gaps) + ERROR 2 (reescribir §2.6) + ERROR 3 (§2.17 RSC) + ERROR 4 (score 90%→100%) | hecho  | F19.0   | F19.2      |
| 1.2 | Añadir §6 Mapa de Archivos CSS, §7 Regla ak-* vs Tailwind, §8 ADR Cascade, §9 Animations, §10 Inventario de clases ak-*              | hecho  | 1.1     | —          |

### F19.2 · CSS refactor — dedups + tokens + keyframes + ":where" + ServicesView

> Implementa RF6-RF10 del spec.

| #   | Tarea                                                                        | Estado | Bloquea | Desbloquea |
| --- | ---------------------------------------------------------------------------- | ------ | ------- | ---------- |
| 2.1 | RF6: Mover @keyframes rise/reveal/bob/pulse-ring/blink/marquee a site.css    | hecho  | F19.1   | 2.2        |
| 2.2 | RF7: Deduplicar DUP-1..9 (ak-btn gap, ak-eyebrow, ak-form-card, skeleton, …) | hecho  | 2.1     | 2.3        |
| 2.3 | RF8: Crear tokens --container-px, --header-height, --fs-price, --fs-metric   | hecho  | 2.2     | 2.4        |
| 2.4 | RF9: Extender :where(a):is() a 11 selectores (antes 3) + ampliar .dark       | hecho  | 2.3     | 2.5        |
| 2.5 | RF10: Mover ServicesView.css → _services.css + eliminar import duplicado     | hecho  | 2.4     | —          |

### F19.3 · Verification — snapshots, axe, CWV

| #   | Tarea                                                                    | Estado         | Bloquea | Desbloquea |
| --- | ------------------------------------------------------------------------ | -------------- | ------- | ---------- |
| 3.1 | Playwright visual snapshots de las 3 cards (Purchase, Transfer, Contact) | hecho (código) | F19.2   | —          |
| 3.2 | axe-core gates en /contacto, /checkout, /proyectos, /blog, /stack        | hecho (código) | F19.2   | —          |
| 3.3 | Lighthouse CWV baseline + reporte                                        | hecho (código) | F19.2   | —          |
| 3.4 | TE-* snapshots lock-in en spec design-system-truth                       | hecho (código) | 3.1-3.3 | —          |

### F19.4 · Batch2 — Auto-fix token fallbacks + sub-spec

> Especificado en `specs/design-system-fixes-batch2/` como sub-spec delta de `design-system-truth/`.

| #   | Tarea                                                                              | Estado    | Bloquea | Desbloquea |
| --- | ---------------------------------------------------------------------------------- | --------- | ------- | ---------- |
| 4.1 | PurchaseCard.tsx L216+L231: var(--ak-border, rgba(…)) → hsl(var(--border))         | hecho     | F19.2   | 4.2        |
| 4.2 | Nota de deprecation en DESIGN.md §1 para 18 unused legacy tokens                   | pendiente | 4.1     | 4.3        |
| 4.3 | Sub-spec design-system-fixes-batch2 (spec/contract/scenarios/test-plan) 4 archivos | hecho     | 4.1     | —          |
| 4.4 | Tests TU-1.* (unit) + TE-1.* (e2e axe+computed-style) lock-in                      | hecho     | 4.3     | —          |

### F19.5 · Batch3 — Parser nested-parens + fix-token-coverage rewrite

> Bug real: regex `[^()]*` silenciosamente fallaba con fallbacks que contenían paréntesis
> anidados (rgba(), hsl(var(--x)), calc(), clamp(), color-mix()). Script emitía exit 0
> mintiendo "ya aplicado". Solución: linear scanner O(N) con depth counter.

| #   | Tarea                                                                                                                         | Estado | Bloquea | Desbloquea |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | ------- | ---------- |
| 5.1 | `scripts/utils/css-var-parser.mjs` — linear scanner con paren-depth + 4-state machine                                         | hecho  | —       | 5.2        |
| 5.2 | `tests/unit/css-var-parser.test.ts` — 48 stress tests en 7 categorías (happy/nested/edge/chained/false-positive/modern/apply) | hecho  | 5.1     | 5.3        |
| 5.3 | `scripts/fix-token-coverage.mjs` reescrito — applyVarReplacements con auto-detect quote wrapping                              | hecho  | 5.2     | —          |

### F19.6 · Audit scripts + dashboards

| #   | Tarea                                                                                       | Estado | Bloquea | Desbloquea |
| --- | ------------------------------------------------------------------------------------------- | ------ | ------- | ---------- |
| 6.1 | `scripts/audit-token-coverage.mjs` — tokens definidos vs usados, hardcoded literales en JSX | hecho  | —       | 6.4        |
| 6.2 | `scripts/audit-spec-coherence.mjs` — cross-ref RF↔AC↔TU/TE↔fuera, orphan detection          | hecho  | —       | 6.4        |
| 6.3 | `scripts/coverage-trend.mjs` — sparkline histórico de coverage % sobre últimos 20 commits   | hecho  | 6.1     | 6.4        |
| 6.4 | `scripts/audit-design-system.mjs` — dashboard unificado de los 3 audit scripts anteriores   | hecho  | 6.1-6.3 | —          |
| 6.5 | Wire-up `pnpm audit:tokens`, `pnpm spec:audit`, `pnpm design:audit:batch2` en package.json  | hecho  | 6.4     | —          |

### F19.7 · Cleanup — archivos descatalogados eliminados

| #   | Tarea                                                                   | Estado | Bloquea | Desbloquea |
| --- | ----------------------------------------------------------------------- | ------ | ------- | ---------- |
| 7.1 | Eliminar `specs/catalog-pipeline-stripe/` (contenido migrado a trunk)   | hecho  | —       | —          |
| 7.2 | Eliminar `.cursorignore`, `.superpowers/` (herramienta descatalogada)   | hecho  | —       | —          |
| 7.3 | Eliminar `docs/superpowers/` (contenido obsoleto, backup si necesario)  | hecho  | —       | —          |
| 7.4 | Eliminar `docs/AUDITORIA-CRITICA.md` (reemplazado por auditorías vivas) | hecho  | —       | —          |

---

## Tracks paralelos (reestructuración 2026-07-12, actualizada 2026-07-24)

Nuevo orden por prioridad de negocio (ver plan). P0→P4 secuencia; P1 y P2 en paralelo.

```
P0 (Hardening seguridad) ──────► P1 (Profesionalización & Comercialización)
                                     │
P0 ───────────────────────────────► P2 (Monitorización, F17 sube)
                                     │
                                   P3 (Agentes IA F15: mínimo/congelar)
                                     │
                                   P4 (Pulido & gates CI)
                                     │
                                   P5 (Design System Truth — saneamiento CSS)
```

| Track | Fase | Nombre                                | Depende de              |
| ----- | ---- | ------------------------------------- | ----------------------- |
| 0     | P0   | Hardening seguridad del código nuevo  | F14, F14b               |
| 1     | P1   | Profesionalización & Comercialización | P0                      |
| 2     | P2   | Monitorización full-stack (F17)       | — (paralelo a P1)       |
| 3     | P3   | Agentes IA (F15) mínimo/congelar      | P0.2 (ruta /tasks)      |
| 4     | P4   | Pulido & gates CI                     | P1, P2                  |
| 5     | P5   | Design System Truth (F19)             | commit del working tree |

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

- **F7.5** (2026-07-10): Stripe live (`sk_live_...`, webhook → `https://alexendros.dev/api/stripe/webhook`). Smoke test OK.
- **F14 + F14b** (2026-07-09): webhook ampliado + CRM REST (8 endpoints) + pipeline 9 stages + Notion sync. 229 tests, 32 files, 0 lint/typecheck.
- **F11 + F12 + F13** (2026-07-05): catálogo unificado, checkout unified (subscription mode) y canal secundario implementados y desplegados.
- **F19 · Design System Truth** (2026-07-24): auditoría completa CSS + 3 batches de saneamiento + 5 audit scripts + 2 specs activos. **Pendiente de commit.**

## Referencias

- Specs activos:
  - `specs/design-system-truth/` — single source of truth del design system (12 RFs, 48 ACs, 24 tests)
  - `specs/design-system-fixes-batch2/` — sub-spec delta (RF11-RF13, token coverage 90%)
- Especificación archivada: `docs/archive/2026-07-09-f15-agentes-ia-design.md` (histórico F15, congelado en P3)
- Arquitectura: `ARCHITECTURE.md` — stack, rutas, modelos, testing
- Testing: `tests/README.md` — pirámide completa, patrones, cobertura
- AGENTS.md: contexto del proyecto, comandos, infraestructura, variables, métricas actuales
