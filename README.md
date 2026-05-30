# portfolio-alexendros

Portfolio fullstack (Platform Engineer & Fullstack Developer) construido con **Next.js 16** sobre el sistema de diseño **Arctic Ocean**. Migración fiel del prototipo HTML/CSS/JS de Claude Design a una aplicación real con backend propio.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** estricto
- **Tailwind CSS v4** + `site.css` portado (tokens HSL, light _Arctic Frost_ / dark _Ocean Depths_)
- **next/font** (Inter, JetBrains Mono) · **lucide-react** (+ SVG de marca inline)
- **MDX** para el blog (`next-mdx-remote/rsc`, TOC vía `rehype-slug`)
- **Backend**: Route Handlers + **zod** + **Resend** + **React Email** + **Prisma 7 / Postgres (Supabase)**
- **Calidad**: ESLint · Prettier · tsc · Vitest · Playwright + axe

## Rutas

`/` · `/sobre-mi` · `/proyectos` (+ `/proyectos/[slug]`) · `/stack` (grafo radial) · `/blog` (+ `/blog/[slug]` MDX) · `/servicios` · `/contacto` · API: `/api/contact`, `/api/newsletter` · SEO: `/sitemap.xml`, `/robots.txt`, `/feed.xml`.

Mapa detallado en [`ARCHITECTURE.md`](./ARCHITECTURE.md). Estado y plan en [`ROADMAP.md`](./ROADMAP.md).

## Desarrollo

```bash
pnpm install
cp .env.example .env.local   # opcional: el backend degrada sin credenciales
pnpm dev                     # http://localhost:3000
```

Sin `DATABASE_URL` ni `RESEND_API_KEY` el sitio funciona: los formularios responden 200 pero no persisten ni envían correo (se registra un aviso en log).

## Scripts

| Script                                               | Acción                                        |
| ---------------------------------------------------- | --------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start`             | desarrollo / build / producción               |
| `pnpm lint` · `pnpm typecheck` · `pnpm format:check` | valoradores estáticos                         |
| `pnpm test`                                          | tests unitarios (Vitest)                      |
| `pnpm e2e`                                           | tests end-to-end (Playwright + axe)           |
| `pnpm db:migrate` / `pnpm db:deploy`                 | migraciones Prisma (requieren `DATABASE_URL`) |

## Variables de entorno

Ver [`.env.example`](./.env.example): `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_TO_EMAIL`. Nunca versionar `.env*` con valores reales.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`): `quality` (lint, typecheck, test, build) + `e2e`. El runner es configurable con la variable de repositorio `CI_RUNNER` (p. ej. `self-hosted` para el runner propio); por defecto `ubuntu-latest`.

## Notas

- El contenido ("Alejandro Vargas" y datos de ejemplo) es **seed/marcador**; se personalizará en una iteración posterior. Edita los módulos en `src/lib/content/` y los posts en `content/blog/`.
- El panel de _Tweaks_ del prototipo (artefacto del diseñador) se ha descartado en producción.
