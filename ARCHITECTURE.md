# ARCHITECTURE — website-alexendrosdev

> Mapeado vivo de la aplicación. Se amplía conforme se crean rutas y módulos.
> Diseño origen: **Arctic Ocean** (Next.js + Tailwind v4 + shadcn/ui). Bundle prototipo: `~/Repositorios/portfolioalejandrovargas.zip`.

## Stack

| Capa             | Tecnología                                                                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack), React 19, TypeScript estricto                                                                                                                                                                |
| Estilos          | Tailwind CSS v4 (`@theme`) + `src/styles/site.css` (portado, clases `ak-*`) + tokens `design-tokens.css`                                                                                                                         |
| Fuentes / iconos | `next/font` (Inter, JetBrains Mono) · `lucide-react`                                                                                                                                                                             |
| Contenido        | Módulos TS tipados (`src/lib/content/`) + blog en MDX (`content/blog/`)                                                                                                                                                          |
| Backend          | Route Handlers + zod + Resend + React Email + Prisma 7 / Postgres (Supabase self-hosted en Coolify)                                                                                                                              |
| Pagos            | Stripe Checkout **live activo** (`sk_live_...`, webhook `we_1TrUSpK8xOmiNNUKB8yz7tob`) + catálogo unificado con price IDs dual-mode (`test`/`live`) + canal transferencia + Payment Link fallback (F7 + F7-activ. + F7-activ.5b) |
| CRM              | API REST (`/api/crm/`) con 9 stages de pipeline, auth `X-API-Key` (F14 hecho)                                                                                                                                                    |
| Agentes IA       | Módulos TS integrados en `src/lib/agents/` — 3 agentes (Auditor/Diagnosticador/Reparador) con provider LLM híbrido Gemini 3.5 Flash (primario) + OpenCode Zen free (fallback) (F15 re-priorizado a P3, congelado)                |
| Calidad          | ESLint, Prettier, tsc, Vitest, Playwright, axe, Lighthouse/CWV                                                                                                                                                                   |
| Gestor           | pnpm ≥10                                                                                                                                                                                                                         |

## Árbol de rutas (App Router)

```
/                       app/page.tsx              (RSC + islas)   Home
/sobre-mi               app/sobre-mi/page.tsx      (RSC)           Sobre mí
/proximamente           app/proximamente/page.tsx  (RSC)           Landing (opt-in COMING_SOON=1)
/proyectos              app/proyectos/page.tsx     (RSC + isla)    Lista + filtros
/proyectos/[slug]       app/proyectos/[slug]/      (RSC · SSG)     Caso de estudio
/stack                  app/stack/page.tsx         (RSC + isla)    Grafo radial
/blog                   app/blog/page.tsx          (RSC)           Lista de posts
/blog/[slug]            app/blog/[slug]/           (RSC · SSG·MDX) Post
/servicios              app/servicios/page.tsx     (RSC + isla)    Tiers + FAQ
/contacto               app/contacto/page.tsx      (RSC + isla)    Form multi-step
/checkout/success       app/checkout/success/      (RSC)           Confirmación post-pago
/api/contact            app/api/contact/route.ts   (Route Handler) POST lead
/api/newsletter         app/api/newsletter/route.ts(Route Handler) POST suscripción
/api/newsletter/confirm app/api/newsletter/confirm/(Route Handler) GET confirmación (double opt-in)
/api/checkout           app/api/checkout/route.ts  (Route Handler) POST sesión Stripe / transferencia
/api/stripe/webhook     app/api/stripe/webhook/route.ts (Route Handler) POST eventos Stripe
/api/crm/*              app/api/crm/**             (8 Route Handlers) REST CRM (auth X-API-Key, F14)
/api/health           app/api/health/route.ts    (Route Handler) Health check (F17)
/api/agents/*         app/api/agents/** (F15)    (5 Route Handlers) health, hooks, audit, diagnose, repair
/sitemap.xml /robots.txt /feed.xml                 SEO
```

## Árbol de directorios (objetivo)

```
src/
  app/                  rutas (arriba) + layout.tsx + globals.css
  components/
    ui/                 Button, Icon, Eyebrow, SectionHead, Input
    sections/           Header, Footer, Terminal, Marquee, Hero, Zigzag,
                        Testimonials, ServicesList, StackGraph, ContactForm, ...
    providers/          ThemeProvider (no-flash)
  lib/
    content/            catalog.ts (fuente de verdad precios, 9 items con `stripePriceId`),
                        projects.ts, posts.ts, services.ts, timeline.ts, stack.ts,
                        testimonials.ts, faq.ts, checkout.ts (deprecado → reexporta catálogo),
                        types.ts
    crm/                invoice-number.ts, pipeline.ts, crm-auth.ts
    agents/         F15: auditor, diagnosticador, reparador, llm, crm-client, prompts, schemas
    db/                 cliente Prisma
    stripe.ts           cliente Stripe + `isLiveMode` (deriva del prefijo `sk_live_`)
    validation/         esquemas zod (contact, newsletter, checkout)
    hooks/              useReveal, useTheme
    utils/              helpers
  styles/               design-tokens.css, site.css (portados)
emails/                 plantillas React Email
content/blog/           *.mdx
prisma/                 schema.prisma
tests/                  unit + integration + component (Vitest) + e2e (Playwright); helpers/, fixtures/
public/                 assets estáticos
.github/workflows/      ci.yml
.claude/                scaffolding MCEOD L2
```

## Testing

Pirámide en cuatro capas con gate de cobertura (detalle y patrones en `tests/README.md`):

- **Unit** (`tests/unit/`, Vitest/node): lógica pura/stateful — validación zod, rate-limit, JSON-LD, blog, contenido, init null-safe de clientes.
- **Integración** (`tests/integration/`, Vitest/node): los 4 Route Handlers invocando el `POST` exportado con un `Request` y mockeando `prisma`/`resend`/`stripe` (`vi.mock` + getters hoisted). Cubre 200/400/422/429/503/502, honeypot, rate-limit y la degradación null-safe.
- **Componentes** (`tests/component/`, Vitest/jsdom + RTL): islas cliente, con MSW para la red. Regla RSC: los Server Components **asíncronos** no se testean aquí, van a e2e.
- **E2E** (`tests/e2e/`, Playwright + axe): flujos sobre el build de producción y accesibilidad multi-ruta.

Vitest usa dos `projects` (node + jsdom) y aliasa `server-only`→módulo vacío para poder importar la lógica servidor. Cobertura v8 sobre `src/lib/**` + `src/app/api/**` con umbrales que bloquean el merge (`pnpm test:coverage`, también en CI).

## Frontera cliente/servidor

- **Server Components** (por defecto): páginas, layout, lectura de contenido tipado y MDX, SEO.
- **Client Components** (`"use client"`): `Terminal`, `StackGraph`, `ContactForm`, `Testimonials` (carrusel), `ThemeToggle`, `Marquee`, nav móvil del `Header`, filtros de `/proyectos`.

## Tema (no-flash)

`localStorage` del prototipo → **cookie `ao-theme`** leída en `app/layout.tsx` (SSR) + script bloqueante mínimo que aplica `.dark` en `<html>` antes de la hidratación. Toggle cliente persiste cookie + actualiza `<html>`.

Tokens: light **Arctic Frost** (steel) / dark **Ocean Depths** (teal). Acento configurable (artefacto Tweaks descartado en prod).

## Checkout + canales de cobro

```
POST /api/checkout { itemId, mode?, paymentMethod? }
│
├─ paymentMethod = "stripe" (default)
│   ├─ stripe.checkout.sessions.create → 200 { url }
│   │   ├─ error → stripe.paymentLinks.create → 200 { url, fallback: true }
│   │   └─ ambos fallan → 502 { error, fallbackAttempted: true }
│   └─ !stripe → 503 → ¿TRANSFER_IBAN configurado? → sí → datos transferencia
│                                                   → no → { error }
│
├─ paymentMethod = "transfer"
│   ├─ email/name → 422
│   ├─ prisma → Invoice proforma (status: pending_transfer, INV-YYYY-NNN)
│   │   └─ 200 { iban, beneficiary, reference, amount, concept, invoiceId }
│   ├─ !prisma → 503
│   └─ !TRANSFER_IBAN → 503
│
├─ Zod parse → 422
├─ Rate-limit 5/min → 429
├─ item one_time + mode subscription → fuerza payment + warn (no 422)
└─ item recurring → mode subscription por defecto
```

Webhook (`POST /api/stripe/webhook`, ampliado en F14):

- `checkout.session.completed` → upsert Order. Si `dealId` en metadata → avance a "Cerrado ganado".
- `invoice.paid` → upsert Invoice CRM.
- `customer.subscription.updated` → upsert Subscription.
- `customer.subscription.deleted` → cancela Subscription + crea Task HIGH.

## Flujo de datos de formularios

```
ContactForm (cliente, multi-step)
   └─ fetch POST /api/contact
        └─ zod parse  ──(inválido)──► 422 + errores de campo
        └─ rate-limit + honeypot ──(abuso)──► 429
        └─ Prisma: crea Lead
        └─ Resend: email de notificación (React Email)
        └─ 200 { ok: true }
NewsletterForm (Footer/CTA) ─► POST /api/newsletter ─► zod ─► Subscriber ─► email bienvenida
```

## Modelo de datos (Prisma)

```
Lead          { id, name, email, type?, message, source, createdAt, utm* }
Subscriber    { id, email (unique), confirmed, token?, tokenExpiresAt?, confirmedAt?, createdAt }
Order         { id, stripeSessionId (unique), item, amount, currency, email?, status, createdAt }

─ CRM (registrado en schema.prisma, migración 20260616120000_add_crm_schema en DB) ─
Contact       { id, type, status, firstName, lastName?, email?, phone?, company?, position?, website?, notes? }
Product       { id, name, description?, unitPrice, currency, active }
PipelineStage { id, name, description?, order (unique), color? }
Deal          { id, title, value, currency, probability, closedAt?, notes?, contactId→Contact, stageId?→PipelineStage }
DealItem      { id, quantity, unitPrice, totalPrice, dealId→Deal, productId?→Product }
Activity      { id, type (EMAIL|CALL|MEETING|NOTE|TASK|OTHER), title, description?, occurredAt, contactId?, dealId? }
Task          { id, title, description?, priority (LOW|MEDIUM|HIGH|URGENT), doneAt?, dueAt?, contactId?, dealId? }
Invoice       { id, number (unique), status, issuedAt, dueAt?, paidAt?, subtotal, taxRate, taxAmount, total, currency, notes?, contactId?, dealId? }
InvoiceItem   { id, description, quantity, unitPrice, totalPrice, invoiceId→Invoice, productId?→Product }

─ Aplicadas (F14, 3 migraciones) ─
Subscription  { id, stripeSubscriptionId (unique), customerId?, itemId, status, currentPeriodEnd?, cancelledAt?, createdAt, updatedAt }
stripeInvoiceId en Invoice: columna String? @unique para idempotencia de webhook invoice.paid
PipelineStage seed: 9 stages con orden 0-9 y colores hex
```

## Mapa prototipo → producción

| Prototipo (zip)                  | Destino                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| `colors_and_type.css`            | `src/styles/design-tokens.css`                              |
| `site.css`                       | `src/styles/site.css`                                       |
| `lib/core.jsx`                   | `components/sections/*` + `components/ui/*` + `lib/hooks/*` |
| `lib/data.jsx`                   | `src/lib/content/*.ts`                                      |
| `lib/home.jsx`, `about.jsx`, ... | páginas `app/**` correspondientes                           |
| `lib/tweaks-panel.jsx`           | descartado (dev-only opcional)                              |
| `*.html`                         | rutas App Router                                            |

## Agentes IA (F15, código hecho, P3 congelado)

> Estado estratégico actual: la implementación de los 5 endpoints y los módulos de agentes ya
> existe en código, pero F15 quedó **congelada en P3** tras la reestructuración 2026-07-12. No se
> invierte más en agentes hasta que P1 (F18) y P2 (F17) estén consolidados. El Reparador opera en
> modo determinista/dryRun por defecto en producción; el LLM solo decide la acción, el código la
> ejecuta.

Módulos TypeScript integrados en `src/lib/agents/` (sin repo externo, sin Ollama, sin
Python). 5 endpoints REST en `src/app/api/agents/`. Comunicación con el resto del
sistema solo vía HTTP (CRM API `/api/crm/*` con auth `X-API-Key`).

| Agente         | Endpoint                    | Función                                                                                          |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| Auditor        | `POST /api/agents/hooks`    | Recibe eventos Stripe, los clasifica con LLM o reglas deterministas                              |
| Auditor        | `POST /api/agents/audit`    | Trigger manual de auditoría (cron 15 min, deals estancados, anomalías)                           |
| Diagnosticador | `POST /api/agents/diagnose` | Formula hipótesis de fallo con confianza 0.0-1.0 (DB caída, Stripe down, rate-limit, red)        |
| Reparador      | `POST /api/agents/repair`   | LLM decide acción correctiva, código ejecuta vía CRM API (validación Zod del payload)            |
| Health         | `GET /api/agents/health`    | `{ status, llm: { gemini, zen }, crm: boolean }` — null-safe (servicios no configurados = "off") |

**Provider LLM híbrido** (cascada):

```
gemini-3.5-flash (primario, Google Gemini API gratuita, 1M contexto, thinking budgets)
  → deepseek-v4-flash-free (fallback 1, OpenCode Zen)
    → mimo-v2.5-free (fallback 2, OpenCode Zen)
      → north-mini-code-free (fallback 3, OpenCode Zen, solo Reparador)
        → heurísticas deterministas (degradación total)
```

Racional: Gemini 3.5 Flash es el más capaz en razonamiento (thinking budgets, 1M tokens
de contexto), estable (no en feedback period) y gratuito. Los 3 modelos free de
OpenCode Zen actúan como fallback ante rate limits o indisponibilidad de Gemini.

**Reparador con LLM**: el LLM propone el plan de acción (qué endpoint CRM llamar, con
qué payload). El código parsea el JSON con Zod y ejecuta deterministamente. El LLM nunca
invoque APIs por su cuenta.

**Env vars** (todas null-safe):

- `GEMINI_API_KEY` — provider primario
- `OPENCODE_ZEN_API_KEY` — 3 fallbacks free
- `OPENCODE_ZEN_BASE_URL` (default `https://api.opencode.ai/v1`)
- `OPENCODE_ZEN_MODELS` (default `deepseek-v4-flash-free,mimo-v2.5-free,north-mini-code-free`)
- `CRM_API_KEY` — auth para `crm-client.ts`
- `AGENT_AUDIT_INTERVAL` (default `900000` = 15 min)

Sin ninguna API key → degradación determinista: Diagnosticador/Reparador devuelven
`action: "none"`, Auditor usa reglas de conteo.

## Stripe live (F7-activ., hecho)

`alexendros.dev` acepta pagos reales desde 2026-07-10. Configuración:

- **Catálogo** (`src/lib/content/catalog.ts`): 9 items, cada uno con
  `stripePriceIds: { test, live }` apuntando a sus precios en cada Dashboard.
  Los importes en céntimos siguen siendo server-trusted. El helper
  `getCatalogPriceId(item, mode)` resuelve el ID del modo activo o `null`.
- **Cliente** (`src/lib/stripe.ts`): exporta `stripe` (null-safe) y `isLiveMode`
  (booleano derivado del prefijo de la clave activa).
- **Checkout** (`src/app/api/checkout/route.ts`): resuelve el `priceId` con
  `getCatalogPriceId(item, isLiveMode ? "live" : "test")`; lo usa si existe;
  si no, degrada a `price_data` inline con los importes del catálogo. Esto
  se aplica tanto a `checkout.sessions.create` como al fallback de
  `paymentLinks.create` (F13).
- **Webhook** (`src/app/api/stripe/webhook/route.ts`): sin cambios respecto a
  F14. Verifica firma y procesa 4 eventos (`checkout.session.completed`,
  `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`).
- **Env vars Vercel Production**:
  - `STRIPE_SECRET_KEY` = `sk_live_...` (Standard key)
  - `STRIPE_WEBHOOK_SECRET` = `whsec_...` del webhook live
- **Webhook endpoint live**: `we_1TrUSpK8xOmiNNUKB8yz7tob`
  apuntando a `https://alexendros.dev/api/stripe/webhook`.
- **Productos live** (Dashboard Stripe): 9 productos con sus 9 precios
  pre-creados. Smoke test post-F7-activ.5b confirmó que el checkout live usa
  `price: "price_1TrUSW..."` y `product: prod_UrCswCK6GqUFDm` (no productos
  anónimos generados por `price_data`).

Para auditoría/rollback, las claves viven en el item "Stripe" del vault
"Infraestructura" en Proton Pass, junto con las claves test.

### Tests de integridad del catálogo (F7-activ.5b)

`tests/unit/catalog.test.ts` añade 7 tests de invariantes:

- Todo item activo y comprable (PURCHASABLES) tiene AMBOS IDs (`test` y `live`).
- Todos los IDs siguen el formato `^price_[A-Za-z0-9]{10,}$`.
- Para el mismo item, los IDs de test y live son distintos.
- Ningún ID de test se reusa como ID de live en otro item (detecta swap).
- `getCatalogPriceId` devuelve el ID del modo solicitado.
- `getCatalogPriceId` devuelve `null` si falta el ID del modo.

`tests/integration/checkout.test.ts` añade 3 tests E2E:

- En live mode usa `stripePriceIds.live`.
- En test mode usa `stripePriceIds.test`.
- En live mode con retainer usa el `price_...` live con `mode: "subscription"`.

`isLiveMode` en el mock pasa a ser un getter sobre `mocks.state.isLiveMode`,
lo que permite alternar test ↔ live dentro de la misma suite.

```

## Specs y artefactos de diseño

**Spec única activa**: `specs/design-system-truth/` es la single source of truth del design
system (4 artifacts: `spec.md` · `contract.md` · `scenarios.md` · `test-plan.md`). Auto-validador
`scripts/audit-spec-coherence.mjs` cross-referencia RF↔AC↔TU/TE/TS↔filesystem y reporta el score
global. Orquestador `scripts/audit-design-system.mjs` combina tokens + colors + spec en un
scoreboard unificado con semáforo.

**Histórico archivado**: `docs/archive/` contiene artifacts cuyo ciclo de planificación
concluyó:

- `docs/archive/2026-07-09-f15-agentes-ia-design.md` — diseño Agentes IA (F15 congelado en P3).

**Fases F11–F16 (catálogo + checkout + CRM) sin spec externa.** Las decisiones contractuales vividas
hoy son los tests (`tests/unit/catalog.test.ts`, `tests/integration/{checkout,crm-*}.test.ts`,
`tests/integration/stripe-webhook.test.ts`) y `tests/README.md`. Códigos hash de las fases
consolidadas: F11 (catálogo) `bbbc6a8`, F14+F14b (CRM + Notion) `3c8fbd8`.

## Monitorización y salud (F17, Track P2)

> Track P2 en paralelo a F18 (P1). `/api/health` ya existe; SigNoz/OTel y alertas están planificadas.

| Componente     | Tipo       | Identificador                         | Detalle                                                              |
| -------------- | ---------- | ------------------------------------- | -------------------------------------------------------------------- |
| Health check   | Route      | `GET /api/health`                     | Null-safe: DB, Stripe, Resend, MiniPC reportan `"disabled"` si no están configurados. |
| Uptime externo | Servicio   | Monitor externo (Uptime Robot / cron-job.org) | Ping a `/api/health` cada 5 min.                                     |
| Telemetría     | Librería   | `@vercel/otel`                        | Traces a SigNoz self-hosted en MiniPC vía Cloudflare Tunnel.         |
| Alertas        | Integración | Resend                               | Email tras N checks fallidos; requiere `RESEND_API_KEY`.            |

## Contenido y marketing (F18, Track P1)

> Próximo objetivo prioritario tras F16. Infraestructura ya lista (`/blog`, newsletter, MDX); falta activar flujos y producir posts.

- **Blog**: rutas `/blog` y `/blog/[slug]` renderizan MDX desde `content/blog/`.
- **Newsletter**: `/api/newsletter` (suscripción + double opt-in) y `POST /api/newsletter/send` (admin) para disparos masivos.
  - Requiere `RESEND_API_KEY` para envío real; sin ella la API degrada a `console.log`.
- **Analytics**: `@vercel/analytics` activo en `layout.tsx`; objetivos de conversión y seguimiento de funnel pendientes.
- **Próximas acciones**: activar `RESEND_API_KEY`, publicar 2 posts iniciales, crear calendario editorial y templates de newsletter.
```
