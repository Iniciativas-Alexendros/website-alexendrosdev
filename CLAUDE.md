# CLAUDE.md — website-alexendrosdev

Guía para Claude Code al trabajar en este repositorio.

<proyecto>
Portfolio profesional fullstack de **Alejandro Domingo Agustí (Alexendros)**, Software & Platform Engineer en Valencia — sitio de **alexendros.dev**. Migración de un prototipo HTML/CSS/JS (sistema de diseño _Arctic Ocean_) a una app Next.js real con backend propio. El contenido refleja trabajo real (seguridad, tooling/MCP, infraestructura en Rust/Python/TS) y está personalizado con sus datos. Incluye además un esquema CRM personal en Prisma (contactos, deals, pipeline, facturas) aún no expuesto por UI.
</proyecto>

<stack>
- **Next.js 16.2.6** (App Router, Turbopack) · **React 19.2** · **TypeScript** estricto.
- **Tailwind CSS v4** (`@theme` en `globals.css`) + `site.css` portado (tokens HSL, light _Arctic Frost_ / dark _Ocean Depths_).
- **MDX** blog (`next-mdx-remote/rsc` v6, TOC vía `rehype-slug`) · **lucide-react** · next/font (Inter, JetBrains Mono).
- **Backend**: Route Handlers + **zod v4** + **Resend** + **React Email** + **Stripe** + **Prisma 7 / Postgres (Supabase)** con `@prisma/adapter-pg`.
- **Observabilidad**: `@vercel/otel` + `@vercel/analytics` (cookie-less).
- **Calidad**: ESLint 9 · Prettier · tsc · Vitest 4 · Playwright + axe · Lighthouse/html-validate (scripts de auditoría).

Gestor: **pnpm 11.5.2** (`packageManager` en package.json; lockfile `pnpm-lock.yaml`, `pnpm-workspace.yaml` declara `allowBuilds` para deps nativas).

Comandos REALES (de `package.json` scripts):

```bash
pnpm dev            # next dev (Turbopack) → http://localhost:3000
pnpm build          # next build
pnpm start          # next start (producción local)
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm format         # prettier --write .   (format:check para verificar en CI)
pnpm test           # vitest run (unit + integration + component)
pnpm test:watch     # vitest
pnpm test:coverage  # vitest run --coverage (gate v8 que bloquea merge; lo que corre CI)
pnpm e2e            # playwright test (+ axe)
pnpm db:migrate     # prisma migrate dev   (exige DATABASE_URL)
pnpm db:deploy      # prisma migrate deploy (prod)
pnpm db:generate    # prisma generate (funciona sin DATABASE_URL)
pnpm audit:lh|html|a11y  # auditorías Lighthouse / html-validate / axe (scripts/)
```

- `postinstall` ejecuta `prisma generate`.
- **Un solo test**: `pnpm exec vitest run tests/integration/contact.test.ts` (o `-t "<título>"`; por entorno `--project unit` / `--project component`). Vitest usa dos `projects` (node + jsdom) y aliasa `server-only`→módulo vacío para importar lógica servidor en node.
- **Un solo e2e**: `pnpm exec playwright test tests/e2e/smoke.spec.ts` (`playwright.config.ts` arranca `pnpm dev` vía webServer).
- CI (`.github/workflows/ci.yml`, job `quality`): `format:check → lint → typecheck → test:coverage → build`; job `e2e` depende de `quality`. Replica ese orden antes de cerrar trabajo. Runner configurable con la variable de repo `CI_RUNNER` (default `ubuntu-latest`).
  </stack>

<estado>
- **Activo / en desarrollo intenso.** 93 commits entre 2026-05-30 y **2026-06-19** (~3 semanas), flujo de PRs por rama (`claude/*`). Última actividad: 2026-06-19. Working tree limpio.
- **Madurez: MVP avanzado** acercándose a producción. Frontend completo y personalizado; backend con pagos (Stripe Checkout), captura de leads/newsletter y CRM persistido.
- **¿Funcional? Sí (inferido, NO ejecutado).** Evidencia: config completa (next/ts/eslint/prettier/vitest/playwright/prisma/vercel), deps declaradas con lockfile, **23 ficheros de test** (unit/integration/component/e2e) con gate de cobertura v8, 4 migraciones Prisma aplicables, y patrón de **degradación sin credenciales** que garantiza arranque 200 aunque falten claves. No hay `.next`/`dist` versionado (esperado). No se ejecutó build ni tests en este análisis.
</estado>

<arquitectura>
**Degradación sin credenciales** — patrón central. El sitio arranca y responde 200 aunque falten `DATABASE_URL`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`:
- `src/lib/db.ts` → `prisma: PrismaClient | null`; `src/lib/email.ts` → `resend: Resend | null`; `src/lib/stripe.ts` → `stripe: Stripe | null`. Todos `null` si falta su clave.
- Los Route Handlers (`src/app/api/{contact,newsletter,checkout}/route.ts`, `api/stripe/webhook`) guardan con `if (prisma)` / `if (resend)` / `if (stripe)`; sin ellos degradan y loguean aviso. **Nunca asumas que son no-nulos.** `POST /api/checkout` → 503 si no hay Stripe (UI ofrece contacto como fallback); el webhook acusa recibo sin procesar si falta clave/secreto.
- **Pagos**: el precio es **fuente de verdad del servidor**. Catálogo tipado en `src/lib/content/checkout.ts` (`PURCHASABLES`, `getPurchasable`); el cliente solo envía el `id`. El webhook persiste `Order` (guardado por `if (prisma)`) tras verificar firma con `STRIPE_WEBHOOK_SECRET`.

**Frontera cliente/servidor**: todo RSC por defecto; islas `"use client"`: `Terminal`, `StackGraph`, `ContactView`, `Testimonials`, `ThemeToggle`, `Marquee`, nav móvil del `Header`, filtros de proyectos. Módulos servidor con `import "server-only"` (`db.ts`, `email.ts`, `blog.ts`).

**Contenido tipado como fuente de datos** (no hay CMS): módulos TS en `src/lib/content/` (`projects.ts`, `posts.ts`, `services.ts`, `about.ts`, `stack.ts`, `testimonials.ts`, `case-studies.ts`, `site.ts`, `checkout.ts`; tipos en `types.ts`, reexport en `index.ts`). El blog combina metadatos (`posts.ts`) con cuerpo MDX en `content/blog/*.mdx` (3 posts: plantillas-claude-init, trenchpass-mcp-gateway, xek-verificacion-componible), leído por `src/lib/blog.ts` (`getPostSource`→`null` si no existe) y renderizado con `next-mdx-remote/rsc`.

**Validación/abuso**: esquemas zod en `src/lib/validation.ts`; handlers con rate-limit en memoria (`src/lib/rate-limit.ts`) + honeypot. Validación→422 con `fields`; rate-limit→429.

**Tema (no-flash)**: script bloqueante en `app/layout.tsx` lee `localStorage['ao-theme']` (o `prefers-color-scheme`) y aplica `.dark` antes de hidratar. Tokens en `src/styles/design-tokens.css` + `site.css` (clases `ak-*`) sobre Tailwind v4.

**Estructura** `src/`:

- `app/` rutas: `/` · `/sobre-mi` · `/proyectos`(+`[slug]`) · `/stack`(grafo radial) · `/blog`(+`[slug]` MDX) · `/servicios` · `/contacto` · `/escaparate` · `/proximamente` · `/checkout`(+`/checkout/success`). API: `api/contact`, `api/newsletter`, `api/checkout`, `api/stripe/webhook`. SEO: `feed.xml`, `sitemap.xml`, `robots.txt`.
- `components/` por ruta en `sections/` (`home/`, `blog/`, `projects/`, `services/`, `contact/`, `stack/` + `Header`, `Footer`, `Marquee`, `Terminal`, `ThemeToggle`); primitivos en `ui/`; `providers/`. Emails React Email en `src/emails/`.
- `lib/` `content/`, `hooks/`, `seo/` (JSON-LD/Schema.org), `utils/` (TOC), más ficheros planos `db.ts`/`email.ts`/`stripe.ts`/`validation.ts`/`rate-limit.ts`/`blog.ts`.

**Modelo Prisma** (`prisma/schema.prisma`, Prisma 7 + adapter-pg; URL inyectada en `prisma.config.ts`, no en el schema): público — `Lead` (con campos UTM), `Subscriber`, `Order`. Más **esquema CRM personal**: `Contact`, `Product`, `PipelineStage`, `Deal`, `DealItem`, `Activity`, `Task`, `Invoice`, `InvoiceItem` + enums (`ContactType`, `ContactStatus`, `ActivityType`, `TaskPriority`). 4 migraciones en `prisma/migrations/` (init, enable_rls, add_utm_to_lead, add_crm_schema).
</arquitectura>

<pendiente>
- **~30 marcadores `TODO:` en `src/lib/content/`** para datos no públicos: precios reales (`checkout.ts`: "verificar antes de cobrar"), métricas de proyectos (stars/usuarios), historial laboral previo (`about.ts`), testimonios reales (`testimonials.ts`) y `years` de cada tecnología en `stack.ts`. URL de LinkedIn pendiente.
- **CRM**: esquema Prisma definido y migrado, pero sin UI ni endpoints aún (inferido — no hay rutas `api/crm` ni vistas).
- Rutas `/escaparate` y `/proximamente` recientes — verificar si son placeholders.
- Credenciales reales de producción pendientes de fijar/migrar (ver overlay `.claude/CLAUDE.md`).
- `ROADMAP.md` es la fuente de verdad del avance: consúltalo antes de retomar y actualízalo en cada PR.
</pendiente>

<notas>
- `ARCHITECTURE.md` describe en parte el **árbol objetivo**, no el real. Donde diverja, **manda el código**: tema por `localStorage`/script (no cookie SSR), `lib/db`/`lib/validation` son ficheros planos (no carpetas), `emails/` en `src/emails/`, y `Lead` usa `type` (no `company`/`budget`).
- Existe un overlay `.claude/CLAUDE.md` que extiende `~/.claude/CLAUDE.md` (canon L0) y difiere a este fichero raíz como CLAUDE.md rico; no duplicar contenido allí.
- Seed original ("Alejandro Vargas") archivado en rama `base-seed-snapshot`. El panel de _Tweaks_ del prototipo se descartó en producción.
- Variables de entorno en `.env.local` (nunca versionar `.env*` con valores reales; plantilla en `.env.example`): `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_TO_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL`.
- **Deploy**: integración Git nativa de **Vercel** (push a `main` → producción; ramas/PR → preview). El workflow `deploy.yml` por CLI se eliminó (redundante, fallaba en `vercel pull`). La CI sigue siendo la fuente de verdad de calidad; Vercel despliega por su cuenta.
- Editar contenido en `src/lib/content/` y posts en `content/blog/`. Detalle de tests en `tests/README.md`.
</notas>

<!-- stripe-projects-cli managed:claude-md:start -->

look at AGENTS.md for your rules

<!-- stripe-projects-cli managed:claude-md:end -->
