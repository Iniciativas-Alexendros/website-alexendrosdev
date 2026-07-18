# P1 — Profesionalización & Comercialización

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el sitio de portfolio técnico a página profesional comercializable: página legal GDPR, proyectos señalados como "a consultar", testimonios reales, flujo de newsletter operativo, contenido editorial, y coherencia de precios en toda la UI.

**Architecture:** Se añaden páginas estáticas (SSG), se modifican componentes existentes para reflejar el estado `active` del catálogo, se activan flujos diferidos (Resend), y se produce contenido editorial. Todo changes son aditivos o de toggle — no se reescribe nada existente.

**Tech Stack:** Next.js 16 (App Router), Prisma/Supabase, Resend (+ React Email), Stripe Checkout, Tailwind CSS v4, zod

---

## Global Constraints

- `active: false` en `catalog.ts` para proyectos (ya hecho) — checkout ya bloquea compra directa (ver `checkout/route.ts:56-64`)
- `RESEND_API_KEY` requiere acción del operador (no se puede hardcodear). El plan marca tareas que dependen de ella como `[bloqueado por operador]`
- Todos los cambios deben pasar: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- Los componentes de UI nuevos deben seguir el sistema de tokens Arctic Ocean (`design-tokens.css`, clases `ak-*`)
- Los textos nuevos van en español de España con tildes
- Sin nuevas dependencias npm sin justificar

---

### Task 1: Página `/privacidad` (GDPR) + enlace en footer

**Files:**

- Create: `src/app/privacidad/page.tsx`
- Create: `content/legal/privacidad.mdx` (o contenido inline en page.tsx)
- Modify: `src/components/layout/Footer.tsx` (añadir enlace)

**Interfaces:**

- Consumes: tokens de diseño (`design-tokens.css`, clases `ak-*`)
- Produces: ruta `/privacidad` con contenido GDPR completo; enlace en footer

- [ ] **Step 1: Crear la página de privacidad**

```tsx
// src/app/privacidad/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Alexendros",
  description:
    "Política de privacidad y protección de datos de alexendros.dev. Información sobre recogida, tratamiento y derechos según el RGPD.",
};

export default function PrivacidadPage() {
  return (
    <div className="ak-container">
      <section className="ak-page-head">
        <h1 className="ak-page-title">Política de Privacidad</h1>
        <p className="ak-page-lead">
          Última actualización: julio de 2026. Esta política explica qué datos personales recoge
          alexendros.dev, por qué los recoge y qué derechos tienes sobre ellos, de acuerdo con el
          Reglamento General de Protección de Datos (RGPD) de la Unión Europea.
        </p>
      </section>

      <section className="ak-section" style={{ paddingTop: 0 }}>
        <div className="legal-content" style={{ maxWidth: "720px" }}>
          <h2>1. Responsable del tratamiento</h2>
          <p>
            Alexendros (Alex Endros) — Valencia, España.
            <br />
            Contacto: <a href="mailto:hola@alexendros.dev">hola@alexendros.dev</a>
          </p>

          <h2>2. Datos que recogemos</h2>
          <ul>
            <li>
              <strong>Formulario de contacto:</strong> nombre, email, teléfono (opcional), empresa
              (opcional) y mensaje.
            </li>
            <li>
              <strong>Newsletter:</strong> email y nombre (opcional).
            </li>
            <li>
              <strong>Checkout:</strong> email, nombre y dirección de facturación (gestionado por
              Stripe — no almacenamos datos de pago).
            </li>
            <li>
              <strong>Analítica:</strong> datos de uso anónimos y agregados vía Vercel Analytics
              (sin cookies, sin tracking cross-site).
            </li>
          </ul>

          <h2>3. Finalidad y base legal</h2>
          <ul>
            <li>
              <strong>Ejecución de un contrato:</strong> gestionar pagos, entregar servicios y
              facturar.
            </li>
            <li>
              <strong>Consentimiento:</strong> enviar comunicaciones comerciales (newsletter) y
              gestionar consultas de contacto.
            </li>
            <li>
              <strong>Interés legítimo:</strong> mejorar el sitio mediante analítica anónima.
            </li>
          </ul>

          {/* ... más secciones: conservación, derechos ARCO, 
              cesión a terceros (Stripe, Vercel, Resend), seguridad */}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Añadir enlace en el Footer**

Localizar `src/components/layout/Footer.tsx`. Añadir en la columna de enlaces:

```tsx
<Link href="/privacidad" className="ak-footer-lk">
  Política de Privacidad
</Link>
```

También añadir enlace a `Aviso Legal` si procede (contenido: datos del responsable, propiedad intelectual).

- [ ] **Step 3: Verificar que la ruta compila y el enlace funciona**

Run: `pnpm build` → debe incluir `/privacidad` en las 33+ rutas
Run: `pnpm test` → tests existentes no deben romperse

- [ ] **Step 4: Commit**

```bash
git add src/app/privacidad/page.tsx src/components/layout/Footer.tsx
git commit -m "feat: add GDPR privacy policy page + footer link"
```

---

### Task 2: Proyectos "a consultar" en UI — señalizar que no son comprables directos

**Files:**

- Modify: `src/components/services/TierCard.tsx`
- Modify: `src/components/sections/services/ServicesView.tsx`
- Modify: `src/lib/content/services.ts`
- Read: `src/lib/content/catalog.ts` (ya tiene `active: false` en proyectos)

**Interfaces:**

- Consumes: `CatalogItem.active` flag del catálogo unificado
- Produces: UI que muestra "a consultar" / "presupuesto personalizado" para items con `active: false`

- [ ] **Step 1: Leer el componente TierCard actual**

```bash
cat src/components/services/TierCard.tsx
```

Identificar dónde se muestra el precio y la CTA de compra.

- [ ] **Step 2: Modificar TierCard para aceptar prop `active`**

```tsx
// Añadir prop:
interface TierCardProps {
  name: string;
  price: string;
  unit: string;
  feats: [string, boolean][];
  pro?: boolean;
  active?: boolean; // nuevo — si false, muestra "a consultar"
  cta?: string; // nuevo — texto del botón CTA
  onCtaClick?: () => void;
}
```

Cuando `active === false`:

- Mostrar badge naranja "A consultar" en lugar del precio
- Botón CTA cambia a "Pedir presupuesto" → redirige a `/contacto`
- El tier se renderiza igual, solo cambia el CTA

- [ ] **Step 3: Actualizar ServicesView para pasar `active` desde catálogo**

En `ServicesView.tsx`, obtener el item del catálogo por id:

```typescript
import { getCatalogItem } from "@/lib/content/catalog";
// ...
const catalogItem = getCatalogItem(itemId);
const active = catalogItem?.active ?? true;
```

Pasar `active` a cada `TierCard`.

- [ ] **Step 4: Añadir constante `HOME_SERVICES_CTA` en `services.ts`**

Para la sección de Home (ak-srv-list), añadir un flag `action`:

```typescript
// HOME_SERVICES pasa a incluir action:
export const HOME_SERVICES: HomeService[] = [
  // ...
  { name: "Landing de 1 página", sub: "...", price: "desde €600", action: "contact" },
  { name: "Webs y aplicaciones a medida", sub: "...", price: "desde €1.200", action: "contact" },
  { name: "Automatización...", sub: "...", price: "a consultar", action: "contact" },
  // items comprables:
  { name: "Revisión de seguridad", sub: "...", price: "desde €600", action: "checkout" },
];
```

- [ ] **Step 5: Verificar**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: 0 errors, tests verdes
Assert: `checkout/route.ts` ya bloquea items con `active: false` (línea 56-64)

- [ ] **Step 6: Commit**

```bash
git add src/components/services/TierCard.tsx src/components/sections/services/ServicesView.tsx src/lib/content/services.ts
git commit -m "feat: mark non-purchasable projects as 'a consultar' in UI"
```

---

### Task 3: Testimonios reales y prueba social

**Files:**

- Modify: `src/lib/content/testimonials.ts`
- Read: `src/components/sections/home/Testimonials.tsx` (o donde se renderice)

**Interfaces:**

- Consumes: `Testimonial[]` con entradas `kind: "client"`, `kind: "work"`, `kind: "solicitado"`
- Produces: testimonios reales donde sea posible, ranuras limpias

- [ ] **Step 1: Revisar testimonials actuales**

`testimonials.ts` ya tiene 2 entradas `work` (propias) y 3 ranuras `solicitado` con `__PENDIENTE__`.

- [ ] **Step 2: Contactar/solicitar 1-2 testimonios reales** [acción operador]

El operador debe obtener al menos 1 declaración de cliente real. Mientras tanto:

- [ ] **Step 3: Preparar ranuras limpias**

```typescript
export const TESTIMONIALS: Testimonial[] = [
  // Trabajo propio verificable
  { kind: "work", quote: "...", name: "alexendros.me", ... },
  { kind: "work", quote: "...", name: "Este portfolio", ... },

  // Ranuras listas — cuando el operador reciba texto, sustituir inline
  // El filtro en Testimonials.tsx debe SEGUIR ocultando kind="solicitado"
  // o simplemente no renderizar entradas con quote que empiece por "__"
];
```

- [ ] **Step 4: Verificar que Testimonials.tsx filtra ranuras vacías**

Buscar en el componente de Testimonials el filtro actual. Asegurar que:

```typescript
// Si no existe, añadir:
const visible = TESTIMONIALS.filter(
  (t) => !t.quote.startsWith("__") && (t.kind === "client" || t.kind === "work"),
);
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/testimonials.ts
git commit -m "chore: prepare testimonial slots for real client quotes"
```

---

### Task 4: Activar Resend (emails transaccionales)

**Files:**

- Read: `.env.example`
- Modify: (ninguno — es configuración de entorno)
- Verify: `src/lib/email.ts`

**Interfaces:**

- Consumes: `RESEND_API_KEY` del operador
- Produces: emails transaccionales reales (notificaciones lead, bienvenida, confirmación newsletter)

- [ ] **Step 1: Verificar que el código de email es null-safe**

```bash
cat src/lib/email.ts
```

Confirmar que `resend` se exporta como `null` si falta `RESEND_API_KEY` (ya debe ser así).

- [ ] **Step 2: Operador — introducir `RESEND_API_KEY` en entorno de producción**

El operador debe:

1. Obtener API key del dashboard de Resend
2. Añadirla en Vercel Project Settings → Environment Variables
3. Añadirla en `.env.local` para desarrollo local

- [ ] **Step 3: Verificar envío en producción**

Hacer un lead de prueba desde el formulario de contacto en producción. Verificar que llega el email de notificación.

---

### Task 5: Contenido editorial — 2 posts del calendario

**Files:**

- Create: `content/blog/que-preguntar-discovery-call.mdx`
- Create: `content/blog/plantilla-revision-seguridad-web.mdx`
- Modify: `src/lib/content/posts.ts`

**Interfaces:**

- Consumes: `content/blog/editorial-calendar.md` (temas definidos)
- Produces: 2 nuevos posts MDX publicados en `/blog`

- [ ] **Step 1: Escribir "Qué preguntar en una discovery call"**

`content/blog/que-preguntar-discovery-call.mdx`:

```
---
id: que-preguntar-discovery-call
title: Qué preguntar (y qué esperar) en una discovery call
date: 2026-08-01
read: 7 min
tag: Clientes
desc: La discovery call es el primer paso de cualquier proyecto digital. Te cuento qué preguntar, qué esperar y cómo sacarle el máximo partido a esa primera conversación.
metaDescription: Guía práctica sobre discovery calls para proyectos digitales: qué preguntar al desarrollador, qué información preparar y cómo funciona el proceso.
---
```

- [ ] **Step 2: Registrar post en `posts.ts`**

Añadir entrada en `src/lib/content/posts.ts`:

```typescript
{
  id: "que-preguntar-discovery-call",
  title: "Qué preguntar (y qué esperar) en una discovery call",
  date: "2026-08-01",
  read: "7 min",
  tag: "Clientes",
  desc: "...",
  metaDescription: "...",
}
```

- [ ] **Step 3: Escribir "Plantilla de revisión de seguridad web"**

`content/blog/plantilla-revision-seguridad-web.mdx`:

```
---
id: plantilla-revision-seguridad-web
title: Plantilla de revisión de seguridad web: qué revisar y en qué orden
date: 2026-09-01
read: 10 min
tag: Calidad
desc: Checklist profesional de seguridad web que uso en mis auditorías. HTTPS, CSP, dependencias, autenticación, cabeceras y más — ordenado por criticidad.
metaDescription: Checklist de seguridad web profesional. Revisión ordenada por criticidad: HTTPS, CSP, dependencias, auth, cabeceras de seguridad y OWASP Top 10.
---
```

- [ ] **Step 4: Verificar**

Run: `pnpm build` → debe incluir 2 nuevas rutas `/blog/que-preguntar-discovery-call` y `/blog/plantilla-revision-seguridad-web`
Run: `pnpm test` → tests de posts deben pasar

- [ ] **Step 5: Commit**

```bash
git add content/blog/que-preguntar-discovery-call.mdx content/blog/plantilla-revision-seguridad-web.mdx src/lib/content/posts.ts
git commit -m "feat: add 2 blog posts — discovery call guide + security checklist"
```

---

### Task 6: Newsletter send endpoint (ya existe — verificar funcionamiento)

**Files:**

- Read: `src/app/api/newsletter/send/route.ts` (ya implementado con `requireCrmAuth`)
- Verify: tests `tests/integration/newsletter-send.test.ts`

- [ ] **Step 1: Verificar tests de envío**

Run: `pnpm test --run tests/integration/newsletter-send.test.ts`
Expected: 6 tests green (dry-run, auth, envío)

- [ ] **Step 2: Operador — configurar dominio en Resend**

Para que los emails de newsletter se entreguen, el operador debe verificar el dominio `alexendros.dev` en Resend (DNS records SPF/DKIM/DMARC).

---

### Task 7: Sincronizar documentación (ROADMAP, AGENTS, ARCHITECTURE)

**Files:**

- Modify: `ROADMAP.md`
- Modify: `AGENTS.md`
- Read: `ARCHITECTURE.md`

- [ ] **Step 1: Actualizar ROADMAP.md con estado real**

Marcar como `hecho`:

- F15 — Agentes IA: código hecho, no operativo sin LLM keys
- F16 — Gates: cobertura thresholds cumplidos (85/70/88/85)
- F17 — Monitorización parcial: solo `/api/health`

Actualizar tabla de reestructuración P0→P4 con estado actual.

- [ ] **Step 2: Commit**

```bash
git add ROADMAP.md AGENTS.md
git commit -m "docs: sync roadmap and AGENTS.md with current state"
```

---

### Task 8: Resolver "Landing desde €600" sin item en catálogo

**Files:**

- Modify: `src/lib/content/catalog.ts` (añadir item faltante si procede)
- Modify: `src/lib/content/services.ts`

- [ ] **Step 1: Decidir si "Landing desde €600" debe ser comprable**

Análisis: `HOME_SERVICES[0]` muestra "Landing desde €600" pero no hay item en el catálogo con ese precio. Hay dos opciones:

- A) Añadir item `landing-page` en catálogo con `active: false` (a consultar)
- B) Cambiar el texto a "desde €1.200" que sí existe como proyecto-starter

**Recomendación: opción A** — añadir item orientativo, no comprable directo.

- [ ] **Step 2: Si se elige A, añadir a catalog.ts**

```typescript
{
  id: 'landing-page',
  name: 'Landing de 1 página',
  desc: 'Una página bien hecha para presentar tu negocio o producto.',
  amount: 60_000,
  currency: 'eur',
  type: 'one_time',
  stripePriceIds: { test: null, live: null },
  active: false,
  category: 'proyecto',
  metadata: { hoursEstimate: '~14 h', anchorRate: '~43 €/h' },
}
```

---

## Criterios de aceptación

- `pnpm lint` → 0 errors en `src/`
- `pnpm typecheck` → 0 errors
- `pnpm test` → 386+ tests verdes
- `pnpm build` → 34+ rutas (incluye `/privacidad`, 2 nuevos posts de blog)
- `/privacidad` accesible desde footer y formularios
- Proyectos en UI muestran "a consultar" en lugar de CTA de compra
- Testimonios sin ranuras `__PENDIENTE__` visibles
- `RESEND_API_KEY` configurada en Vercel (acción operador)
- `ROADMAP.md` refleja estado real

## Fuera de alcance

- Monitorización (P2) — plan separado
- Agentes IA autónomos (P3) — congelado
- Gates de CI avanzados (P4) — plan separado
- Stripe Payment Links como canal principal (ya existe como fallback)
