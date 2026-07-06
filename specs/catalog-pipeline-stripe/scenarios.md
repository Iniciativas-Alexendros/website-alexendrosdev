# Scenarios: catalog-pipeline-stripe

**Feature**: catalog-pipeline-stripe
**Repo**: website-alexendrosdev
**Fecha**: 2026-07-04

---

## Happy Paths

### HP1 — Compra one-time vía Stripe (sin cambios)

1. Cliente ve addon en `/servicios` o `/escaparate`.
2. Clica "Pagar ahora" → `POST /api/checkout { itemId: "sesion-consultoria" }`.
3. Servidor: `getCatalogItem` → `{ amount: 6_000, type: "one_time" }`.
   `stripe.checkout.sessions.create({ mode: "payment", line_items: [{ price_data: { unit_amount: 6_000 } }] })`.
4. Devuelve `{ url }` → cliente paga → webhook `checkout.session.completed`.
5. Persiste `Order`. Si metadata incluye `dealId`, avanza deal a "Cerrado ganado" (stage 5).

**Assert**: Order en DB con `amount=6000, status=paid`. Deal (si existe) en stage "Cerrado ganado".

### HP2 — Suscripción recurring mensual

1. Cliente ve tiers retainer en `/servicios` → "Pro (€1.290/mes, 30 h/mes)".
2. `POST /api/checkout { itemId: "retainer-pro", mode: "subscription" }`.
3. Servidor: `type: "recurring", interval: "month", amount: 129_000`.
   Sin `stripePriceId` → `price_data` + `recurring { interval: "month" }`.
4. Devuelve URL → cliente completa suscripción → webhook `checkout.session.completed`
   → `Subscription` creada con `status: "active"`.
5. Cada mes: `invoice.paid` → Invoice CRM marcada `paid`, Activity NOTE registrada.

**Assert**: Subscription activa. Invoice CRM pagada mensualmente. Sin intervención manual.

### HP3 — Transferencia bancaria

1. Cliente en `/escaparate` → `PurchaseCard` → toggle "Transferencia".
2. Rellena email + name → `POST /api/checkout { itemId: "puesta-a-punto-web", paymentMethod: "transfer", email, name }`.
3. Servidor: crea `Invoice` proforma (`status: "pending_transfer"`, `number: "INV-2026-NNN"`).
   Devuelve `{ iban, beneficiary, reference, amount, concept, invoiceId }`.
4. UI muestra instrucciones de transferencia.
5. (Manual) Operador recibe transferencia → `PATCH /api/crm/invoices/:id { status: "paid" }`.

**Assert**: Invoice con `status: "pending_transfer"`. Respuesta con datos bancarios completos.

### HP4 — Fallback a Payment Link

1. `POST /api/checkout` → `stripe.checkout.sessions.create` lanza timeout.
2. Servidor captura → intenta `stripe.paymentLinks.create`.
3. Éxito → `{ url: "https://buy.stripe.com/...", fallback: true }`.
4. Cliente paga → webhook `checkout.session.completed` (mismo flujo HP1).

**Assert**: Respuesta 200 con `url` y `fallback: true`. Webhook procesa igual.

### HP5 — Pipeline Deal completo (9 stages)

1. Lead captado vía formulario `/contacto` → `Contact` creado en CRM.
2. Operador crea Deal: `POST /api/crm/deals { title, contactId }` → stage "Nuevo" (0).
3. Primer contacto → `PATCH` a "Contactado" (1) → Activity registrada.
4. Discovery call realizada → `PATCH` a "Discovery call" (2) → Activity registrada.
5. Propuesta enviada → `PATCH` a "Propuesta" (3) → Activity registrada.
6. Negociación → `PATCH` a "Negociación" (4) → Activity registrada.
7. Cliente acepta → `POST /api/checkout { itemId: "retainer-pro", ..., metadata: { dealId } }`.
   (El servidor pasa `dealId` al metadata de la sesión Stripe).
8. Cliente paga → webhook `checkout.session.completed`:
   - Extrae `dealId` de `session.metadata`.
   - `PATCH` implícito: stage → "Cerrado ganado" (5), `closedAt = now`, `probability = 100`.
   - Activity: "Pago recibido. Deal cerrado ganado automáticamente."
9. Kick-off → `PATCH` a "Onboarding" (6).
10. Desarrollo → `PATCH` a "En progreso" (7) con iteraciones y demos.
11. Entrega final → `PATCH` a "Entregado" (8) → documentación y soporte post-lanzamiento.

**Assert**: 11 transiciones de stage con Activity cada una. Auto-cierre en stage 5 al pagar.

### HP6 — Auditor IA detecta deals estancados

1. Cron 15 min → `POST /audit/deals { staleThresholdDays: 7 }`.
2. Agente llama `GET /api/crm/deals` con `CRM_API_KEY`.
3. Filtra deals con `updatedAt > 7d` y stage no final (≠ 5, 8, 9).
4. Detecta 2 deals: uno en "Propuesta" (3) hace 14 días, otro en "Negociación" (4) hace 10 días.
5. Ollama clasifica → Anthropic redacta email → Resend envía alerta al operador.
6. Log: `audit_20260704_001: 2 stale deals, alert sent`.

**Assert**: `POST /audit/deals` devuelve deals estancados con recomendaciones. Email enviado.

### HP7 — Diagnosticador + Reparador ante error de persistencia

1. Webhook Stripe recibe `checkout.session.completed`.
2. Intenta `prisma.order.upsert` → `PrismaClientKnownRequestError: Connection refused`.
3. Webhook devuelve 500 (Stripe reintentará).
4. Simultáneamente, el webhook hace `POST http://localhost:8400/diagnose` con error.
5. Diagnosticador:
   - Clasifica con Ollama: `"database_connection_error"`.
   - Usa Anthropic para razonar: "Connection refused sugiere pool agotado o Supabase caído."
   - Devuelve hipótesis con confianza 0.78, acción recomendada: `"monitor"`.
6. Tras 3er reintento fallido (30 min después):
   - Diagnosticador recomienda `"retry_with_direct_connection"` (confianza 0.91).
   - Reparador ejecuta `POST /repair { action: "retry_persistence", params: { sessionId, event } }`.
7. Reparador reintenta `prisma.order.upsert` directamente → éxito.
   - Devuelve `{ success: true, result: { orderPersisted: true, orderId: "..." } }`.
   - Envía email al operador: "Incidencia resuelta automáticamente."

**Assert**: Diagnosticador devuelve hipótesis fundadas. Reparador ejecuta y devuelve resultado.

---

## Edge Cases

### EC1 — Ítem recurring sin `stripePriceId`

Usa `price_data` + `recurring`. Test T2.2.

### EC2 — Transferencia sin email/name

`checkoutSchema.refine` bloquea → 422. Test T3.2.

### EC3 — Webhook `invoice.paid` sin Deal asociado

Actualiza Invoice, crea Activity genérica. No error. No transiciona Deal.

### EC4 — Suscripción cancelada desde Stripe Customer Portal

Webhook `customer.subscription.deleted` → `Subscription.cancelled`,
Task HIGH: "Contactar por cancelación de suscripción". Deal no cambia de stage.

### EC5 — Rate-limit CRM por API key

61 requests misma key → último 429 + `Retry-After: 60`.

### EC6 — CRM API sin `CRM_API_KEY`

`requireCrmAuth` → 503 inmediato. Sitio sigue funcionando (solo CRM inaccesible).

### EC7 — Transición de stage inválida

`PATCH` de "Nuevo" (0) a "En progreso" (7) → 422 `{ error: "Transición no permitida." }`.
Solo se permite lineal (0→1, 1→2, ...) o a "Cerrado perdido" (9) desde stage ≥3.

### EC8 — Deal en "Cerrado ganado" o "Entregado" no puede moverse

Stages 5 y 8 son terminales. `PATCH` → 422 `{ error: "Stage terminal. No se puede modificar." }`.
"Cerrado perdido" (9) también terminal.

### EC9 — Item one_time con mode=subscription

Servidor fuerza `mode: "payment"`. Loguea warning. No 422.

### EC10 — Agente sin Ollama

Usa cloud API para clasificación. Misma funcionalidad, mayor coste.

### EC11 — Agente Reparador sin acceso DB

Usa `POST /api/crm/invoices` con `CRM_API_KEY`. Si CRM API caída →
`{ success: false, error: "CRM API unavailable" }` → escala a notificación operador.

### EC12 — Webhook con evento desconocido

200 `{ received: true }`. Warn único por tipo nuevo. No spam.

### EC13 — `POST /api/crm/deals` con `contactId` inexistente

422 `{ error: "Contacto no encontrado.", fields: { contactId: "..." } }`.

---

## Errores esperados

| Código | Condición                                        | Body                                                         |
| ------ | ------------------------------------------------ | ------------------------------------------------------------ |
| 400    | Cuerpo no JSON / falta `stripe-signature`        | `{ error: "..." }`                                           |
| 400    | Firma webhook inválida                           | `{ error: "Firma inválida." }`                               |
| 401    | CRM: sin `X-API-Key` o clave inválida            | `{ error: "No autorizado." }`                                |
| 422    | Zod validation / item no existe / stage inválido | `{ error, fields }`                                          |
| 422    | Transferencia sin email/name                     | `{ error, fields: { email: "..." } }`                        |
| 422    | Transición stage no permitida                    | `{ error: "Transición no permitida.", fields: { stageId } }` |
| 429    | Rate-limit superado                              | `{ error: "Demasiadas solicitudes." }`                       |
| 502    | Stripe API falla (session + payment link)        | `{ error, fallbackAttempted: true }`                         |
| 503    | Sin Stripe / sin DB / sin CRM_API_KEY            | `{ error }` o `{ method: "transfer", ... }`                  |
| 500    | DB persistencia falla en webhook                 | `{ error: "No se pudo registrar el pedido." }`               |

---

## Diagrama de flujo: Checkout con fallback

```
POST /api/checkout { itemId, mode?, paymentMethod? }
│
├─ Zod ──► 422
├─ Rate-limit ──► 429
├─ getCatalogItem ──► null ──► 422
│
├─ paymentMethod = "transfer"
│   ├─ email/name? ──► no ──► 422
│   ├─ prisma? ──► no ──► 503
│   └─ Crea Invoice ──► 200 { iban, reference, ... }
│
└─ paymentMethod = "stripe" (default)
    ├─ !stripe ──► 503 ──► ¿TRANSFER_IBAN configurado? ──► sí → datos transfer
    │                                                   ──► no → { error }
    ├─ stripe.checkout.sessions.create()
    │   ├─ success ──► 200 { url }
    │   └─ error ──► intenta stripe.paymentLinks.create()
    │       ├─ success ──► 200 { url, fallback: true }
    │       └─ error ──► 502 { error, fallbackAttempted: true }
    └─ !session.url ──► 502
```

---

## Pipeline: diagrama de stages y transiciones válidas

```
[Nuevo:0] ─► [Contactado:1] ─► [Discovery call:2] ─► [Propuesta:3]
                                                          │
                             ┌────────────────────────────┤
                             ▼                            ▼
                    [Negociación:4]              [Cerrado perdido:9] ◄── terminal
                             │
                             ▼
                    [Cerrado ganado:5] ◄── también activado por webhook pago
                             │
                             ▼
                    [Onboarding:6]
                             │
                             ▼
                    [En progreso:7]
                             │
                             ▼
                    [Entregado:8] ◄── terminal

Leyenda:
─► transición forward permitida (lineal)
▸  ramal permitido desde stage ≥3
◄── stage terminal (no admite más transiciones)
```

---

## Flujo de datos: Deal → Stripe metadata → webhook → cierre automático

```
POST /api/crm/deals { title, contactId }
  └─► Deal creado en stage "Nuevo" (0)

POST /api/checkout { itemId, ..., metadata: { dealId } }
  └─► stripe.checkout.sessions.create({ metadata: { dealId } })
      └─► URL Stripe contiene dealId embebido en la sesión

Cliente paga ─► Stripe emite checkout.session.completed
  └─► webhook POST /api/stripe/webhook
      └─► extrae dealId de session.metadata
      └─► prisma.deal.update({ stageId: "Cerrado ganado" (5), closedAt, probability: 100 })
      └─► prisma.activity.create({ type: NOTE, title: "Pago recibido. Deal cerrado automáticamente." })
      └─► 200
```
