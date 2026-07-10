import "server-only";
import { buildReparadorSystemPrompt } from "@/lib/agents/prompts";
import { chatCompletionStructured, LLMError } from "@/lib/agents/llm-provider";
import { crmClient } from "@/lib/agents/crm-client";
import { hasAnyLLM } from "@/lib/agents/config";
import {
  repairActionSchema,
  repairResultSchema,
  type AgentRepairRequest,
  type DiagnosticResult,
  type RepairAction,
  type RepairResult,
} from "@/lib/agents/schemas";

// ─── Agente Reparador ───────────────────────────────────────────────────────
//
// Recibe un diagnóstico del Diagnosticador y decide qué acción correctiva
// ejecutar contra el CRM API. LLM propone el plan, código lo ejecuta.
//
// Sin LLM: reintenta operaciones básicas vía CRM API (createTask, etc.) sin
// planificar — solo la heurística más conservadora.

export interface RepairOptions {
  // Inyectable para tests.
  executeCrm?: (
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body: unknown,
  ) => Promise<unknown>;
  // Si dryRun=true, no ejecuta la acción. Solo devuelve el plan.
  dryRun?: boolean;
}

export async function runReparador(
  request: AgentRepairRequest,
  options: RepairOptions = {},
): Promise<{
  result: RepairResult;
  action?: RepairAction;
  mode: "llm" | "deterministic";
}> {
  // 1. Sin LLM o dryRun: acción conservadora (no necesita LLM)
  if (!hasAnyLLM() || options.dryRun) {
    const action = conservativeAction(request);
    if (options.dryRun) {
      return {
        result: {
          action: action.action,
          status: "skipped",
          details: "dryRun: no se ejecutó la acción",
          crmEndpointCalled: action.endpoint,
        },
        action,
        mode: "deterministic",
      };
    }
    const executed = await executeAction(action, request, options);
    return { result: executed, action, mode: "deterministic" };
  }

  // 2. Con LLM: planear primero
  try {
    const plan = await planWithLlm(request);
    if (!plan.action) {
      return {
        result: {
          action: "noop",
          status: "skipped",
          details: "LLM no propuso acción.",
        },
        mode: "llm",
      };
    }
    if (options.dryRun) {
      return {
        result: {
          action: plan.action.action,
          status: "skipped",
          details: "dryRun: no se ejecutó la acción",
          crmEndpointCalled: plan.action.endpoint,
        },
        action: plan.action,
        mode: "llm",
      };
    }
    const executed = await executeAction(plan.action, request, options);
    return { result: executed, action: plan.action, mode: "llm" };
  } catch (err) {
    if (err instanceof LLMError) {
      // Fallback: ejecutar acción conservadora sin LLM
      const action = conservativeAction(request);
      const executed = await executeAction(action, request, options);
      return { result: executed, action, mode: "deterministic" };
    }
    throw err;
  }
}

async function planWithLlm(
  request: AgentRepairRequest,
): Promise<{ action: RepairAction | null; mode: "llm" }> {
  const system = await buildReparadorSystemPrompt();
  const userContent = formatDiagnosisForLlm(request.diagnosis, request.dealId);
  const { content } = await chatCompletionStructured(
    [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
    repairActionSchema,
  );
  return { action: content, mode: "llm" };
}

function formatDiagnosisForLlm(diagnosis: DiagnosticResult, dealId?: string): string {
  const main = diagnosis.hypotheses[0];
  if (!main) return `Diagnóstico sin hipótesis. dealId: ${dealId ?? "—"}.`;
  return [
    `Causa: ${main.cause}`,
    `Confianza: ${main.confidence}`,
    `Evidencia: ${main.evidence.join("; ")}`,
    `Acción sugerida: ${main.suggestedAction}`,
    `dealId: ${dealId ?? "—"}`,
  ].join("\n");
}

// ─── Acción conservadora (sin LLM) ─────────────────────────────────────────

function conservativeAction(request: AgentRepairRequest): RepairAction {
  // Crear una task de seguimiento HIGH priority con la causa raíz del diagnóstico
  const main = request.diagnosis.hypotheses[0];
  const title = main ? `Revisar: ${main.cause}` : "Revisar incidencia diagnosticada";
  return {
    action: "create_followup_task",
    endpoint: "POST /api/crm/tasks",
    payload: {
      title: title.slice(0, 200),
      description: [
        main?.evidence?.join("\n") ?? "",
        main ? `Confianza: ${main.confidence}` : "",
        main ? `Acción sugerida: ${main.suggestedAction}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      priority: main && main.confidence > 0.7 ? "HIGH" : "MEDIUM",
      dealId: request.dealId,
    },
  };
}

// ─── Ejecución determinista de la acción ────────────────────────────────────

async function executeAction(
  action: RepairAction,
  request: AgentRepairRequest,
  options: RepairOptions,
): Promise<RepairResult> {
  const [methodRaw, pathRaw] = action.endpoint.split(" ", 2);
  const method = (methodRaw ?? "GET") as "GET" | "POST" | "PATCH" | "DELETE";
  const path = (pathRaw ?? "").replace(/^\/api\/crm\//, "");

  try {
    if (method === "POST" && path === "tasks") {
      // Mapear al método crmClient si existe
      const payload = action.payload as {
        title: string;
        description?: string;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        dealId?: string;
        contactId?: string;
      };
      const result = options.executeCrm
        ? await options.executeCrm("POST", path, payload)
        : await crmClient.createTask({
            title: payload.title,
            description: payload.description,
            priority: payload.priority,
            dealId: payload.dealId ?? request.dealId,
            contactId: payload.contactId,
          });
      if (result === null) {
        return {
          action: action.action,
          status: "failed",
          details: "CRM no disponible o error HTTP al crear task.",
          crmEndpointCalled: action.endpoint,
        };
      }
      return {
        action: action.action,
        status: "success",
        details: `Task creada: ${(result as { id: string }).id ?? "?"}`,
        crmEndpointCalled: action.endpoint,
      };
    }

    if (method === "POST" && path === "activities") {
      const result = options.executeCrm
        ? await options.executeCrm("POST", path, action.payload)
        : await crmClient.createActivity(
            action.payload as Parameters<typeof crmClient.createActivity>[0],
          );
      if (result === null) {
        return {
          action: action.action,
          status: "failed",
          details: "CRM no disponible o error HTTP al crear activity.",
          crmEndpointCalled: action.endpoint,
        };
      }
      return {
        action: action.action,
        status: "success",
        details: "Activity creada.",
        crmEndpointCalled: action.endpoint,
      };
    }

    if (method === "PATCH" && path.startsWith("deals/")) {
      const dealId = path.split("/")[1] ?? request.dealId;
      const stageId = (action.payload as { stageId: string }).stageId;
      const result = options.executeCrm
        ? await options.executeCrm("PATCH", path, action.payload)
        : dealId && stageId
          ? await crmClient.updateDealStage(dealId, stageId)
          : null;
      if (result === null) {
        return {
          action: action.action,
          status: "failed",
          details: "CRM no disponible o error HTTP al actualizar deal.",
          crmEndpointCalled: action.endpoint,
        };
      }
      return {
        action: action.action,
        status: "success",
        details: `Deal ${dealId} actualizado.`,
        crmEndpointCalled: action.endpoint,
      };
    }

    return {
      action: action.action,
      status: "skipped",
      details: `Endpoint no soportado por el ejecutor: ${action.endpoint}`,
      crmEndpointCalled: action.endpoint,
    };
  } catch (err) {
    return {
      action: action.action,
      status: "failed",
      details: err instanceof Error ? err.message : "Error desconocido al ejecutar la acción.",
      crmEndpointCalled: action.endpoint,
    };
  }
}

// Re-export schema for convenience
export { repairResultSchema };
