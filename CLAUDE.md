# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

Gestor: **pnpm ≥10** (lockfile `pnpm-lock.yaml`, `pnpm-workspace.yaml` declara `allowBuilds` para native deps).

```bash
pnpm dev            # servidor de desarrollo (Turbopack) → http://localhost:3000
pnpm build          # build de producción
pnpm lint           # ESLint (eslint-config-next)
pnpm typecheck      # tsc --noEmit (TS estricto)
pnpm format:check   # Prettier en modo verificación (CI); pnpm format para escribir
pnpm test           # Vitest (unit) en modo run
pnpm test:watch     # Vitest en watch
pnpm e2e            # Playwright + axe (e2e)
```

- **Un solo test unitario**: `pnpm exec vitest run tests/unit/validation.test.ts` (o `-t "<nombre>"` para filtrar por título).
- **Un solo e2e**: `pnpm exec playwright test tests/e2e/smoke.spec.ts`. `playwright.config.ts` arranca `pnpm dev` automáticamente (webServer).
- **Base de datos**: `pnpm db:migrate` (dev) / `pnpm db:deploy` (prod) / `pnpm db:generate`. `postinstall` ejecuta `prisma generate`. Las migraciones **exigen** `DATABASE_URL`; `prisma generate` funciona sin ella.

El pipeline de CI (`.github/workflows/ci.yml`, job `quality`) corre en orden: `format:check → lint → typecheck → test → build`; el job `e2e` depende de `quality`. Replica ese orden antes de dar trabajo por cerrado.

## Arquitectura

Portfolio fullstack en **Next.js 16 (App Router, Turbopack) · React 19 · TS estricto**, migración de un prototipo HTML/CSS/JS (sistema de diseño _Arctic Ocean_) a app real con backend propio.

**Degradación sin credenciales** — patrón central y no obvio. El sitio arranca y responde 200 aunque falten `DATABASE_URL` y `RESEND_API_KEY`:

- `src/lib/db.ts`: `prisma` es `PrismaClient | null` — `null` si no hay `DATABASE_URL`.
- `src/lib/email.ts`: `resend` es `Resend | null` — `null` si no hay `RESEND_API_KEY`.
- `src/lib/stripe.ts`: `stripe` es `Stripe | null` — `null` si no hay `STRIPE_SECRET_KEY`. `POST /api/checkout` responde 503 (la UI ofrece contacto como fallback) y `POST /api/stripe/webhook` acusa recibo sin procesar cuando falta la clave o `STRIPE_WEBHOOK_SECRET`.
- Los Route Handlers (`src/app/api/{contact,newsletter,checkout}/route.ts` y `api/stripe/webhook`) comprueban `if (prisma)` / `if (resend)` / `if (stripe)` antes de usarlos; sin ellos, registran un aviso en log y degradan. **No asumas que estos clientes son no-nulos**: cualquier acceso debe ir guardado.
- **Pagos (Stripe Checkout)**: el precio es **fuente de verdad del servidor**. El catálogo tipado vive en `src/lib/content/checkout.ts` (`PURCHASABLES`, `getPurchasable`); el cliente solo envía el `id` del item, nunca el importe. El webhook persiste un `Order` (guardado por `if (prisma)`) tras verificar la firma con `STRIPE_WEBHOOK_SECRET`.

**Frontera cliente/servidor**. Todo es Server Component (RSC) por defecto. Las islas cliente (`"use client"`) son: `Terminal`, `StackGraph`, `ContactView`, `Testimonials`, `ThemeToggle`, `Marquee`, nav móvil del `Header`, filtros de proyectos. Los módulos servidor llevan `import "server-only"` (`db.ts`, `email.ts`, `blog.ts`).

**Contenido tipado como fuente de datos**. No hay CMS: el contenido vive en módulos TS tipados en `src/lib/content/` (`projects.ts`, `posts.ts`, `services.ts`, `about.ts`, `stack.ts`, `testimonials.ts`, `case-studies.ts`, `site.ts`; tipos en `types.ts`, reexport en `index.ts`). El blog combina metadatos en `content/posts.ts` con el **cuerpo MDX** en `content/blog/*.mdx`, leído por `src/lib/blog.ts` (`getPostSource` devuelve `null` si no existe el archivo) y renderizado con `next-mdx-remote/rsc` (+ `rehype-slug`, TOC en `lib/utils/toc.ts`).

**Validación y abuso**. Esquemas zod en `src/lib/validation.ts` (`contactSchema`, `flattenErrors`). Los handlers aplican rate-limit en memoria (`src/lib/rate-limit.ts`) y honeypot antes de persistir. Errores de validación → 422 con `fields`; rate-limit → 429.

**Tema (no-flash)**. Script bloqueante en `app/layout.tsx` que lee `localStorage['ao-theme']` (o `prefers-color-scheme`) y aplica `.dark` en `<html>` antes de hidratar. El toggle cliente persiste en ese mismo `localStorage`. Tokens en `src/styles/design-tokens.css` + estilos portados en `src/styles/site.css` (clases `ak-*`), sobre Tailwind v4 (`@theme` en `globals.css`).

**Componentes** organizados por ruta bajo `src/components/sections/` (`home/`, `blog/`, `projects/`, `services/`, `contact/`, `stack/` + transversales `Header`, `Footer`, `Marquee`, `Terminal`, `ThemeToggle`). Primitivos en `src/components/ui/` (`Button`, `Icon`, `SectionHead`). Emails React Email en `src/emails/`.

**Modelo Prisma** (`prisma/schema.prisma`): `Lead { id, name, email, type?, message, source, createdAt }` y `Subscriber { id, email@unique, confirmed, createdAt }`. Prisma 7 con adapter Postgres (`@prisma/adapter-pg`); la URL se inyecta en `prisma.config.ts` (ya no en `schema.prisma`).

## Notas

- `ARCHITECTURE.md` describe en parte el **árbol objetivo**, no el real. Donde diverja, **manda el código**: p. ej. el tema usa `localStorage`/script (no cookie SSR `ao-theme`), `lib/db` y `lib/validation` son ficheros planos (no carpetas), `emails/` está en `src/emails/`, y el `Lead` real usa `type` (no `company`/`budget`).
- El contenido está **personalizado** con los datos reales de Alejandro Domingo Agustí (Alexendros): identidad en `src/lib/content/site.ts`, sus 5 proyectos OSS en `projects.ts`, y blog en `content/blog/`. El seed original ("Alejandro Vargas") queda archivado en la rama `base-seed-snapshot`. Quedan marcadores `TODO:` para datos no públicos (precios, historial laboral previo, testimonios, URL de LinkedIn); edita en `src/lib/content/` y `content/blog/`.
- El panel de _Tweaks_ del prototipo se descartó en producción.
- `ROADMAP.md` es la fuente de verdad del avance: consúltalo antes de retomar trabajo y actualízalo en cada PR.
- Las variables de entorno (`DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_TO_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL`) van en `.env.local`; nunca versionar `.env*` con valores reales. Plantilla documentada en `.env.example` (única `.env*` versionada).
- **Deploy**: lo gestiona la **integración Git nativa de Vercel** (push a `main` → producción; ramas/PR → preview). El workflow `deploy.yml` por CLI se eliminó por redundante (fallaba en `vercel pull` con "Project not found"). La CI (`.github/workflows/ci.yml`) sigue siendo la fuente de verdad de calidad; Vercel despliega por su cuenta.
