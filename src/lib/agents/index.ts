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

// Agentes específicos (F15 completo)
// (F15 S5 — hardening — completado)
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
export { runReparador, type RepairOptions } from "@/lib/agents/reparador";
export {
  evaluateDiagnoseUtility,
  evaluateRepairUtility,
  type DiagnoseScenario,
  type RepairScenario,
} from "@/lib/agents/eval/utilidad";
export {
  validateCrmCall,
  evaluateCrmCompliance,
  captureCrmCalls,
  type CrmCall,
  type CrmContract,
  type ComplianceResult,
} from "@/lib/agents/eval/cumplimiento";
