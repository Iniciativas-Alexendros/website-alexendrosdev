// Punto de entrada de los agentes IA (F15).
// Los agentes se invocan desde los route handlers en src/app/api/agents/*
// o directamente desde otros módulos del servidor (ej. webhook de Stripe).

export { agentsConfig, hasGemini, hasOpenCodeZen, hasAnyLLM } from "@/lib/agents/config";
export {
  chatCompletion,
  chatCompletionStructured,
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
export { crmReader, type CrmDeal, type CrmContact, type CrmInvoice } from "@/lib/agents/crm-reader";
export { crmWriter, type CrmTask } from "@/lib/agents/crm-writer";
export { crmRequest } from "@/lib/agents/crm-client";
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
  classifyEvent,
  recordAndCheckAnomaly,
  findStalledDeals,
  runAudit,
  processHookEvent,
  type AuditReport,
  type StripeEvent,
} from "@/lib/agents/auditor";
export { runDiagnosticador, diagnose, type DiagnoseOptions } from "@/lib/agents/diagnosticador";
export { runReparador, planRepair, type RepairOptions } from "@/lib/agents/reparador";
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
