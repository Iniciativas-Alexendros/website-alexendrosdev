import "server-only";
import { buildAuditorSystemPrompt } from "@/lib/agents/prompts";
import { chatCompletionStructured, type LLMResponse } from "@/lib/agents/llm-provider";
import { crmReader, type CrmDeal } from "@/lib/agents/crm-reader";
import { eventClassificationSchema, type EventClassification } from "@/lib/agents/schemas";

// ─── Agente Auditor ──────────────────────────────────────────────────────────
//
// Responsabilidades:
// 1. Clasificar eventos de Stripe (LLM o reglas deterministas).
// 2. Detectar anomalías: ≥3 fallos de checkout en 5 min → critical.
// 3. Auditar deals estancados: deals sin cambio de stage en >7 días → warning.
// 4. Generar alertas (logs estructurados + email vía Resend si está activo).
//
// Degradación sin LLM: clasificación basada en reglas simples sobre el payload
// del evento (tipo de Stripe event + monto + estado). Sin CRM: skip auditoría
// de deals, solo clasificación de eventos.

// ─── Estado interno: ventana deslizante de fallos ────────────────────────────

const ANOMALY_WINDOW_MS = 5 * 60 * 1000; // 5 min
const ANOMALY_THRESHOLD = 3; // ≥3 fallos → critical
const STALLED_DAYS = 7;

interface FailureEntry {
  timestamp: number;
  eventId?: string;
}

/** ⚠️ Vercel serverless: esta ventana es por instancia de función.
 *  No detecta anomalías cross-instance. Suficiente como best-effort.
 *  TODO S2: migrar a Upstash Redis para detección distribuida. */
let recentFailures: FailureEntry[] = [];

function recordFailure(eventId?: string): void {
  const now = Date.now();
  recentFailures.push({ timestamp: now, eventId });
  recentFailures = recentFailures.filter((f) => now - f.timestamp < ANOMALY_WINDOW_MS);
}

function failuresInWindow(): FailureEntry[] {
  const now = Date.now();
  recentFailures = recentFailures.filter((f) => now - f.timestamp < ANOMALY_WINDOW_MS);
  return recentFailures;
}

export interface AuditReport {
  generatedAt: string;
  classification?: EventClassification;
  anomalies: {
    type: "checkout_failures" | "stalled_deals";
    severity: "warning" | "critical";
    message: string;
    details?: Record<string, unknown>;
  }[];
  stalledDeals: { id: string; title: string; daysSinceUpdate: number }[];
  alertsSent: number;
  mode: "llm" | "deterministic" | "hybrid";
}

export interface StripeEvent {
  id?: string;
  type: string;
  data?: {
    object?: {
      amount?: number;
      currency?: string;
      metadata?: Record<string, string>;
      last_payment_error?: { message?: string };
      customer?: string;
      subscription?: string;
    };
  };
  created?: number;
}

// ─── Clasificación de eventos ──────────────────────────────────────────────

export async function classifyStripeEvent(event: StripeEvent): Promise<{
  classification: EventClassification;
  mode: "llm" | "deterministic";
}> {
  // Sin LLM: clasificación por reglas
  if (!process.env.GEMINI_API_KEY && !process.env.OPENCODE_ZEN_API_KEY) {
    return {
      classification: deterministicClassify(event),
      mode: "deterministic",
    };
  }

  // LLM
  try {
    const description =
      `Tipo: ${event.type}\nID: ${event.id ?? "—"}\n` +
      (event.data?.object?.amount != null
        ? `Monto: ${event.data.object.amount / 100} ${event.data.object.currency ?? "EUR"}\n`
        : "") +
      (event.data?.object?.last_payment_error?.message
        ? `Error: ${event.data.object.last_payment_error.message}\n`
        : "");
    const system = await buildAuditorSystemPrompt();
    const { content } = await chatCompletionStructured(
      [
        { role: "system", content: system },
        { role: "user", content: description },
      ],
      eventClassificationSchema,
    );
    return { classification: content, mode: "llm" };
  } catch {
    // Fallback a determinista si el LLM falla
    return {
      classification: deterministicClassify(event),
      mode: "deterministic",
    };
  }
}

function deterministicClassify(event: StripeEvent): EventClassification {
  const t = event.type;
  const error = event.data?.object?.last_payment_error?.message;
  if (t === "checkout.session.completed" || t === "payment_intent.succeeded") {
    return {
      type: "payment_success",
      severity: "info",
      summary: `Pago exitoso (${event.id ?? "sin id"}).`,
      requiresAction: false,
    };
  }
  if (t === "payment_intent.payment_failed" || t === "checkout.session.expired") {
    return {
      type: "payment_failed",
      severity: "critical",
      summary: `Pago fallido: ${error ?? "razón desconocida"}.`,
      requiresAction: true,
    };
  }
  if (t === "customer.subscription.created") {
    return {
      type: "subscription_created",
      severity: "info",
      summary: "Nueva suscripción creada.",
      requiresAction: false,
    };
  }
  if (t === "customer.subscription.updated") {
    return {
      type: "subscription_updated",
      severity: "info",
      summary: "Suscripción actualizada.",
      requiresAction: false,
    };
  }
  if (t === "customer.subscription.deleted") {
    return {
      type: "subscription_cancelled",
      severity: "warning",
      summary: "Suscripción cancelada.",
      requiresAction: true,
    };
  }
  return {
    type: "unknown",
    severity: "info",
    summary: `Evento no clasificado: ${t}.`,
    requiresAction: false,
  };
}

// ─── Detección de anomalías ─────────────────────────────────────────────────

export function recordAndCheckAnomaly(event: StripeEvent): {
  isAnomaly: boolean;
  failureCount: number;
} {
  const isFailure =
    event.type === "payment_intent.payment_failed" ||
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed";
  if (!isFailure) return { isAnomaly: false, failureCount: failuresInWindow().length };
  recordFailure(event.id);
  const count = failuresInWindow().length;
  return { isAnomaly: count >= ANOMALY_THRESHOLD, failureCount: count };
}

// ─── Auditoría de deals estancados ──────────────────────────────────────────

export async function findStalledDeals(
  fetchDeals: () => Promise<CrmDeal[] | null> = () => crmReader.listDeals(),
): Promise<{ id: string; title: string; daysSinceUpdate: number }[]> {
  const deals = await fetchDeals();
  if (!deals) return [];
  const now = Date.now();
  const stalled: { id: string; title: string; daysSinceUpdate: number }[] = [];
  for (const deal of deals) {
    const lastUpdate = deal.updatedAt ? new Date(deal.updatedAt).getTime() : null;
    if (!lastUpdate) continue;
    const days = Math.floor((now - lastUpdate) / (24 * 60 * 60 * 1000));
    if (days >= STALLED_DAYS) {
      stalled.push({ id: deal.id, title: deal.title, daysSinceUpdate: days });
    }
  }
  return stalled;
}

// ─── Audit completo (trigger por cron o manual) ─────────────────────────────

export async function runAudit(
  options: {
    fetchDeals?: () => Promise<CrmDeal[] | null>;
  } = {},
): Promise<AuditReport> {
  const anomalies: AuditReport["anomalies"] = [];
  const classification = undefined; // El audit completo no clasifica 1 evento

  // 1. Comprobar anomalía acumulada de fallos
  const failures = failuresInWindow();
  if (failures.length >= ANOMALY_THRESHOLD) {
    anomalies.push({
      type: "checkout_failures",
      severity: "critical",
      message: `${failures.length} fallos de checkout en los últimos 5 minutos.`,
      details: {
        count: failures.length,
        eventIds: failures.map((f) => f.eventId),
      },
    });
  }

  // 2. Buscar deals estancados
  const stalled = await findStalledDeals(options.fetchDeals);
  for (const d of stalled) {
    anomalies.push({
      type: "stalled_deals",
      severity: "warning",
      message: `Deal "${d.title}" estancado hace ${d.daysSinceUpdate} días.`,
      details: { dealId: d.id, daysSinceUpdate: d.daysSinceUpdate },
    });
  }

  // 3. Alertas — en esta implementación solo logs. El email vía Resend
  //    requiere `RESEND_API_KEY` y se implementará en S4 (alertas).
  const alertsSent = 0;

  return {
    generatedAt: new Date().toISOString(),
    classification,
    anomalies,
    stalledDeals: stalled,
    alertsSent,
    mode:
      process.env.GEMINI_API_KEY || process.env.OPENCODE_ZEN_API_KEY ? "hybrid" : "deterministic",
  };
}

// ─── Procesar un evento puntual (hooks) ─────────────────────────────────────

export async function processHookEvent(event: StripeEvent): Promise<{
  classification: EventClassification;
  mode: "llm" | "deterministic";
  isAnomaly: boolean;
  failureCount: number;
}> {
  const { classification, mode } = await classifyStripeEvent(event);
  const { isAnomaly, failureCount } = recordAndCheckAnomaly(event);
  return { classification, mode, isAnomaly, failureCount };
}

// ─── Wrapper LLM directo (desde index.ts o tests) ───────────────────────────
//
// Versión simplificada que clasifica un evento por descripción textual
// sin necesidad de un objeto StripeEvent completo. Usa el system prompt
// del Auditor pero con un inline directo.

export async function classifyEvent(
  eventDescription: string,
): Promise<LLMResponse<EventClassification>> {
  return chatCompletionStructured(
    [
      {
        role: "system",
        content:
          "Eres un clasificador de eventos de Stripe. Dado un evento, devuelve JSON con {type, severity, summary, requiresAction}.",
      },
      { role: "user", content: eventDescription },
    ],
    eventClassificationSchema,
  );
}

// Test helpers
export function _resetFailureWindow(): void {
  recentFailures = [];
}
