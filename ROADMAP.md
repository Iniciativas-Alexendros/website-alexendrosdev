# ROADMAP — portfolio-alexendros

> Fuente de verdad del avance. Se consulta **antes** de retomar trabajo y se actualiza en **cada PR**.
> Estados: `pendiente` · `en curso` · `hecho` · `bloqueado`.
> Plan completo: `~/.claude/plans/implementa-este-dise-o-para-calm-cray.md`.

## Leyenda de dependencias

- **Bloquea**: qué impide empezar/cerrar la tarea.
- **Desbloquea**: qué habilita al completarla.

---

## F0 · Prepare — cimientos, docs y repo

| #    | Tarea                                                                | Estado    | Bloquea | Desbloquea     |
| ---- | -------------------------------------------------------------------- | --------- | ------- | -------------- |
| 0.1  | Scaffold Next.js 16 (TS, App Router, Tailwind v4, ESLint, src/)      | hecho     | —       | todo           |
| 0.2  | Instalar deps + build scripts nativos (sharp, oxide)                 | hecho     | 0.1     | build/dev      |
| 0.3  | Build baseline verde (`pnpm build`)                                  | hecho     | 0.2     | F1             |
| 0.4  | `ROADMAP.md` + `ARCHITECTURE.md` (esqueleto)                         | hecho     | —       | seguimiento    |
| 0.5  | `git init` (main) + `.gitignore` + commit baseline                   | hecho     | 0.4     | 0.6            |
| 0.6  | Crear repo privado GitHub + push (`Alexendros/portfolio-alexendros`) | hecho     | 0.5     | CI/PR          |
| 0.7  | Scaffolding MCEOD L2 `.claude/` (`claude-deploy.sh prepare`)         | pendiente | 0.5     | F6 consolidate |
| 0.8  | Portar tokens (`colors_and_type.css`) + `site.css` (67KB) a la app   | hecho     | 0.3     | F1             |
| 0.9  | Configurar `next/font` (Inter, JetBrains Mono) + `lucide-react`      | hecho     | 0.8     | F1             |
| 0.10 | Toolchain calidad: Prettier, Vitest, Playwright, scripts npm         | pendiente | 0.2     | valoradores    |

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

| #   | Tarea                                                                | Estado    | Bloquea                     | Desbloquea      |
| --- | -------------------------------------------------------------------- | --------- | --------------------------- | --------------- |
| 4.0 | `/init` en Claude Code → `CLAUDE.md` repo (**ACCIÓN OPERADOR**)      | pendiente | 0.6                         | 4.x consolidate |
| 4.1 | Prisma + Supabase: `schema.prisma` (`Lead`, `Subscriber`), migración | bloqueado | `DATABASE_URL` (operador)   | 4.3             |
| 4.2 | `POST /api/contact` + `/api/newsletter`: zod, rate-limit, honeypot   | hecho     | F2                          | 4.4             |
| 4.3 | Resend + React Email (notif. lead, bienvenida)                       | parcial   | `RESEND_API_KEY` (operador) | 4.4             |
| 4.4 | Conectar formularios reales (contacto multi-step, newsletter)        | hecho     | 4.2                         | —               |

> 4.3 parcial: plantillas React Email y envío vía Resend implementados; el envío real
> se activa al definir `RESEND_API_KEY`. Sin clave, degrada (log) y la API responde 200.
> 4.1 bloqueado: cliente Prisma + adapter listos; falta `DATABASE_URL` para migrar/persistir.

## F5 · SEO, a11y, performance

| #   | Tarea                                                             | Estado    | Bloquea | Desbloquea |
| --- | ----------------------------------------------------------------- | --------- | ------- | ---------- |
| 5.1 | `metadata`/OG por ruta, `sitemap.ts`, `robots.ts`, RSS `feed.xml` | hecho     | F2,F3   | —          |
| 5.2 | Auditoría a11y (axe) sin críticos                                 | pendiente | F2,F3   | F6         |
| 5.3 | Presupuesto CWV / Lighthouse; `prefers-reduced-motion`            | pendiente | F2,F3   | F6         |

## F6 · Verify & Consolidate

| #   | Tarea                                                             | Estado    | Bloquea | Desbloquea |
| --- | ----------------------------------------------------------------- | --------- | ------- | ---------- |
| 6.1 | Valoradores en verde (tsc, lint, format, Vitest, Playwright, axe) | hecho     | F5      | 6.3        |
| 6.2 | CI GitHub Actions (lint/test/e2e/build) + runner propio           | pendiente | 0.6     | merge main |
| 6.3 | `claude-deploy.sh verify` + `consolidate --level=L2`              | pendiente | 0.7,6.1 | release    |
| 6.4 | Deploy (diferido): Vercel o Hostinger VPS                         | pendiente | 6.3     | —          |

---

## Bloqueos activos

- **F4.1 / F4.3**: requieren credenciales del operador (`DATABASE_URL` Supabase, `RESEND_API_KEY`). No bloquean F0–F3 ni la lógica de validación/route handlers (se desarrollan con mocks/tests). Se solicitarán al llegar a F4.
- **F4.0 `/init`**: paso humano dentro de Claude Code; no lo ejecuta el agente.

## Notas

- Contenido genérico "Alejandro Vargas" como **seed**; personalización posterior.
- Fidelidad pixel-perfect: comparar contra `screenshots/*.png` del bundle original.
