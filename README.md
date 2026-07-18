# [Alexendros.dev](https://alexendros.dev) · Portfolio profesional de Alejandro Domingo Agustí: 'Software & Platform Engineering' desde Valencia.

[![CI](https://github.com/Iniciativas-Alexendros/website-alexendrosdev/actions/workflows/ci.yml/badge.svg)](https://github.com/Iniciativas-Alexendros/website-alexendrosdev/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/deployed-Vercel-000?logo=vercel)](https://alexendros.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)


## Stack

| Capa           | Tecnología                                                 |
| -------------- | ---------------------------------------------------------- |
| Runtime        | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript |
| Estilos        | Tailwind CSS v4 · Design system Arctic Ocean               |
| Blog           | MDX (next-mdx-remote/rsc) · rehype-slug                    |
| Backend        | Route Handlers · Zod · Prisma 7 · Postgres (Supabase)      |
| Email          | Resend · React Email                                       |
| Pagos          | Stripe Checkout                                            |
| Observabilidad | Vercel Analytics · Speed Insights · OpenTelemetry          |
| Calidad        | ESLint · Prettier · Vitest · Playwright + axe              |

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # opcional: degrada sin credenciales
pnpm dev                     # http://localhost:3000
```

## Rutas

| Ruta              | Descripción                 |
| ----------------- | --------------------------- |
| `/`               | Landing principal           |
| `/sobre-mi`       | Perfil profesional          |
| `/proyectos`      | Portfolio de proyectos      |
| `/stack`          | Grafo radial de tecnologías |
| `/blog`           | Artículos MDX               |
| `/servicios`      | Servicios ofrecidos         |
| `/contacto`       | Formulario de contacto      |
| `/api/contact`    | API de leads                |
| `/api/newsletter` | Suscripción newsletter      |
| `/api/checkout`   | Stripe Checkout             |
| `/api/health`     | Health check                |

## Desarrollo

```bash
pnpm lint           # ESLint
pnpm typecheck      # TypeScript
pnpm test           # Vitest unit tests
pnpm e2e            # Playwright E2E
pnpm build          # Build producción
```

## CI/CD

GitHub Actions ejecuta `quality` (lint → typecheck → test → build) + `e2e`. Vercel despliega automáticamente a producción desde `main`.

## Variables de entorno

Ver [`.env.example`](./.env.example). El sitio funciona sin credenciales: los formularios responden 200 pero no persisten ni envían correo.

## License

MIT
