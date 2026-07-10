# ROADMAP — website-alexendrosdev

> Fuente de verdad del avance. Se consulta **antes** de retomar trabajo y se actualiza en **cada PR**.
> Estados: `pendiente` · `en curso` · `hecho` · `bloqueado`.
> Plan completo: `~/.claude/plans/implementa-este-dise-o-para-calm-cray.md`.

## Leyenda de dependencias

- **Bloquea**: qué impide empezar/cerrar la tarea.
- **Desbloquea**: qué habilita al completarla.

---

## F0 · Prepare — cimientos, docs y repo

| #    | Tarea                                                                 | Estado | Bloquea | Desbloquea     |
| ---- | --------------------------------------------------------------------- | ------ | ------- | -------------- |
| 0.1  | Scaffold Next.js 16 (TS, App Router, Tailwind v4, ESLint, src/)       | hecho  | —       | todo           |
| 0.2  | Instalar deps + build scripts nativos (sharp, oxide)                  | hecho  | 0.1     | build/dev      |
| 0.3  | Build baseline verde (`pnpm build`)                                   | hecho  | 0.2     | F1             |
| 0.4  | `ROADMAP.md` + `ARCHITECTURE.md` (esqueleto)                          | hecho  | —       | seguimiento    |
| 0.5  | `git init` (main) + `.gitignore` + commit baseline                    | hecho  | 0.4     | 0.6            |
| 0.6  | Crear repo privado GitHub + push (`Alexendros/website-alexendrosdev`) | hecho  | 0.5     | CI/PR          |
| 0.7  | Scaffolding L2 `.claude/` (settings, overlay, plugins Vercel)         | hecho  | 0.5     | F6 consolidate |
| 0.8  | Portar tokens (`colors_and_type.css`) + `site.css` (67KB) a la app    | hecho  | 0.3     | F1             |
| 0.9  | Configurar `next/font` (Inter, JetBrains Mono) + `lucide-react`       | hecho  | 0.8     | F1             |
| 0.10 | Toolchain calidad: Prettier, Vitest, Playwright, scripts npm          | hecho  | 0.2     | valoradores    |

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
| 4.3 | Resend + React Email (notif. lead, bienvenida)                       | parcial | `RESEND_API_KEY` (operador) | 4.4             |
| 4.4 | Conectar formularios reales (contacto multi-step, newsletter)        | hecho   | 4.2                         | —               |

> 4.3 parcial: plantillas React Email y envío vía Resend implementados; el envío real
> se activa al definir `RESEND_API_KEY`. Sin clave, degrada (log) y la API responde 200.
> 4.1 hecho: esquema migrado a Supabase self-hosted en Coolify (`supabase-website-alexendrosdev`,
> migración `20260605000000_init` aplicada). RLS habilitada en todas las tablas públicas
> (`20260609000000_enable_rls`). `DATABASE_URL` apunta al self-hosted vía Cloudflare Tunnel.

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

| #   | Tarea                                                               | Estado | Bloquea | Desbloquea |
| --- | ------------------------------------------------------------------- | ------ | ------- | ---------- |
| 7.1 | Cliente `lib/stripe.ts` null-safe + catálogo server-trusted         | hecho  | —       | 7.2        |
| 7.2 | `POST /api/checkout` (zod, rate-limit, precio del servidor)         | hecho  | 7.1     | 7.4        |
| 7.3 | `POST /api/stripe/webhook` (firma) + modelo `Order` Prisma          | hecho  | 7.1     | 7.4        |
| 7.4 | UI: addons comprables en `/servicios` + página `/checkout/success`  | hecho  | 7.2     | F17        |
| 7.5 | Activar pagos reales (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) | hecho  | F17.13  | —          |

## F17 · Stripe production activation (test → live)

Activación operativa de Stripe, empezando en modo test y escalando a live con
un cambio arquitectónico menor: preferir `price` (pre-creado en el Dashboard)
sobre `price_data` inline para mejor analytics. El código de checkout y
webhook ya estaba implementado y testeado en F7/F11-F14b.

| #     | Tarea                                                                                      | Estado | Notas                                                                     |
| ----- | ------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------- |
| 17.1  | Recuperar/guardar `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` test en Proton Pass        | hecho  | Item `Stripe` en Infraestructura                                          |
| 17.2  | Crear 9 productos + precios en Dashboard test (3 addons, 3 retainers, 3 proyectos)         | hecho  | `prod_UrBy...` y `price_1TrTaa...`                                        |
| 17.3  | Poblar `stripePriceId` en `catalog.ts` con los IDs de test                                 | hecho  | Commit `5e83a69`                                                          |
| 17.4  | Checkout: preferir `price` sobre `price_data` inline (con fallback)                        | hecho  | Commit `5e83a69` + `7d39128` (live guard)                                 |
| 17.5  | Configurar webhook test → URL de development (rama `development`)                          | hecho  | `we_1TrTsA...` con `?x-vercel-protection-bypass=`                         |
| 17.6  | Añadir `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` test al entorno Development de Vercel | hecho  | `vercel env add`                                                          |
| 17.7  | Deploy + test end-to-end en modo test (rama `development` redeploy)                        | hecho  | `cs_test_...` devuelto, 200 OK                                            |
| 17.8  | Merge a main (rama `development` → `main`)                                                 | hecho  | Commit `21f06c2`                                                          |
| 17.9  | Onboarding Stripe live (cuenta verificada, datos bancarios)                                | hecho  | Alexendros, `acct_1RgYAKK8xOmiNNUK`                                       |
| 17.10 | Crear 9 productos + precios live (mismo mapeo, IDs distintos)                              | hecho  | `prod_UrCs...` y `price_1TrUSU...`                                        |
| 17.11 | Configurar env vars live en Vercel Production (`sk_live_...`, `whsec_...`)                 | hecho  | `vercel env add` tras `rm` (eran vacías)                                  |
| 17.12 | Crear webhook live apuntando a `https://alexendros.dev/api/stripe/webhook`                 | hecho  | `we_1TrUSpK8xOmiNNUKB8yz7tob`                                             |
| 17.13 | Smoke test live: `POST /api/checkout` con `sesion-consultoria` → sesión real               | hecho  | `cs_live_a12DZla01aFPPLuu8ZeCR1Jwk1wsrGbXNarP6B02q0qCS1laXlUK8wzQMj`, 60€ |
| 17.14 | Actualizar `ROADMAP.md` y `ARCHITECTURE.md` (esta sección)                                 | hecho  | —                                                                         |

**Decisión de diseño**: el catálogo lleva los `stripePriceId` de test. Para live,
`isLiveMode` (derivado del prefijo de la clave activa) fuerza la degradación a
`price_data` inline. Los importes siguen siendo server-trusted desde el catálogo
(importe en céntimos, nunca del cliente). Para usar `stripePriceId` en live
también, hay que poblar el catálogo con `price_live_...` y refinar la guardia
en `src/app/api/checkout/route.ts` (siguiente iteración, fuera de F17).

**Resultado**: `alexendros.dev` acepta pagos reales vía Stripe Checkout. El
catálogo unificado (F11), el checkout unified (F12), el canal secundario (F13),
el webhook ampliado (F14) y el resto del pipeline quedan operativos sin
cambios adicionales.

**Pendiente fuera de F17**:

- Smoke test end-to-end con pago real confirmado (cancelación, subscripción, etc.)
- Población del catálogo con `price_live_...` (mejora de analytics, no bloqueante)
- Tests e2e Playwright contra el deploy de development (cubre `alexendros.dev` real)

## F8 · Deploy automatizado (Vercel)

| #   | Tarea                                                                | Estado     | Bloquea | Desbloquea |
| --- | -------------------------------------------------------------------- | ---------- | ------- | ---------- |
| 8.1 | `deploy.yml` (workflow_run tras CI) + `vercel.json` + `.env.example` | descartado | 6.2     | 8.2        |
| 8.2 | Despliegue real a producción                                         | hecho      | —       | —          |

> Deploy resuelto vía **integración Git nativa de Vercel** (2026-06-15): push a `main`
> → producción; ramas/PR → preview. El workflow `deploy.yml` por CLI se eliminó por
> redundante (fallaba en `vercel pull` con "Project not found" por `VERCEL_PROJECT_ID`
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

> Holding page (sitio lanzado): el portfolio completo es público por defecto en todos los entornos.
> La landing `/proximamente` (vía `src/middleware.ts` + `isComingSoon` en `src/lib/flags.ts`) queda
> como **opt-in**: actívala con `COMING_SOON=1` para volver a cerrar el sitio temporalmente. La
> cabecera/pie se ocultan en ese modo.

> Nota build (2026-06-15): el fallo `useContext` null en sandbox **ya no se reproduce**;
> `next build` compila las 28 rutas en verde en local (worktree), igual que CI/Vercel.

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
> | Hito          | Statements | Branches | Functions | Lines |
> | ------------- | ---------- | -------- | --------- | ----- |
> | F10.2 base    | 60         | 55       | 60        | 60    |
> | F10.3 +API    | 72         | 68       | 72        | 72    |
> | F10.4 +comp   | 80         | 75       | 80        | 80    |
> | F10.8 lock-in | 93         | 86       | 95        | 92    |
>
> Medición actual ≈ **96/89/98/96** (101 tests verdes). El gate de F10.8 se fija ~3 pts por debajo
> de lo medido (lock-in seguro). Los componentes/páginas (Server Components asíncronos incluidos) se
> cubren por comportamiento (proyecto `component` y e2e), no por porcentaje. Regla RSC: async server
> components → e2e.
>
> E2E (chromium): `smoke` + `navigation`, `projects`, `blog`, `services`, `stack`, `newsletter`,
> `checkout` y `a11y` (axe sin críticos en 8 rutas, incluida `/stack`). Cubre flujos cliente y los
> Server Components asíncronos de detalle (`/proyectos/[slug]`, `/blog/[slug]`).

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

> 10 tests integración green en `tests/integration/checkout.test.ts` (T3.1–T3.10). 4 tests componente
> en `tests/component/PurchaseCard.test.tsx` (T3.11–T3.14). Bloqueos: `TRANSFER_IBAN`,
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

> 31 tests nuevos (4 client + 11 mapper + 8 sync + 8 webhook). 219 tests totales.
> Env vars: `NOTION_API_KEY`, `NOTION_CONTACTS_DB_ID`, `NOTION_DEALS_DB_ID`, `NOTION_WEBHOOK_SECRET`.
> Todas null-safe: la app arranca sin ellas. Sync degrada como Stripe/Resend.
> Postgres es source of truth. Notion es vista de consulta/edición rápida.

## F15 · Agentes IA autónomos + Hardening con Ornith

| #    | Tarea                                                                           | Estado    | Bloquea       | Desbloquea |
| ---- | ------------------------------------------------------------------------------- | --------- | ------------- | ---------- |
| 15.1 | Repo `agentes-ia-catalog/` (Python/FastAPI, `localhost:8400`)                   | pendiente | —             | 15.2–15.8  |
| 15.2 | LLM provider agnostic: Ollama local (ornith:9b) + fallback OpenCode Zen free    | pendiente | 15.1          | 15.3–15.5  |
| 15.3 | Agente Auditor (cron 15 min, detecta deals estancados, ≥3 fallos checkout/5min) | pendiente | 15.2, CRM API | 15.4       |
| 15.4 | Agente Diagnosticador (`POST /diagnose`, hipótesis con confianza 0.0–1.0)       | pendiente | 15.3          | 15.5       |
| 15.5 | Agente Reparador (`POST /repair`, reintenta persistencia vía CRM API)           | pendiente | 15.4          | 15.6       |
| 15.6 | Health endpoint + degradación sin Ollama/cloud                                  | pendiente | 15.2–15.5     | 15.7       |
| 15.7 | Hardening: tests de utilidad con Ornith (evalúa calidad de diagnósticos)        | pendiente | 15.4          | 15.8       |
| 15.8 | Hardening: tests de cumplimiento con Ornith (evalúa respeta CRM API contract)   | pendiente | 15.5          | F16        |

> Repo externo: `/home/alexendros/repositorios/personal/agentes-ia-catalog/`. 31 tests pytest.
> Stack: Python 3.12+, FastAPI, uv, pytest, httpx, respx.
> LLM: Ollama local `ornith:9b` (primario) + OpenCode Zen free (fallback: `mimo-v2.5-free` → `deepseek-v4-flash-free` → `north-mini-code-free`).
> Hardening: Ornith evalúa calidad diagnósticos (utilidad) y contrato API (cumplimiento).
> No comparte proceso con Next.js — se comunica solo por HTTP con CRM API.

## F16 · E2E + Gates finales

| #    | Tarea                                                                           | Estado    | Bloquea        | Desbloquea |
| ---- | ------------------------------------------------------------------------------- | --------- | -------------- | ---------- |
| 16.1 | 8 tests e2e (`/servicios`, `/escaparate`, `/checkout/success`, a11y multi-ruta) | pendiente | F14, F14b, F15 | —          |
| 16.2 | Lock-in cobertura: statements ≥85%, branches ≥80%, functions ≥85%, lines ≥85%   | pendiente | F14, F14b, F15 | —          |
| 16.3 | Gates calidad: lint 0, typecheck 0, build verde, format OK                      | pendiente | 16.1, 16.2     | release    |
| 16.4 | Actualizar ARCHITECTURE.md (rutas CRM, Subscription, agentes IA)                | pendiente | 16.3           | —          |

> Worktree: `wt/catalog-pipeline-str-f16` (merge final con todas las fases previas integradas).
> Lock-in actual: 95/83/98/96 (branches bajo por falta de tests CRM). Gate final: 85/80/85/85.

---

## Estado de cierre (2026-06-15) — Reposicionamiento hacia desarrollo

Pivote del eje comercial de **seguridad → desarrollo de plataformas/webs/apps** y reescritura
del copy a lenguaje accesible para el cliente (menos jerga), más precios contenidos para
empresas nuevas/pequeñas:

- **Mensaje/tono**: hero, footer, terminal, metadatos/OG (`layout.tsx`), páginas
  `sobre-mi`/`servicios`/`proyectos`/`blog` y `feed.xml` reorientados a desarrollo y sin jerga
  (XEK, SAST/SCA/DAST, mTLS, check-only, hardening, gateway de credenciales).
- **Servicios** (`services.ts`): desarrollo lidera (webs/apps, plataformas, automatización);
  seguridad pasa a servicio secundario. Precios contenidos (ancla ≈ €40-45/h): proyecto
  €1.200/€2.900/€5.900+, cuota €690/€1.290/€1.990, addons €60-600.
- **Catálogo Stripe** (`checkout.ts`): reencuadrado (puesta a punto web, consultoría, revisión
  de seguridad) con precios contenidos; test `checkout.test.ts` actualizado.
- **Proyectos** (`projects.ts`): TrenchPass → «Plataforma / Backend», XEK → «Herramientas /
  Automatización»; `alexendros.me` (web) ascendido a destacado. Nuevo `kind: "Plataforma"`.
- **Higiene**: `.idea/`/`.junie/`/`.ruff_cache/` a `.gitignore` y `.prettierignore`.
- **Verificación**: lint + typecheck + vitest (21/21) + `next build` (28 rutas) en verde.

## Estado de cierre (2026-07-05) — Auditoría F11-F13 + planificación F14-F16

Fases F11-F13 completadas y verificadas (150 tests verdes, lint 0 errors, typecheck 0,
build 32 rutas). Catálogo unificado, checkout con subscription mode y canal secundario
(transferencia bancaria + Stripe Payment Link fallback) implementados y testeados.

- **F11**: `catalog.ts` con 9 items (addons, retainers, proyectos), precios server-trusted
  en céntimos. `services.ts` y `checkout.ts` derivados del catálogo (10 tests unit green).
- **F12**: `POST /api/checkout` ampliado con `itemId`, `mode`, `paymentMethod`. Items
  `recurring` → subscription mode. Item `one_time` + mode subscription → fuerza payment
  sin error 422. Compatibilidad hacia atrás `{ item }` legacy (6 tests integración green).
- **F13**: Canal transferencia: Invoice proforma, IBAN, referencia `INV-YYYY-NNN`.
  Fallback Payment Link ante error de Stripe. Degradación sin stripe → 503 con datos
  transferencia si configurado (10 tests integración green).

**Próxima fase (F14)**: Webhook ampliado + CRM API + Pipeline 9 stages. Dependencias
satisfechas: schema Prisma CRM (`20260616120000_add_crm_schema` en repo y DB), catálogo
(F11). Worktree `wt/catalog-pipeline-str-f14` desde main. 41 tests según test-plan.md
T4.1-T4.41. Orquestación delegable al agente `general` con spec-driven workflow.

## Bloqueos activos

- **F4.3**: requiere `RESEND_API_KEY` del operador para el envío real de emails transaccionales. Sin clave, degrada a `console.log` y la API responde 200. No bloquea ninguna fase pendiente.
- **F13**: `TRANSFER_IBAN` y `TRANSFER_BENEFICIARY` pendientes del operador. Canal transferencia implementado y testeado; solo falta configurar las credenciales reales.
- **F14**: requiere `CRM_API_KEY` (generada por operador) para activar auth en los 11 endpoints REST. `prisma migrate deploy` contra Supabase con `DIRECT_URL` para las 3 migraciones nuevas (Subscription table, seed 9 PipelineStage, `stripeInvoiceId` en Invoice).
- **Infra Coolify**: Supabase self-hosted en Coolify. Cloudflare Tunnel pendiente de configurar en la MiniPC para exponer `db.alexendros.cloud:5432`.

## Desbloqueos recientes

- **F7.5** (2026-07-10): Stripe live activado. `STRIPE_SECRET_KEY` (`sk_live_...`) y
  `STRIPE_WEBHOOK_SECRET` configuradas en Vercel Production. Webhook live
  `we_1TrUSpK8xOmiNNUKB8yz7tob` apuntando a `https://alexendros.dev/api/stripe/webhook`.
  Smoke test confirmó sesión de checkout real (`cs_live_...`). Ver F17 para el detalle.

## Referencias

- Spec: `specs/catalog-pipeline-stripe/` — spec.md, contract.md, scenarios.md, test-plan.md
- Arquitectura: `ARCHITECTURE.md` — stack, rutas, modelos, testing
- Testing: `tests/README.md` — pirámide completa, patrones, cobertura
- AGENTS.md: contexto del proyecto, comandos, infraestructura, variables

## Estado de cierre (2026-06-01)

Implementadas y verificadas (CI verde, PRs #1–#3 mergeados a `main`): **F0–F6** salvo
los ítems que dependen de credenciales o deploy:

- **F0.7** scaffolding `.claude/` L2 — **hecho** (PR #4, settings + overlay + plugins Vercel).
- **F4.0** `/init` → `CLAUDE.md` — **hecho** (PR #3).
- **F4.1 / F4.3** persistencia y envío real — listos en código; faltan `DATABASE_URL` y
  `RESEND_API_KEY` para activarlos (sin ellos, degrada y responde 200).
- **F6.3** verificación `.claude/` L2 — **hecho** (settings.json, overlay, .gitignore).
- **F6.4** deploy (Vercel) — pendiente.

## Estado de cierre (2026-06-09)

Provisionada la base de datos Supabase self-hosted en Coolify y aplicada la
migración inicial:

- **F9.4** — **hecho**: migración `20260605000000_init` aplicada al self-hosted y
  verificada. Tablas `Lead`, `Subscriber` y `Order` creadas con sus índices.
- **Hardening RLS** — Row Level Security habilitada en las 4 tablas públicas (`Lead`,
  `Subscriber`, `Order`, `_prisma_migrations`). Sin políticas: el rol owner que usa Prisma
  ignora RLS, así que la app sigue operando, mientras la Data API (PostgREST) deniega
  `anon`/`authenticated`. Esto despeja el aviso **ERROR** `rls_disabled_in_public` sobre
  `_prisma_migrations`; los 3 avisos **INFO** `rls_enabled_no_policy` restantes son el
  estado deseado para un backend que usa Prisma (no la Data API).
- **Reproducibilidad** — el hardening queda versionado en `20260609000000_enable_rls`
  (sentencias idempotentes), de modo que un `prisma migrate deploy` limpio reproduce la
  postura de seguridad. Producción ya está endurecida; esa migración se registrará en el
  próximo `deploy`.
- **Pendiente (operador)** — inyectar `DATABASE_URL` y `DIRECT_URL` en Vercel y `.env.local`
  para activar la persistencia real contra el self-hosted (Cloudflare Tunnel). Plantilla en `.env.example`.

## Notas

- Contenido personalizado con los datos reales de **Alejandro Domingo Agustí** (Alexendros) y sus 5 proyectos OSS públicos (TrenchPass, plantillas, XEK, GV.ERRA, alexendros.me). El seed original ("Alejandro Vargas") queda archivado en la rama `base-seed-snapshot`. Pendientes marcados con `TODO:`: precios reales, historial laboral previo, testimonios, URL de LinkedIn.
- Fidelidad pixel-perfect: comparar contra `screenshots/*.png` del bundle original.
