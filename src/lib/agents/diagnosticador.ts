import "server-only";
import { buildDiagnosticadorSystemPrompt } from "@/lib/agents/prompts";
import { chatCompletionStructured, LLMError, type LLMResponse } from "@/lib/agents/llm-provider";
import { crmReader, type CrmContact, type CrmDeal, type CrmInvoice } from "@/lib/agents/crm-reader";
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

// ─── Reglas heurísticas ─────────────────────────────────────────────────────

interface HeuristicRule {
  match: (text: string) => boolean;
  cause: string;
  confidence: number;
  evidence: string[];
  suggestedAction: string;
}

const HEURISTIC_RULES: HeuristicRule[] = [
  {
    match: (t) => t.includes("timeout") || t.includes("econnrefused"),
    cause: "Timeout o error de red al llamar a una API externa (DB, Stripe, CRM).",
    confidence: 0.7,
    evidence: ["keyword 'timeout' o 'econnrefused' en el contexto"],
    suggestedAction: "Verificar conectividad con el servicio afectado. Reintentar operación.",
  },
  {
    match: (t) => t.includes("429") || t.includes("rate limit") || t.includes("too many"),
    cause: "Rate limit excedido (429) en el servicio externo.",
    confidence: 0.85,
    evidence: ["keyword 'rate limit' o '429' en el contexto"],
    suggestedAction: "Esperar 1-5 min. Implementar backoff exponencial si es recurrente.",
  },
  {
    match: (t) => t.includes("500") || t.includes("internal server error") || t.includes("503"),
    cause: "Error 5xx en el servicio upstream (DB caída, Stripe down, etc.).",
    confidence: 0.75,
    evidence: ["keyword 5xx en el contexto"],
    suggestedAction: "Comprobar status page del servicio. Reintentar con backoff.",
  },
  {
    match: (t) => t.includes("prisma") || t.includes("database") || t.includes("postgres"),
    cause: "DB no responde o conexión caída.",
    confidence: 0.9,
    evidence: ["keyword 'prisma'/'database'/'postgres' en el contexto"],
    suggestedAction: "Verificar conexión Supabase. Comprobar logs del container.",
  },
  {
    match: (t) => t.includes("stripe") && (t.includes("fail") || t.includes("error")),
    cause: "Stripe Checkout falló (red, API, o validación).",
    confidence: 0.7,
    evidence: ["keyword 'stripe' + 'fail/error' en el contexto"],
    suggestedAction: "Comprobar Stripe Dashboard. Regenerar Payment Link si aplica.",
  },
  {
    match: (t) => t.includes("validation") || t.includes("invalid") || t.includes("422"),
    cause: "Datos de entrada no cumplen el schema (Zod validation failed).",
    confidence: 0.95,
    evidence: ["keyword 'validation'/'invalid'/'422' en el contexto"],
    suggestedAction: "Revisar payload enviado vs schema. Comprobar cambios en el cliente.",
  },
];

// ─── Heurísticas deterministas ──────────────────────────────────────────────

function heuristicDiagnose(
  request: AgentDiagnoseRequest,
  crmContext: CrmContextData,
): DiagnosticResult {
  const text = `${request.context} ${request.error ?? ""}`.toLowerCase();

  const hypotheses: DiagnosticResult["hypotheses"] = HEURISTIC_RULES.filter((rule) =>
    rule.match(text),
  ).map((rule) => ({
    cause: rule.cause,
    confidence: rule.confidence,
    evidence: rule.evidence,
    suggestedAction: rule.suggestedAction,
  }));

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
  const fetchDeal = options.fetchDeal ?? ((id: string) => crmReader.getDeal(id));
  const fetchContact = options.fetchContact ?? ((id: string) => crmReader.getContact(id));
  const fetchInvoices =
    options.fetchInvoices ?? ((dealId: string) => crmReader.listInvoicesForDeal(dealId));

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

// ─── Wrapper LLM directo (desde index.ts o tests) ───────────────────────────
//
// Versión simplificada que diagnostica un texto de contexto sin necesidad
// de un objeto AgentDiagnoseRequest completo.

export async function diagnose(contextText: string): Promise<LLMResponse<DiagnosticResult>> {
  return chatCompletionStructured(
    [
      {
        role: "system",
        content:
          "Eres un diagnosticador de incidencias en un pipeline comercial. " +
          "Dado un contexto, formula hipótesis de causa con confianza 0-1 y " +
          "evidencia. Devuelve JSON con {diagnosis, hypotheses: [{cause, confidence, evidence, suggestedAction}], context}.",
      },
      { role: "user", content: contextText },
    ],
    diagnosticResultSchema,
  );
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
