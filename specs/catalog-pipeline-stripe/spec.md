# Spec: Catálogo + Pipeline Comercial Stripe + Fallback + Agentes IA

**Feature**: `catalog-pipeline-stripe`
**Estado**: planificación
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-04
**Modelo orquestador**: ninguno fijo. El sistema recomendará dinámicamente un modelo del catálogo de proveedores/modelos disponibles al inicio de cada sesión. El operador puede aceptarlo, cambiarlo o forzar uno concreto vía UI.

## Objetivo

Transformar el portfolio profesional en una plataforma comercial completa:

1. Catálogo tipado unificado de productos/servicios/actividades con precios server-trusted
   y coherentes con el ancla publicada (~€40-45/h).
2. Pipeline de venta vía Stripe — one-time payments + recurring subscriptions.
3. Canal secundario de cobro para fallback: transferencia bancaria + Stripe Payment Links.
4. CRM expuesto vía API REST con pipeline de stages realista para freelancing
   DevOps/FullStack (9 stages).
5. Agentes IA autónomos (servicio externo Python/FastAPI) que monitorean, diagnostican,
   alertan y autorreparan incidencias del pipeline comercial.

## Requerimientos funcionales

### RF1 — Catálogo unificado

- El catálogo (`src/lib/content/catalog.ts`) es la **única fuente de verdad**
  de productos, servicios, tiers y addons. Precios verificados y sin TODOs.
- Cada item: `id`, `name`, `desc`, `amount` (céntimos), `currency`, `type`
  (`one_time` | `recurring`), `interval` (recurring), `stripePriceId` (opcional),
  `active`, `category`.
- `services.ts` deriva `HOME_SERVICES`, `TIERS`, `ADDONS` del catálogo.
  `checkout.ts` se depreca; `PURCHASABLES` se reexporta desde catálogo para
  compatibilidad hacia atrás.
- **Precios verificados y publicados** (sin TODOs):

  | ID                   | Tipo      | Precio (€) | Horas estimadas | Ancla €/h |
  | -------------------- | --------- | ---------- | --------------- | --------- |
  | `puesta-a-punto-web` | one_time  | 390        | ~9h             | ~43       |
  | `sesion-consultoria` | one_time  | 60         | 1h              | 60        |
  | `revision-seguridad` | one_time  | 600        | ~14h            | ~43       |
  | `retainer-starter`   | recurring | 690/mes    | 15 h/mes        | 46        |
  | `retainer-pro`       | recurring | 1.290/mes  | 30 h/mes        | 43        |
  | `retainer-scale`     | recurring | 1.990/mes  | 50 h/mes        | ~40       |

  Las horas se ajustan para cuadrar con el ancla publicada (€40-45/h) y los
  precios ya visibles en el sitio. Los tiers "proyecto" (€1.200/€2.900/€5.900+)
  no son comprables directos vía Stripe (requieren discovery call previa), pero
  sí figuran en el catálogo como referencia.

- **El servidor nunca confía en precios del cliente.** Solo recibe `itemId`.

### RF2 — Checkout unificado

- `POST /api/checkout` acepta `itemId`, `mode` (`"payment"` | `"subscription"`),
  y `paymentMethod` (`"stripe"` | `"transfer"`).
- Compatibilidad hacia atrás: campo legacy `{ item }` mapeado a `itemId`.
- `mode: "subscription"`: si el item tiene `stripePriceId` usa `price`, si no usa
  `price_data` + `recurring { interval, interval_count }`.
- Si el cliente envía `mode: "subscription"` para item `one_time`, el servidor
  fuerza `mode: "payment"` y loguea warning (no error 422, UX friendly).

### RF3 — Webhook ampliado

| Evento                          | Acción                                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `checkout.session.completed`    | Upsert Order (one_time) o crear Subscription (recurring). Si metadata incluye `dealId`, avanza deal a "Cerrado ganado". |
| `invoice.paid`                  | Crea/actualiza Invoice CRM (`stripeInvoiceId`), Activity NOTE                                                           |
| `customer.subscription.updated` | Actualiza Subscription status                                                                                           |
| `customer.subscription.deleted` | Marca `cancelled`, crea Task HIGH: "Contactar por cancelación de suscripción"                                           |

- Upsert idempotente. 500 si falla DB (Stripe reintenta). 200 si falta DB (degradación).

### RF4 — Canal secundario

#### 4a — Transferencia bancaria

- `paymentMethod: "transfer"` → valida `email` + `name` requeridos.
- Crea Invoice proforma (`status: "pending_transfer"`, número `INV-YYYY-NNN`).
- Devuelve `{ iban, beneficiary, reference, amount, currency, concept, invoiceId }`.
- Confirmación manual vía `PATCH /api/crm/invoices/:id { status: "paid" }`.

#### 4b — Stripe Payment Links (fallback automático)

- Si `stripe.checkout.sessions.create` falla, intenta `stripe.paymentLinks.create`.
- Éxito → `{ url, fallback: true }`. Falla → 502 `{ error, fallbackAttempted: true }`.
- Sin Stripe: 503, pero si hay `TRANSFER_IBAN` configurado devuelve datos transferencia.

### RF5 — CRM API

Endpoints bajo `src/app/api/crm/` con auth `X-API-Key: <CRM_API_KEY>`:

| Método | Ruta                       | Acción                              |
| ------ | -------------------------- | ----------------------------------- |
| GET    | `/api/crm/contacts`        | Listar (`?status=`, `?search=`)     |
| POST   | `/api/crm/contacts`        | Crear                               |
| GET    | `/api/crm/deals`           | Listar (`?stageId=`, `?contactId=`) |
| POST   | `/api/crm/deals`           | Crear (asigna primer stage)         |
| PATCH  | `/api/crm/deals/[id]`      | Actualizar stage/probability        |
| GET    | `/api/crm/pipeline-stages` | Listar stages                       |
| GET    | `/api/crm/products`        | Listar                              |
| POST   | `/api/crm/products`        | Crear                               |
| GET    | `/api/crm/invoices`        | Listar (`?dealId=`, `?status=`)     |
| POST   | `/api/crm/invoices`        | Crear con items                     |
| PATCH  | `/api/crm/invoices/[id]`   | Actualizar status                   |
| GET    | `/api/crm/activities`      | Listar (`?dealId=`)                 |

- Zod validation, rate-limit 60 req/min por API key.
- Sin `CRM_API_KEY` → 503. Sin `prisma` → 503.

### RF6 — Pipeline de ventas (9 stages, freelancing realista)

Stages seedeados vía migración Prisma:

| Orden | Stage           | Descripción                                            | Color   |
| ----- | --------------- | ------------------------------------------------------ | ------- |
| 0     | Nuevo           | Lead captado (formulario, email, referencia)           | #6b7280 |
| 1     | Contactado      | Primer contacto realizado (email/llamada)              | #3b82f6 |
| 2     | Discovery call  | Llamada de descubrimiento: entender problema real      | #8b5cf6 |
| 3     | Propuesta       | Propuesta técnica/económica enviada                    | #f59e0b |
| 4     | Negociación     | Ajustando alcance, precio o condiciones                | #f97316 |
| 5     | Cerrado ganado  | Contrato firmado o primer pago recibido                | #10b981 |
| 6     | Onboarding      | Kick-off, acceso a repos, herramientas configuradas    | #06b6d4 |
| 7     | En progreso     | Desarrollo activo, iteraciones, demos                  | #3b82f6 |
| 8     | Entregado       | Entrega final, documentación, soporte post-lanzamiento | #84cc16 |
| 9     | Cerrado perdido | Oportunidad perdida (ramal de salida desde cualquier   | #ef4444 |
|       |                 | punto tras "Propuesta")                                |         |

**Reglas de pipeline:**

- Deal nuevo → asignado a "Nuevo" (order 0).
- Transición lineal permitida (0→1, 1→2, ...). Saltos bloqueados.
- "Cerrado perdido" accesible desde stage 3+ (propuesta enviada o posterior).
- Webhook `checkout.session.completed` con `dealId` en metadata → avanza a "Cerrado ganado".
- Cancelación suscripción → Task follow-up (no cambia stage del deal).

### RF7 — Agentes IA autónomos

Servicio Python/FastAPI en `/home/alexendros/repositorios/personal/agentes-ia-catalog/`.

| Agente         | Disparador                         | Acción                                                                                                                                 |
| -------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auditor        | Cron 15 min + POST `/hooks/stripe` | Clasifica eventos, detecta anomalías (≥3 fallos/5min), audita deals estancados (>7d sin cambio de stage), envía alertas email (Resend) |
| Diagnosticador | POST `/diagnose`                   | Formula hipótesis con confianza: DB caída, Stripe API down, rate-limit, red                                                            |
| Reparador      | POST `/repair`                     | Ejecuta acción: reintentar persistencia vía CRM API, regenerar Payment Link, notificar operador                                        |

**Modelos híbrido:** Ollama local `ornith:9b` para clasificación; Anthropic API para
razonamiento diagnóstico y redacción de alertas. Degradación sin Ollama → cloud para
todo. Sin cloud → solo logs.

## Criterios de aceptación

| ID   | Criterio                                                  |
| ---- | --------------------------------------------------------- |
| AC1  | `POST /api/checkout` con `mode: subscription` crea sesión |
| AC2  | Webhook maneja `invoice.paid` y persiste Invoice          |
| AC3  | Webhook maneja `customer.subscription.updated/deleted`    |
| AC4  | `paymentMethod: transfer` devuelve IBAN + crea Invoice    |
| AC5  | Transferencia sin email → 422                             |
| AC6  | Checkout fallido → Payment Link fallback                  |
| AC7  | CRM API: CRUD contacts, deals, invoices con auth          |
| AC8  | Sin API key → 401                                         |
| AC9  | Rate-limit → 429                                          |
| AC10 | Deal nuevo → stage "Nuevo" automático                     |
| AC11 | Pago deal → auto-avance a "Cerrado ganado"                |
| AC12 | Cancelación suscripción → Task follow-up                  |
| AC13 | Auditor detecta ≥3 fallos checkout en 5 min               |
| AC14 | Diagnosticador formula hipótesis ante error               |
| AC15 | Reparador ejecuta y devuelve resultado                    |
| AC16 | Health agente IA → 200                                    |
| AC17 | Sin Ollama → degrada a cloud                              |
| AC18 | Cobertura ≥85% statements                                 |
| AC19 | Lint 0 errors                                             |
| AC20 | Typecheck 0 errors                                        |
| AC21 | Build verde                                               |
| AC22 | `{ item }` legacy compatible                              |
| AC23 | No breaking en `/api/stripe/webhook`                      |

## Restricciones

- Next.js 16.2.6, TS estricto, React 19, pnpm 11.5.2.
- Degradación null-safe (prisma/stripe/resend pueden ser `null`).
- Precios en céntimos, server-trusted, verificados (no TODOs).
- No breaking changes en rutas existentes.
- Agentes IA en servicio Python externo (no mismo proceso Next.js).

## No-objetivos

- UI administrativa CRM (la API basta para agentes y scripts).
- Customer Portal Stripe (feature separada).
- Webhook bancario automático (requiere API bancaria).
- FacturaE/SII. Solo Invoice CRM interno.
- Dashboard métricas (feature separada).

---

## Orquestación con el modelo recomendado por el sistema

### Instrucciones para el modelo orquestador

El modelo que el sistema recomiende al inicio de la sesión actúa como
**orquestador principal** de esta feature. Características deseables:

- **Contexto largo**: 1M tokens → puede cargar los 4 artifacts + ARCHITECTURE.md + ROADMAP.md
  - CLAUDE.md + schema.prisma en una sola sesión.
- **Optimizado para**: agentes, coding, multimodality. Ideal para descomponer tareas
  y delegar a subagentes especializados.
- **Prompt caching**: disponible en CommandCode ($0.06/M vs $0.30/M). Los artifacts
  de spec se benefician de cacheo al ser estáticos durante toda la ejecución.
- **Taste-1**: el modelo adapta sus ediciones al estilo del codebase (TypeScript
  estricto, patrones null-safe, zod, Vitest).

### Plan de ejecución orquestada (DAG de dependencias)

```
FASE 11 ─────────────────────────────────────────────────────────────┐
│ Catálogo unificado (catalog.ts, refactor services.ts/checkout.ts)   │
│ Dependencias: ninguna                                               │
│ Tests: T1.1–T1.10 (unit)                                           │
│ Criterio salida: 10 tests green, typecheck OK                       │
│ Worktree: wt/catalog-pipeline-stripe-f11                            │
└────────────────────────────┬───────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
FASE 12 ─────────────────────  FASE 14 ─────────────────────────────┐
│ Checkout unified              │ CRM API + webhook ampliado          │
│ (subscription mode)           │ (migraciones, 10+ handlers)         │
│ Dependencia: F11              │ Dependencia: schema Prisma (existe) │
│ Tests: T2.1–T2.16             │            + F11 (catálogo)         │
│ Salida: 16 tests green        │ Tests: T4.1–T4.41 (41 tests)       │
│ Worktree: wt/catalog-         │ Salida: 41 tests green,             │
│           pipeline-str-f12    │         migraciones aplicadas       │
│                               │ Worktree: wt/catalog-               │
│                               │           pipeline-str-f14          │
└──────────────┬────────────────┴──────────────┬────────────────────┘
               │                               │
               ▼                               │
FASE 13 ─────────────────────                  │
│ Canal secundario                              │
│ (transferencia + Payment Link)                │
│ Dependencia: F12                              │
│ Tests: T3.1–T3.14                             │
│ Salida: 14 tests green                        │
│ Worktree: wt/catalog-pipeline-str-f13         │
└──────────────┬────────────────────────────────┘
               │
               ▼
FASE 15 ─────────────────────────────────────────────────────────────┐
│ Agentes IA (repo separado, servicio Python)                         │
│ Dependencia: F14 (CRM API funcional)                                │
│ Tests: T5.1–T5.10 (pytest)                                         │
│ Salida: 10 tests green, GET /health → 200                           │
│ Nota: NO worktree (repo independiente)                              │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
FASE 16 ─────────────────────────────────────────────────────────────┐
│ E2E + Gates finales                                                 │
│ Dependencia: F12, F13, F14, F15                                     │
│ Tests: T6.1–T6.16 (e2e + coverage + lint + typecheck + build)      │
│ Salida: todos los gates green, ROADMAP.md actualizado               │
│ Worktree: wt/catalog-pipeline-str-f16 (merge final)                 │
└────────────────────────────────────────────────────────────────────┘
```

### Reglas de orquestación para el modelo recomendado

1. **Worktrees paralelos**: F12 y F14 se ejecutan en worktrees independientes
   porque no comparten archivos críticos. El agente `worktree` gestiona la
   creación, sincronización y merge.

2. **Gate por fase**: cada fase tiene un criterio de salida explícito (tests green).
   No se avanza a la siguiente fase sin verificar. Si un test falla, el agente
   `debug` diagnostica antes de reintentar.

3. **Delegación por especialidad**:
   - F11–F14: `explore` (lectura inicial) → `general` (implementación) →
     `review` (auditoría del diff) → merge.
   - F15 (Python): ejecución directa (no hay subagente Python; lo ejecuta el
     orquestador o el usuario con `uv run pytest`).
   - F16: `perf-optimizer` para a11y/Lighthouse + `review` para diff final.

4. **Presupuesto de tokens**: los 4 artifacts (~1200 líneas) consumen ~15k tokens
   de entrada (cacheables). ARCHITECTURE.md + ROADMAP.md + CLAUDE.md ~8k tokens.
   schema.prisma ~3k tokens. Total contexto base: ~26k tokens. Sobra >970k para
   ejecución de fases. **Mantener mensajes concisos**: cada instrucción de fase
   ≤500 palabras.

5. **Lock-in progresivo**: tras cada fase mergeada a `main`, el gate de cobertura
   se ajusta en `vitest.config.ts` para reflejar la nueva baseline. Así ningún
   PR futuro puede romper lo construido.

6. **Anti-regresión**: antes de mergear cualquier fase, ejecutar `pnpm test:coverage`
   - `pnpm lint` + `pnpm typecheck`. Si algún valorador falla, bloquear merge.

7. **Prompt de arranque** para el modelo recomendado (a usar en cada sesión de orquestación):

```
Cargá spec.md, contract.md, scenarios.md y test-plan.md de
specs/catalog-pipeline-stripe/. Vas a orquestar la fase [N] según el DAG
de dependencias. Antes de empezar:
- Verificá que las dependencias de la fase estén completadas (fases previas
  mergeadas a main, tests green).
- Si la fase requiere worktree, usá el agente `worktree` para crearlo desde
  main con nombre wt/catalog-pipeline-str-f[N].
- Ejecutá los tests de la fase según test-plan.md → deben fallar (RED).
- Implementá el código mínimo → deben pasar (GREEN).
- Refactorizá manteniendo GREEN.
- Pasá `pnpm lint && pnpm typecheck && pnpm build`.
- Si todo verde, mergeá a main y actualizá ROADMAP.md.
- Reportá: tests ejecutados, cobertura, diff resumen, siguiente fase.
```
