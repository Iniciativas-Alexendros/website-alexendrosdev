// Punto de entrada de los agentes IA (F15).
// Los agentes se invocan desde los route handlers en src/app/api/agents/*
// o directamente desde otros módulos del servidor (ej. webhook de Stripe).

export { agentsConfig, hasGemini, hasOpenCodeZen, hasAnyLLM } from "@/lib/agents/config";
export {
  chatCompletion,
  chatCompletionStructured,
  classifyEvent,
  diagnose,
  planRepair,
  LLMError,
  type LLMMessage,
  type LLMResponse,
  type ChatOptions,
} from "@/lib/agents/llm-provider";
export {
  buildAuditorSystemPrompt,
  buildDiagnosticadorSystemPrompt,
  buildReparadorSystemPrompt,
} from "@/lib/agents/prompts";
export {
  crmClient,
  crmRequest,
  type CrmDeal,
  type CrmContact,
  type CrmInvoice,
  type CrmTask,
} from "@/lib/agents/crm-client";
export {
  eventClassificationSchema,
  diagnosticHypothesisSchema,
  diagnosticResultSchema,
  repairActionSchema,
  repairResultSchema,
  agentDiagnoseRequestSchema,
  agentRepairRequestSchema,
  type EventClassification,
  type DiagnosticHypothesis,
  type DiagnosticResult,
  type RepairAction,
  type RepairResult,
  type AgentDiagnoseRequest,
  type AgentRepairRequest,
} from "@/lib/agents/schemas";

// Agentes específicos (S4 implementa el Reparador)
// export { runReparador } from "@/lib/agents/reparador";
export {
  classifyStripeEvent,
  recordAndCheckAnomaly,
  findStalledDeals,
  runAudit,
  processHookEvent,
  type AuditReport,
  type StripeEvent,
} from "@/lib/agents/auditor";
export { runDiagnosticador, type DiagnoseOptions } from "@/lib/agents/diagnosticador";
