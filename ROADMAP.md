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
> 4.1 hecho: esquema migrado a Supabase (proyecto `hjshdsohotcsfrivsyml`, migración
> `20260605000000_init` aplicada y verificada por checksum vía MCP). RLS habilitada en
> todas las tablas públicas (`20260609000000_enable_rls`). Resta inyectar `DATABASE_URL`
> en el runtime (Vercel/`.env.local`) para activar la persistencia en producción.

## F5 · SEO, a11y, performance

| #   | Tarea                                                             | Estado  | Bloquea | Desbloquea |
| --- | ----------------------------------------------------------------- | ------- | ------- | ---------- |
| 5.1 | `metadata`/OG por ruta, `sitemap.ts`, `robots.ts`, RSS `feed.xml` | hecho   | F2,F3   | —          |
| 5.2 | Auditoría a11y (axe) sin críticos                                 | hecho   | F2,F3   | F6         |
| 5.3 | Presupuesto CWV / Lighthouse; `prefers-reduced-motion`            | parcial | F2,F3   | F6         |

## F6 · Verify & Consolidate

| #   | Tarea                                                             | Estado   | Bloquea | Desbloquea |
| --- | ----------------------------------------------------------------- | -------- | ------- | ---------- |
| 6.1 | Valoradores en verde (tsc, lint, format, Vitest, Playwright, axe) | hecho    | F5      | 6.3        |
| 6.2 | CI GitHub Actions (lint/test/e2e/build) + runner propio           | hecho    | 0.6     | merge main |
| 6.3 | Verificación `.claude/` L2 (settings, overlay, plugins)           | hecho    | 0.7,6.1 | release    |
| 6.4 | Deploy (diferido): Vercel o Hostinger VPS                         | en curso | 6.3     | F8         |

## F7 · Pagos (Stripe Checkout)

| #   | Tarea                                                               | Estado    | Bloquea                  | Desbloquea |
| --- | ------------------------------------------------------------------- | --------- | ------------------------ | ---------- |
| 7.1 | Cliente `lib/stripe.ts` null-safe + catálogo server-trusted         | hecho     | —                        | 7.2        |
| 7.2 | `POST /api/checkout` (zod, rate-limit, precio del servidor)         | hecho     | 7.1                      | 7.4        |
| 7.3 | `POST /api/stripe/webhook` (firma) + modelo `Order` Prisma          | hecho     | 7.1                      | 7.4        |
| 7.4 | UI: addons comprables en `/servicios` + página `/checkout/success`  | hecho     | 7.2                      | —          |
| 7.5 | Activar pagos reales (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) | bloqueado | claves Stripe (operador) | —          |

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

## Bloqueos activos

- **F4.3**: requiere `RESEND_API_KEY` del operador para el envío real (sin clave degrada y responde 200). No bloquea F0–F3 ni la lógica de validación/route handlers (se desarrollan con mocks/tests).
- **F4.1**: DB Supabase provisionada y migrada (ver F9.4); resta inyectar `DATABASE_URL` en el runtime (Vercel/`.env.local`) para activar la persistencia.

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

Provisionada la base de datos Supabase (proyecto `hjshdsohotcsfrivsyml`) y aplicada la
migración inicial:

- **F9.4** — **hecho**: migración `20260605000000_init` aplicada al proyecto Supabase y
  verificada por checksum (`list_migrations` vía MCP). Tablas `Lead`, `Subscriber` y `Order`
  creadas con sus índices.
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
- **Pendiente (operador)** — inyectar `DATABASE_URL` (y la variante pooler) en Vercel y
  `.env.local` para activar la persistencia real; plantilla en `.env.example`.

## Notas

- Contenido personalizado con los datos reales de **Alejandro Domingo Agustí** (Alexendros) y sus 5 proyectos OSS públicos (TrenchPass, plantillas, XEK, GV.ERRA, alexendros.me). El seed original ("Alejandro Vargas") queda archivado en la rama `base-seed-snapshot`. Pendientes marcados con `TODO:`: precios reales, historial laboral previo, testimonios, URL de LinkedIn.
- Fidelidad pixel-perfect: comparar contra `screenshots/*.png` del bundle original.
