<!-- stripe-projects-cli managed:agents-md:start -->

## Stripe Projects CLI

This repository is initialized for the Stripe project "website-alexendrosdev".

## Tools used

- [Stripe CLI](https://docs.stripe.com/stripe-cli) with the `projects` plugin to manage third-party services, credentials, and deployments for this project. Use the stripe-projects-cli to manage deploying and access to third party services.

<!-- stripe-projects-cli managed:agents-md:end -->

## Proyecto — website-alexendrosdev

### Stack

| Capa               | Tecnología                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| Framework          | Next.js 16.2.6 (App Router, Turbopack), React 19, TypeScript estricto                           |
| Estilos            | Tailwind CSS v4 (`@theme`) + `src/styles/site.css` (clases `ak-*`) + tokens `design-tokens.css` |
| Fuentes / iconos   | `next/font` (Inter, JetBrains Mono) · `lucide-react`                                            |
| Contenido          | Módulos TS tipados (`src/lib/content/`) + blog MDX (`content/blog/`)                            |
| Backend            | Route Handlers + zod + Prisma/Supabase + Stripe Checkout + Resend + React Email                 |
| Catálogo unificado | `src/lib/content/catalog.ts` — fuente de verdad de precios (céntimos), server-trusted           |
| Calidad            | ESLint, Prettier, tsc, Vitest (26 ficheros, 150 tests), Playwright + axe, Lighthouse/CWV        |
| Gestor             | pnpm 11.5.2                                                                                     |

### Fases (ROADMAP.md)

| Fase     | Nombre                                                                           | Estado                                                  |
| -------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| F0       | Prepare — cimientos, docs, repo                                                  | hecho                                                   |
| F1       | Sistema de diseño y layout global                                                | hecho                                                   |
| F2       | Páginas estáticas                                                                | hecho                                                   |
| F3       | Contenido dinámico                                                               | hecho                                                   |
| F4       | Backend (Init) — Prisma, Supabase, Resend, formularios                           | parcial (4.3 bloqueado por `RESEND_API_KEY`)            |
| F5       | SEO, a11y, performance                                                           | parcial (5.3 CWV sin medición real)                     |
| F6       | Verify & Consolidate — valoradores, CI, deploy                                   | hecho (6.4 deploy resuelto vía Git nativo Vercel)       |
| F7       | Pagos (Stripe Checkout) — client, checkout, webhook, UI                          | parcial (7.5 bloqueado por `STRIPE_SECRET_KEY`)         |
| F8       | Deploy automatizado (Vercel)                                                     | hecho (integración Git nativa, workflow CLI descartado) |
| F9       | Escaparate + deploy en vivo                                                      | hecho                                                   |
| F10      | Estrategia de testing — pirámide completa, gate cobertura                        | hecho (150 tests, gate 93/86/95/92)                     |
| **F11**  | Catálogo unificado (`catalog.ts`, refactor `services.ts`/`checkout.ts`)          | **hecho** — 10 tests unit green                         |
| **F12**  | Checkout unified (subscription mode)                                             | **hecho** — 6 tests integración green                   |
| **F13**  | Canal secundario (transferencia + Stripe Payment Link fallback)                  | **hecho** — 10 tests integración green                  |
| **F14**  | Webhook ampliado + CRM API (8 handlers REST) + Pipeline 9 stages + 3 migraciones | **hecho** — 188 tests, commit `bbbc6a8`                 |
| **F14b** | Notion bidirectional sync (client, mapper, outbound, inbound webhook)            | **hecho** — 219 tests, commit `3c8fbd8`                 |
| **F15**  | Agentes IA autónomos (Python/FastAPI, repo externo `agentes-ia-catalog/`)        | **pendiente** — desbloqueado por F14+F14b               |
| **F16**  | E2E + Gates finales — lock-in cobertura 85/80/85/85                              | **pendiente** — depende de F15                          |

### Specs activos

`specs/catalog-pipeline-stripe/` — 4 artifacts:

- `spec.md` — requerimientos RF1-RF7, criterios AC1-AC23, DAG de dependencias
- `contract.md` — schemas Zod, Shape de API, migraciones, variables de entorno
- `scenarios.md` — happy paths (HP1-HP7), edge cases (EC1-EC13), diagramas de flujo
- `test-plan.md` — 104 tests planificados (F11-F16), instrucciones para el modelo que el sistema recomiende como orquestador

### Comandos

```bash
pnpm dev              # next dev --turbo
pnpm build            # next build (32 rutas deben compilar)
pnpm start            # next start (build de producción)
pnpm test             # Vitest (unit + integración + componentes), una pasada
pnpm test:coverage    # Vitest con cobertura v8 + umbrales bloqueantes
pnpm test:watch       # Vitest en watch
pnpm e2e              # Playwright + axe (levanta build automáticamente)
pnpm lint             # ESLint (0 errors requerido)
pnpm typecheck        # tsc --noEmit (0 errors requerido)
pnpm format:check     # Prettier --check
pnpm format           # Prettier --write
```

### Testing

Pirámide completa documentada en `tests/README.md`. 219 tests, 32 ficheros.

Cobertura v8 sobre `src/lib/**` + `src/app/api/**`:

| Métrica    | Gate lock-in |
| ---------- | ------------ |
| Statements | 85%          |
| Branches   | 70%          |
| Functions  | 93%          |
| Lines      | 87%          |

**Regla RSC**: Server Components asíncronos (páginas, `/proyectos/[slug]`, `/blog/[slug]`) se cubren por e2e, no por Vitest.

### Infraestructura

| Servicio     | Estado                                                                       | Nota                                                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**   | ✅ deploy Git nativo (push a `main` → prod). Dominio `alexendros.dev`        | Env vars configuradas: `DATABASE_URL`, `DIRECT_URL`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TRANSFER_IBAN`, `TRANSFER_BENEFICIARY`, `CRM_API_KEY` |
| **Supabase** | ✅ self-hosted en Coolify (`supabase-website-alexendrosdev`, Docker oficial) | Postgres en la MiniPC, conectividad vía Cloudflare Tunnel (`db.alexendros.cloud`). 5 migraciones aplicadas.                                                                 |
| **Stripe**   | ⚠️ null-safe, clave pendiente (operador)                                     | Pagos reales no activos; código y tests con `vi.mock`                                                                                                                       |
| **Resend**   | ⚠️ null-safe, clave pendiente (operador)                                     | Emails transaccionales no activos; código y tests con `vi.mock`                                                                                                             |
| **MiniPC**   | NVIDIA RTX 5060, Ollama (`ornith:9b`, `qwen2.5-coder:7b`, `bge-m3`)          | Coolify + Supabase self-hosted + SigNoz. Cloudflare Tunnel para exponer DB.                                                                                                 |
| **MCP**      | Stripe CLI 1.43.6 + plugin projects 0.22.0 en `~/.local/bin`                 | `stripe-projects` skill en `~/.agents/skills/`                                                                                                                              |

### Variables de entorno críticas

Definidas en `.env.example`. **Todas null-safe**: la app arranca y responde 200 aunque falten. Los clientes degradan a log/warn.

| Variable                                 | Desbloquea                                                  | Bloquea?                                                                 |
| ---------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`                           | Persistencia real (Prisma) en Vercel/`.env.local`           | Sin ella, Prisma = `null` en prod. CRM API (F14) **necesitará** DB real. |
| `DIRECT_URL`                             | Migraciones DDL (pooler PgBouncer no soporta `CREATE TYPE`) | Solo para `prisma migrate deploy`.                                       |
| `RESEND_API_KEY`                         | Emails transaccionales reales                               | Sin ella, F4.3 degrada a `console.log`. No bloquea nada más.             |
| `STRIPE_SECRET_KEY`                      | Pagos reales Stripe Checkout                                | Sin ella, `/api/checkout` → 503. Webhook también degradado.              |
| `STRIPE_WEBHOOK_SECRET`                  | Verificación de firma en webhook                            | Sin ella, webhook → 200 `{ received: true }` sin procesar.               |
| `TRANSFER_IBAN` + `TRANSFER_BENEFICIARY` | Canal secundario transferencia bancaria (F13)               | Sin ellas, `paymentMethod: "transfer"` → 503.                            |
| `CRM_API_KEY`                            | API CRM (F14) — auth `X-API-Key`                            | Sin ella, CRM → 503. **Necesaria para F14+F15**.                         |
| `NOTION_API_KEY`                         | Sync bidireccional Notion (F14b)                            | Sin él, sync degrada a warn.                                             |
| `NOTION_CONTACTS_DB_ID`                  | Outbound sync Contact→Notion                                | Sin él, sync Contact silenciado.                                         |
| `NOTION_DEALS_DB_ID`                     | Outbound sync Deal→Notion                                   | Sin él, sync Deal silenciado.                                            |
| `NOTION_WEBHOOK_SECRET`                  | Verificación firma webhook Notion                           | Sin él, webhook ack sin procesar.                                        |
| `COMING_SOON=1`                          | Opt-in para landing `/proximamente`                         | Apagado por defecto (sitio público).                                     |
