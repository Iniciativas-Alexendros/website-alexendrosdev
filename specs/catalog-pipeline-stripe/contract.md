# Contract: catalog-pipeline-stripe

**Feature**: catalog-pipeline-stripe
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-04

---

## 1. Catálogo unificado — `src/lib/content/catalog.ts`

```ts
export type CatalogItemType = "one_time" | "recurring";
export type CatalogCategory = "servicio" | "addon" | "retainer" | "consultoria" | "proyecto";

export interface CatalogItem {
  id: string;
  name: string;
  desc: string;
  amount: number; // céntimos. one_time: total. recurring: por intervalo.
  currency: string; // "eur"
  type: CatalogItemType;
  interval?: "month" | "year";
  stripePriceId?: string;
  active: boolean;
  category: CatalogCategory;
  metadata?: Record<string, string>; // ej. { hoursEstimate: "15 h/mes" }
}

export const CATALOG: CatalogItem[];

export function getCatalogItem(id: string): CatalogItem | null;
export function getCatalogItemsByType(type: CatalogItemType): CatalogItem[];
export function getCatalogItemsByCategory(category: CatalogCategory): CatalogItem[];
```

### Datos del catálogo (precios verificados, sin TODOs)

```ts
// ─── Addons (one_time, comprables directos) ──────────────────────
{ id: "puesta-a-punto-web", name: "Puesta a punto de tu web",
  desc: "Reviso tu web actual (velocidad, posicionamiento en Google y errores) y te entrego un informe claro con las mejoras priorizadas.",
  amount: 39_000, currency: "eur", type: "one_time",
  active: true, category: "addon",
  metadata: { hoursEstimate: "~9 h", anchorRate: "~43 €/h" } },

{ id: "sesion-consultoria", name: "Sesión de consultoría (1 h)",
  desc: "Hablamos de tu proyecto y te ayudo a decidir cómo abordar tu web, tu aplicación o una automatización. Sin compromiso.",
  amount: 6_000, currency: "eur", type: "one_time",
  active: true, category: "consultoria",
  metadata: { hoursEstimate: "1 h", anchorRate: "60 €/h" } },

{ id: "revision-seguridad", name: "Revisión de seguridad",
  desc: "Reviso tu web o tu sistema y te explico, en cristiano, qué conviene mejorar para estar tranquilo. Solo reviso: no toco nada sin tu visto bueno.",
  amount: 60_000, currency: "eur", type: "one_time",
  active: true, category: "addon",
  metadata: { hoursEstimate: "~14 h", anchorRate: "~43 €/h" } },

// ─── Retainers (recurring mensual) ───────────────────────────────
{ id: "retainer-starter", name: "Retainer Starter",
  desc: "15 h/mes: mantenimiento, monitorización y corrección de errores.",
  amount: 69_000, currency: "eur", type: "recurring",
  interval: "month", active: true, category: "retainer",
  metadata: { hoursEstimate: "15 h/mes", anchorRate: "46 €/h" } },

{ id: "retainer-pro", name: "Retainer Pro",
  desc: "30 h/mes: funcionalidades nuevas, revisiones de código e informe semanal.",
  amount: 129_000, currency: "eur", type: "recurring",
  interval: "month", active: true, category: "retainer",
  metadata: { hoursEstimate: "30 h/mes", anchorRate: "43 €/h" } },

{ id: "retainer-scale", name: "Retainer Scale",
  desc: "50 h/mes (media jornada): hoja de ruta conjunta, arquitectura documentada y SLA.",
  amount: 199_000, currency: "eur", type: "recurring",
  interval: "month", active: true, category: "retainer",
  metadata: { hoursEstimate: "50 h/mes", anchorRate: "~40 €/h" } },

// ─── Proyectos (one_time, referencia — no comprables directos) ───
{ id: "proyecto-starter", name: "Proyecto Starter",
  desc: "Sitio web o herramienta acotada, hasta 5 páginas.",
  amount: 120_000, currency: "eur", type: "one_time",
  active: true, category: "proyecto",
  metadata: { hoursEstimate: "~30 h", anchorRate: "~40 €/h" } },

{ id: "proyecto-pro", name: "Proyecto Pro",
  desc: "Aplicación o plataforma completa con backend, acceso de usuarios y pruebas automáticas.",
  amount: 290_000, currency: "eur", type: "one_time",
  active: true, category: "proyecto",
  metadata: { hoursEstimate: "~72 h", anchorRate: "~40 €/h" } },

{ id: "proyecto-scale", name: "Proyecto Scale",
  desc: "Arquitectura a medida, seguridad, monitorización y hoja de ruta conjunta.",
  amount: 590_000, currency: "eur", type: "one_time",
  active: true, category: "proyecto",
  metadata: { hoursEstimate: "~147 h+", anchorRate: "~40 €/h" } },
```

### Compatibilidad hacia atrás

```ts
// src/lib/content/checkout.ts (deprecado, reexporta)
export { getCatalogItem as getPurchasable } from "./catalog";
import { getCatalogItemsByCategory } from "./catalog";
export const PURCHASABLES = [
  ...getCatalogItemsByCategory("addon"),
  ...getCatalogItemsByCategory("consultoria"),
];
// ^ mismo array que antes, mismo orden. Los componentes que importan
// PURCHASABLES no se rompen.
```

---

## 2. API: Checkout

### `POST /api/checkout`

**Request (nuevo formato):**

```jsonc
{
  "itemId": "sesion-consultoria", // requerido (o "item" legacy)
  "mode": "payment", // opcional. default: derivado del catálogo
  "paymentMethod": "stripe", // opcional. default: "stripe"
  "email": "cliente@ejemplo.dev", // requerido si paymentMethod=transfer
  "name": "Nombre Cliente", // requerido si paymentMethod=transfer
}
```

**Response 200 (stripe):** `{ url: "https://checkout.stripe.com/..." }`
**Response 200 (payment link fallback):** `{ url: "https://buy.stripe.com/...", fallback: true }`
**Response 200 (transferencia):**

```jsonc
{
  "method": "transfer",
  "iban": "ES00 0000 0000 00 0000000000",
  "beneficiary": "Alejandro Domingo Agustí",
  "reference": "INV-2026-0042",
  "amount": 6000,
  "currency": "eur",
  "concept": "Sesión de consultoría (1 h)",
  "invoiceId": "uuid-factura",
}
```

**Errores:** 400 (cuerpo inválido), 422 (validación/item), 429 (rate-limit),
502 (Stripe API caída), 503 (sin Stripe/sin DB).

### Zod schema (ampliado)

```ts
export const checkoutSchema = z
  .object({
    itemId: z.string().trim().min(1).max(80).optional(),
    item: z.string().trim().min(1).max(80).optional(), // legacy
    mode: z.enum(["payment", "subscription"]).optional(),
    paymentMethod: z.enum(["stripe", "transfer"]).optional(),
    email: z.string().email().max(200).optional(),
    name: z.string().trim().max(120).optional(),
  })
  .refine((d) => !!(d.itemId || d.item), {
    message: "Falta el item.",
    path: ["itemId"],
  })
  .refine((d) => d.paymentMethod !== "transfer" || (!!d.email && !!d.name), {
    message: "Email y nombre requeridos para transferencia.",
    path: ["email"],
  });
```

---

## 3. API: CRM

Base: `/api/crm`. Auth: `X-API-Key: <CRM_API_KEY>`. Rate-limit: 60 req/min.

### Endpoints

- `GET/POST /api/crm/contacts`
- `GET/POST /api/crm/deals` + `PATCH /api/crm/deals/[id]`
- `GET /api/crm/pipeline-stages`
- `GET/POST /api/crm/products`
- `GET/POST /api/crm/invoices` + `PATCH /api/crm/invoices/[id]`
- `GET /api/crm/activities`

### Schemas Zod

```ts
// Contact
export const crmContactSchema = z.object({
  type: z.enum(["INDIVIDUAL", "COMPANY"]).optional(),
  firstName: z.string().trim().min(1, "Indica el nombre.").max(120),
  lastName: z.string().trim().max(120).optional(),
  email: z.string().email("Email no válido.").max(200).optional(),
  phone: z.string().trim().max(30).optional(),
  company: z.string().trim().max(200).optional(),
  position: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
});

// Deal
export const crmDealSchema = z.object({
  title: z.string().trim().min(1, "Indica el título.").max(200),
  contactId: z.string().uuid("ID de contacto inválido."),
  value: z.number().int().min(0).optional(),
  currency: z.string().max(3).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid("ID de producto inválido.").optional(),
        quantity: z.number().int().min(1).default(1),
        unitPrice: z.number().int().min(0).optional(),
        notes: z.string().trim().max(500).optional(),
      }),
    )
    .optional(),
});

// Deal PATCH
export const crmDealPatchSchema = z.object({
  stageId: z.string().uuid().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
  closedAt: z.string().datetime().optional(),
});

// Product
export const crmProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  unitPrice: z.number().min(0),
  currency: z.string().max(3).optional(),
  active: z.boolean().optional(),
});

// Invoice
export const crmInvoiceSchema = z
  .object({
    contactId: z.string().uuid("ID de contacto inválido.").optional(),
    dealId: z.string().uuid("ID de deal inválido.").optional(),
    notes: z.string().trim().max(2000).optional(),
    taxRate: z.number().min(0).max(1).optional(),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1, "Descripción requerida.").max(500),
          quantity: z.number().int().min(1),
          unitPrice: z.number().min(0),
          productId: z.string().uuid().optional(),
        }),
      )
      .min(1, "Al menos un item requerido."),
  })
  .refine((d) => !!(d.contactId || d.dealId), {
    message: "Se requiere contactId o dealId.",
    path: ["contactId"],
  });

// Invoice PATCH
export const crmInvoicePatchSchema = z.object({
  status: z.enum(["sent", "paid", "cancelled"]),
  paidAt: z.string().datetime().optional(),
});
```

---

## 4. API: Webhook (sin cambios en firma)

Mismos 4 eventos: `checkout.session.completed`, `invoice.paid`,
`customer.subscription.updated`, `customer.subscription.deleted`.

---

## 5. Pipeline stages — 9 stages realistas

### Migración `20260704000001_seed_pipeline_stages`

```sql
INSERT INTO "PipelineStage" ("id", "name", "description", "order", "color") VALUES
  (gen_random_uuid(), 'Nuevo',              'Lead captado: formulario web, email, referencia.',            0, '#6b7280'),
  (gen_random_uuid(), 'Contactado',         'Primer contacto realizado (email o llamada).',                 1, '#3b82f6'),
  (gen_random_uuid(), 'Discovery call',     'Llamada de descubrimiento para entender el problema real.',    2, '#8b5cf6'),
  (gen_random_uuid(), 'Propuesta',          'Propuesta técnica y económica enviada al cliente.',            3, '#f59e0b'),
  (gen_random_uuid(), 'Negociación',        'Ajustando alcance, precio o condiciones con el cliente.',      4, '#f97316'),
  (gen_random_uuid(), 'Cerrado ganado',     'Contrato firmado o primer pago recibido.',                     5, '#10b981'),
  (gen_random_uuid(), 'Onboarding',         'Kick-off: acceso a repos, herramientas, expectativas.',       6, '#06b6d4'),
  (gen_random_uuid(), 'En progreso',        'Desarrollo activo: iteraciones, demos, feedback.',             7, '#3b82f6'),
  (gen_random_uuid(), 'Entregado',          'Entrega final, documentación y soporte post-lanzamiento.',    8, '#84cc16'),
  (gen_random_uuid(), 'Cerrado perdido',    'Oportunidad perdida. Admite ramal desde stage 3+.',            9, '#ef4444');
```

Reglas de transición:

- Lineal forward: 0→1, 1→2, 2→3, 3→4, 4→5, 5→6, 6→7, 7→8.
- "Cerrado perdido" (9) accesible desde 3+ (propuesta enviada en adelante).
- No se permite saltar stages ni retroceder (salvo a "Cerrado perdido").
- `PATCH /api/crm/deals/:id { stageId }` valida transición → 422 si inválida.

---

## 6. Agentes IA — API

Servicio en `localhost:8400`.

| Método | Ruta            | Request                            | Response                                           |
| ------ | --------------- | ---------------------------------- | -------------------------------------------------- |
| GET    | `/health`       | —                                  | `{ status, agents, ollama, cloud_api }`            |
| POST   | `/hooks/stripe` | `{ event: Stripe.Event }`          | `{ classification, severity, escalate, analysis }` |
| POST   | `/diagnose`     | `{ errorType, context }`           | `{ diagnosisId, hypotheses[], recommendedAction }` |
| POST   | `/repair`       | `{ action, params, diagnosisId? }` | `{ success, result }`                              |
| POST   | `/audit/deals`  | `{ staleThresholdDays }`           | `{ staleDeals[], totalStale, alertsSent }`         |

---

## 7. Variables de entorno (nuevas)

```bash
# CRM API
CRM_API_KEY=
# Transferencias
TRANSFER_IBAN=
TRANSFER_BENEFICIARY=
TRANSFER_BANK=
# Agentes IA
AGENTS_IA_URL=http://localhost:8400
```

---

## 8. Migraciones Prisma

1. `20260704000000_add_subscription` — tabla Subscription.
2. `20260704000001_seed_pipeline_stages` — 9 stages (ver arriba).
3. `20260704000002_add_stripe_ids_invoice` — columna `stripeInvoiceId` en Invoice.

---

## 9. Nuevos archivos de código

| Archivo                                    | Tipo   | Contenido                               |
| ------------------------------------------ | ------ | --------------------------------------- |
| `src/lib/content/catalog.ts`               | CREATE | Catálogo unificado + helpers            |
| `src/lib/crm-auth.ts`                      | CREATE | Middleware auth `X-API-Key`             |
| `src/lib/crm/pipeline.ts`                  | CREATE | Lógica: transiciones válidas, nextStage |
| `src/lib/crm/invoice-number.ts`            | CREATE | Generador `INV-YYYY-NNN` secuencial     |
| `src/app/api/crm/contacts/route.ts`        | CREATE | GET + POST                              |
| `src/app/api/crm/deals/route.ts`           | CREATE | GET + POST                              |
| `src/app/api/crm/deals/[id]/route.ts`      | CREATE | PATCH                                   |
| `src/app/api/crm/pipeline-stages/route.ts` | CREATE | GET                                     |
| `src/app/api/crm/products/route.ts`        | CREATE | GET + POST                              |
| `src/app/api/crm/invoices/route.ts`        | CREATE | GET + POST                              |
| `src/app/api/crm/invoices/[id]/route.ts`   | CREATE | PATCH                                   |
| `src/app/api/crm/activities/route.ts`      | CREATE | GET                                     |

Archivos editados: `services.ts`, `checkout.ts` (deprecar), `types.ts`, `index.ts`,
`validation.ts`, `checkout/route.ts`, `stripe/webhook/route.ts`, `stripe.ts`,
`PurchaseCard.tsx`, `ServicesView.tsx`, `EscaparateView.tsx`, `schema.prisma`,
`.env.example`, `vitest.config.ts`, `ROADMAP.md`, `ARCHITECTURE.md`, `CLAUDE.md`.

---

## 10. Dependencias

**Next.js**: ninguna nueva. Todo con `zod`, `stripe`, `@prisma/client` existentes.

**Python (agentes)**: `fastapi`, `uvicorn`, `httpx`, `openai`, `anthropic`, `ollama`,
`resend`, `pytest`, `pytest-asyncio`. Gestor: `uv`.
