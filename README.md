# [Alexendros.dev](https://alexendros.dev) · Portfolio profesional de Alejandro Domingo Agustí: 'Software & Platform Engineering' desde Valencia.

[![CI](https://github.com/Iniciativas-Alexendros/website-alexendrosdev/actions/workflows/ci.yml/badge.svg)](https://github.com/Iniciativas-Alexendros/website-alexendrosdev/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/deployed-Vercel-000?logo=vercel)](https://alexendros.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Coverage: 80% branches](https://img.shields.io/badge/coverage-80%25_branches-brightgreen?logo=vitest)](https://github.com/Iniciativas-Alexendros/website-alexendrosdev/actions)
[![Tokens: 93%](https://img.shields.io/badge/tokens-93%25_coverage-brightgreen?logo=css3)](./docs/DESIGN.md#resumen-ejecutivo)

Diseño y desarrollo **webs, aplicaciones y plataformas a medida** para negocios y proyectos digitales. También construyo herramientas internas, automatizaciones y open source.

➡️ [alexendros.dev](https://alexendros.dev) · [Servicios](https://alexendros.dev/servicios) · [Contacto](https://alexendros.dev/contacto)

---

## Qué hago

| Servicio                                   | Desde       | Para qué                                                   |
| ------------------------------------------ | ----------- | ---------------------------------------------------------- |
| **Landing de 1 página**                    | €600        | Una página bien hecha para presentar tu negocio o producto |
| **Web y aplicaciones a medida**            | €1.200      | Tu sitio o app, de la idea al lanzamiento                  |
| **Plataformas y producto digital**         | €2.900      | Paneles de gestión, áreas privadas, pagos, integraciones   |
| **Automatización y herramientas internas** | a consultar | Conecto tus sistemas y automatizo tareas repetitivas       |
| **Revisión de seguridad**                  | desde €600  | Reviso tu web y te explico qué mejorar, sin tocar nada     |

[Ver servicios completos →](https://alexendros.dev/servicios)

### Cómo trabajo

- **Alcance claro y precio cerrado** antes de empezar. Los cambios pequeños van incluidos; los grandes se hablan y se acuerdan. Sin sorpresas.
- **Pruebas automáticas** y revisión antes de cada entrega. Nada se entrega sin verificar que funciona.
- **Código tuyo, sin ataduras**: open source siempre que es posible, documentado y reproducible para que tu equipo lo mantenga.

---

## Proyectos destacados

| Proyecto                                                         | Tecnologías                         | Enlace                                                                  |
| ---------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| **Gráficas Nasve** — Web y tienda para imprenta familiar         | Next.js, React, TypeScript          | proyecto de cliente                                                     |
| **alexendros.me** — Sitio personal sin rastreo ni cookies        | Next.js, Tailwind, Vercel           | [alexendros.me](https://alexendros.me)                                  |
| **Pipeline CRM + Notion** — Automatización de ventas (188 tests) | Next.js, Prisma, Stripe, Notion API | [repo](https://github.com/Iniciativas-Alexendros/website-alexendrosdev) |
| **Catálogo unificado + Stripe Checkout**                         | Stripe, Zod, Next.js                | [repo](https://github.com/Iniciativas-Alexendros/website-alexendrosdev) |
| **MCP Toolkit** — Servidores para agentes IA                     | TypeScript, Rust, MCP               | [github.com/Alexendros](https://github.com/Alexendros)                  |

[Ver todos los proyectos →](https://alexendros.dev/proyectos)

---

## Stack técnico

**Frontend:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4  
**Backend:** Route Handlers · Zod · Prisma 7 · PostgreSQL (Supabase)  
**Pagos:** Stripe Checkout · Webhooks con verificación de firma  
**Email:** Resend · React Email  
**Observabilidad:** OpenTelemetry · SigNoz · Vercel Analytics  
**Calidad:** 436 tests · Cobertura branches 80% · Playwright + axe · ESLint · Prettier

---

## Desarrollo

```bash
pnpm install                    # instalar dependencias
cp .env.example .env.local      # opcional: funciona sin credenciales
pnpm dev                        # http://localhost:3000
pnpm test                       # 436 tests, 50 ficheros
pnpm test:coverage              # con gates bloqueantes
pnpm typecheck                  # tsc --noEmit
pnpm lint                       # ESLint (0 errors)
pnpm e2e                        # Playwright + axe
pnpm build                      # build producción (32 rutas)
```

**CI/CD:** GitHub Actions ejecuta `quality` (lint → typecheck → test → build) + `e2e`.  
**Deploy:** Vercel despliega automáticamente desde `main`.

**Variables de entorno:** Ver [`.env.example`](./.env.example). El sitio funciona sin credenciales — los endpoints degradan con log y responden 200.

---

## Licencia

MIT
