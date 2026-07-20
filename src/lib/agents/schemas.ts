import { z } from "zod";
import { ALLOWED_ENDPOINT_PATTERNS } from "@/lib/agents/config";

// ─── Schemas para las respuestas estructuradas de los agentes ───────────────
//
// Cada agente recibe del LLM una respuesta que validamos con Zod. Si falla el
// parseo, se reintenta una vez con un prompt más explícito; si vuelve a fallar,
// se degrada a heurísticas deterministas (ver sección "Degradación" del spec).
//
// ⚠️  Todos los schemas usan `.strip()` explícito para eliminar campos no
//     definidos. Esto evita que un LLM malicioso (o alucinado) inyecte campos
//     como `endpoint` o `action` en agentes que solo deben devolver texto.
//     `.strip()` es el default de Zod, pero se declara explícitamente como
//     documentación de seguridad.

export const eventClassificationSchema = z
  .object({
    type: z.enum([
      "payment_success",
      "payment_failed",
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "unknown",
    ]),
    severity: z.enum(["info", "warning", "critical"]),
    summary: z.string().min(1).max(500),
    requiresAction: z.boolean(),
  })
  .strip();

export type EventClassification = z.infer<typeof eventClassificationSchema>;

export const diagnosticHypothesisSchema = z
  .object({
    cause: z.string().min(1).max(200),
    confidence: z.number().min(0).max(1),
    evidence: z.array(z.string().min(1).max(200)).min(1).max(10),
    suggestedAction: z.string().min(1).max(300),
  })
  .strip();

export const diagnosticResultSchema = z
  .object({
    diagnosis: z.string().min(1).max(1000),
    hypotheses: z.array(diagnosticHypothesisSchema).min(1).max(5),
    context: z
      .object({
        dealId: z.string().optional(),
        contactId: z.string().optional(),
        relevantInvoices: z.array(z.string()).optional(),
      })
      .strip(),
  })
  .strip();

export type DiagnosticHypothesis = z.infer<typeof diagnosticHypothesisSchema>;
export type DiagnosticResult = z.infer<typeof diagnosticResultSchema>;

export const repairActionSchema = z
  .object({
    action: z.string().min(1).max(100),
    // Endpoint del CRM API (ej. "POST /api/crm/activities"). Validado contra
    // ALLOWED_ENDPOINT_PATTERNS de config.ts (fuente única de verdad).
    endpoint: z
      .string()
      .refine((val) => ALLOWED_ENDPOINT_PATTERNS.some((p) => p.test(val)), {
        message: "Endpoint no permitido para el agente Reparador",
      }),
    // Payload JSON que se enviará al endpoint. Validado contra el schema del
    // endpoint específico por el código antes de hacer el fetch.
    payload: z.record(z.string(), z.unknown()),
  })
  .strip();

export const repairResultSchema = z
  .object({
    action: z.string().min(1).max(100),
    status: z.enum(["success", "failed", "skipped"]),
    details: z.string().min(1).max(500),
    crmEndpointCalled: z.string().optional(),
  })
  .strip();

export type RepairAction = z.infer<typeof repairActionSchema>;
export type RepairResult = z.infer<typeof repairResultSchema>;

// ─── Schemas para los inputs de los routes ──────────────────────────────────

export const agentDiagnoseRequestSchema = z
  .object({
    context: z.string().trim().min(1, "Contexto requerido.").max(2000),
    error: z.string().trim().max(1000).optional(),
    dealId: z.string().trim().max(100).optional(),
    contactId: z.string().trim().max(100).optional(),
  })
  .strip();

export type AgentDiagnoseRequest = z.infer<typeof agentDiagnoseRequestSchema>;

export const agentRepairRequestSchema = z
  .object({
    diagnosis: diagnosticResultSchema,
    dealId: z.string().trim().max(100).optional(),
    dryRun: z.boolean().optional(),
  })
  .strip();

export type AgentRepairRequest = z.infer<typeof agentRepairRequestSchema>;
