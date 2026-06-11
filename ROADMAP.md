# ROADMAP — portfolio-alexendros

> Fuente de verdad del avance. Se consulta **antes** de retomar trabajo y se actualiza en **cada PR**.
> Estados: `pendiente` · `en curso` · `hecho` · `bloqueado`.
> Plan completo: `~/.claude/plans/implementa-este-dise-o-para-calm-cray.md`.

## Leyenda de dependencias

- **Bloquea**: qué impide empezar/cerrar la tarea.
- **Desbloquea**: qué habilita al completarla.

---

## F0 · Prepare — cimientos, docs y repo

| #    | Tarea                                                                | Estado | Bloquea | Desbloquea     |
| ---- | -------------------------------------------------------------------- | ------ | ------- | -------------- |
| 0.1  | Scaffold Next.js 16 (TS, App Router, Tailwind v4, ESLint, src/)      | hecho  | —       | todo           |
| 0.2  | Instalar deps + build scripts nativos (sharp, oxide)                 | hecho  | 0.1     | build/dev      |
| 0.3  | Build baseline verde (`pnpm build`)                                  | hecho  | 0.2     | F1             |
| 0.4  | `ROADMAP.md` + `ARCHITECTURE.md` (esqueleto)                         | hecho  | —       | seguimiento    |
| 0.5  | `git init` (main) + `.gitignore` + commit baseline                   | hecho  | 0.4     | 0.6            |
| 0.6  | Crear repo privado GitHub + push (`Alexendros/portfolio-alexendros`) | hecho  | 0.5     | CI/PR          |
| 0.7  | Scaffolding L2 `.claude/` (settings, overlay, plugins Vercel)        | hecho  | 0.5     | F6 consolidate |
| 0.8  | Portar tokens (`colors_and_type.css`) + `site.css` (67KB) a la app   | hecho  | 0.3     | F1             |
| 0.9  | Configurar `next/font` (Inter, JetBrains Mono) + `lucide-react`      | hecho  | 0.8     | F1             |
| 0.10 | Toolchain calidad: Prettier, Vitest, Playwright, scripts npm         | hecho  | 0.2     | valoradores    |

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

| #   | Tarea                                                                | Estado    | Bloquea                    | Desbloquea |
| --- | -------------------------------------------------------------------- | --------- | -------------------------- | ---------- |
| 8.1 | `deploy.yml` (workflow_run tras CI) + `vercel.json` + `.env.example` | hecho     | 6.2                        | 8.2        |
| 8.2 | Activar despliegue real (secretos `VERCEL_TOKEN`/`ORG`/`PROJECT`)    | bloqueado | proyecto Vercel + secretos | —          |

## F9 · Escaparate (página showcase) + deploy en vivo

| #   | Tarea                                                                       | Estado   | Bloquea               | Desbloquea |
| --- | --------------------------------------------------------------------------- | -------- | --------------------- | ---------- |
| 9.1 | `/escaparate`: proyectos featured + items comprables (Stripe) + nav/sitemap | hecho    | F3,7.4                | —          |
| 9.2 | Isla `PurchaseCard` extraída y reutilizada en `/servicios` y `/escaparate`  | hecho    | 9.1                   | —          |
| 9.3 | Endurecer `ci.yml`: `concurrency` cancel-in-progress + `timeout-minutes`    | hecho    | 6.2                   | —          |
| 9.4 | Provisionar Supabase (instancia libre) + `DATABASE_URL` + migración Prisma  | hecho    | Supabase (MCP) + env  | 4.1        |
| 9.5 | Deploy producción Vercel (MCP) + dominio `alexendros.dev`                   | en curso | proyecto Vercel + env | 8.2        |
| 9.6 | Personalización de contenido: datos reales + 5 proyectos OSS de GitHub      | hecho    | 9.1                   | —          |
| 9.7 | Landing "en construcción" `/proximamente` + split preview/prod              | hecho    | 9.1                   | 9.5        |

> Holding page: producción muestra `/proximamente` por defecto (`VERCEL_ENV=production`, vía
> `src/middleware.ts` + `isComingSoon` en `src/lib/flags.ts`); el portfolio completo vive en los
> deploys de preview. Override con `COMING_SOON=0|1`. La cabecera/pie se ocultan en ese modo.

> Nota build (sandbox): `pnpm build` (static export) falla en el contenedor de trabajo con
> `useContext` null en `/` y en `/_global-error` (página del framework), con Turbopack **y** webpack,
> tras reinstalación limpia. La CI de GitHub (mismo Node 22, `react@19.2.4`/`next@16.2.6`) compila el
> mismo código en **verde**, así que la CI/Vercel son la fuente de verdad del build. `/escaparate`
> sirve 200 en dev y pasa format/lint/typecheck/unit.

---

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
