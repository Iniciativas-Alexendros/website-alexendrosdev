import "server-only";
import { buildDiagnosticadorSystemPrompt } from "@/lib/agents/prompts";
import { chatCompletionStructured, LLMError } from "@/lib/agents/llm-provider";
import { crmClient, type CrmContact, type CrmDeal, type CrmInvoice } from "@/lib/agents/crm-client";
import {
  diagnosticResultSchema,
  type DiagnosticResult,
  type AgentDiagnoseRequest,
} from "@/lib/agents/schemas";
import { hasAnyLLM } from "@/lib/agents/config";

// ─── Agente Diagnosticador ──────────────────────────────────────────────────
//
// Recibe una incidencia reportada y formula hipótesis de causa con confianza
// 0.0-1.0. Enriquece el contexto con datos del CRM si tiene dealId/contactId.
// Si hay LLM, lo usa para generar las hipótesis. Si no, usa heurísticas
// basadas en keywords del error/contexto.

export interface DiagnoseOptions {
  // Inyectable para tests. Si no, usa crmClient (necesita CRM_API_KEY).
  fetchDeal?: (id: string) => Promise<CrmDeal | null>;
  fetchContact?: (id: string) => Promise<CrmContact | null>;
  fetchInvoices?: (dealId: string) => Promise<CrmInvoice[] | null>;
}

export async function runDiagnosticador(
  request: AgentDiagnoseRequest,
  options: DiagnoseOptions = {},
): Promise<{ result: DiagnosticResult; mode: "llm" | "deterministic" }> {
  // 1. Recopilar contexto del CRM si hay dealId/contactId
  const crmContext = await gatherCrmContext(request, options);

  // 2. Sin LLM: heurísticas deterministas
  if (!hasAnyLLM()) {
    return {
      result: heuristicDiagnose(request, crmContext),
      mode: "deterministic",
    };
  }

  // 3. Con LLM
  try {
    const system = await buildDiagnosticadorSystemPrompt();
    const userContent = formatRequestForLlm(request, crmContext);
    const { content } = await chatCompletionStructured(
      [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      diagnosticResultSchema,
    );
    // Merge crm context si el LLM no lo rellenó
    return {
      result: {
        ...content,
        context: { ...crmContext, ...(content.context ?? {}) },
      },
      mode: "llm",
    };
  } catch (err) {
    if (err instanceof LLMError) {
      // Degradación a heurística si LLM falla
      return {
        result: heuristicDiagnose(request, crmContext),
        mode: "deterministic",
      };
    }
    throw err;
  }
}

// ─── Heurísticas deterministas ──────────────────────────────────────────────

function heuristicDiagnose(
  request: AgentDiagnoseRequest,
  crmContext: CrmContextData,
): DiagnosticResult {
  const text = `${request.context} ${request.error ?? ""}`.toLowerCase();
  const hypotheses: DiagnosticResult["hypotheses"] = [];

  if (text.includes("timeout") || text.includes("econnrefused")) {
    hypotheses.push({
      cause: "Timeout o error de red al llamar a una API externa (DB, Stripe, CRM).",
      confidence: 0.7,
      evidence: ["keyword 'timeout' o 'econnrefused' en el contexto"],
      suggestedAction: "Verificar conectividad con el servicio afectado. Reintentar operación.",
    });
  }
  if (text.includes("429") || text.includes("rate limit") || text.includes("too many")) {
    hypotheses.push({
      cause: "Rate limit excedido (429) en el servicio externo.",
      confidence: 0.85,
      evidence: ["keyword 'rate limit' o '429' en el contexto"],
      suggestedAction: "Esperar 1-5 min. Implementar backoff exponencial si es recurrente.",
    });
  }
  if (text.includes("500") || text.includes("internal server error") || text.includes("503")) {
    hypotheses.push({
      cause: "Error 5xx en el servicio upstream (DB caída, Stripe down, etc.).",
      confidence: 0.75,
      evidence: ["keyword 5xx en el contexto"],
      suggestedAction: "Comprobar status page del servicio. Reintentar con backoff.",
    });
  }
  if (text.includes("prisma") || text.includes("database") || text.includes("postgres")) {
    hypotheses.push({
      cause: "DB no responde o conexión caída.",
      confidence: 0.9,
      evidence: ["keyword 'prisma'/'database'/'postgres' en el contexto"],
      suggestedAction: "Verificar conexión Supabase. Comprobar logs del container.",
    });
  }
  if (text.includes("stripe") && (text.includes("fail") || text.includes("error"))) {
    hypotheses.push({
      cause: "Stripe Checkout falló (red, API, o validación).",
      confidence: 0.7,
      evidence: ["keyword 'stripe' + 'fail/error' en el contexto"],
      suggestedAction: "Comprobar Stripe Dashboard. Regenerar Payment Link si aplica.",
    });
  }
  if (text.includes("validation") || text.includes("invalid") || text.includes("422")) {
    hypotheses.push({
      cause: "Datos de entrada no cumplen el schema (Zod validation failed).",
      confidence: 0.95,
      evidence: ["keyword 'validation'/'invalid'/'422' en el contexto"],
      suggestedAction: "Revisar payload enviado vs schema. Comprobar cambios en el cliente.",
    });
  }

  // Si no hay hipótesis concretas, usar fallback genérico
  if (hypotheses.length === 0) {
    hypotheses.push({
      cause: "Causa no identificada por heurísticas. Revisar logs manualmente.",
      confidence: 0.3,
      evidence: ["Sin keywords reconocidas en el contexto"],
      suggestedAction: "Activar LLM o revisar logs del servidor manualmente.",
    });
  }

  return {
    diagnosis: `Análisis determinista de "${request.context.slice(0, 100)}"`,
    hypotheses,
    context: crmContext,
  };
}

// ─── CRM context gathering ──────────────────────────────────────────────────

interface CrmContextData {
  dealId?: string;
  contactId?: string;
  relevantInvoices?: string[];
  dealSummary?: string;
  contactSummary?: string;
}

async function gatherCrmContext(
  request: AgentDiagnoseRequest,
  options: DiagnoseOptions,
): Promise<CrmContextData> {
  const ctx: CrmContextData = {};
  const fetchDeal = options.fetchDeal ?? ((id: string) => crmClient.getDeal(id));
  const fetchContact = options.fetchContact ?? ((id: string) => crmClient.getContact(id));
  const fetchInvoices =
    options.fetchInvoices ?? ((dealId: string) => crmClient.listInvoicesForDeal(dealId));

  if (request.dealId) {
    ctx.dealId = request.dealId;
    const deal = await fetchDeal(request.dealId);
    if (deal) {
      ctx.dealSummary = `${deal.title} (${deal.currency} ${(deal.value / 100).toFixed(2)}, prob ${deal.probability}%)`;
    }
    const invoices = await fetchInvoices(request.dealId);
    if (invoices) {
      ctx.relevantInvoices = invoices.map((i) => i.number);
    }
  }
  if (request.contactId) {
    ctx.contactId = request.contactId;
    const contact = await fetchContact(request.contactId);
    if (contact) {
      ctx.contactSummary =
        `${contact.firstName ?? "?"} ${contact.lastName ?? ""}`.trim() +
        (contact.email ? ` <${contact.email}>` : "");
    }
  }
  return ctx;
}

function formatRequestForLlm(request: AgentDiagnoseRequest, crmContext: CrmContextData): string {
  const parts = [
    `Contexto: ${request.context}`,
    request.error ? `Error: ${request.error}` : null,
    crmContext.dealId ? `Deal: ${crmContext.dealId} - ${crmContext.dealSummary ?? "?"}` : null,
    crmContext.contactId
      ? `Contacto: ${crmContext.contactId} - ${crmContext.contactSummary ?? "?"}`
      : null,
    crmContext.relevantInvoices?.length
      ? `Invoices: ${crmContext.relevantInvoices.join(", ")}`
      : null,
  ].filter(Boolean);
  return parts.join("\n");
}
