import "server-only";
import { buildReparadorSystemPrompt } from "@/lib/agents/prompts";
import { chatCompletionStructured, LLMError, type LLMResponse } from "@/lib/agents/llm-provider";
import { crmWriter } from "@/lib/agents/crm-writer";
import { hasAnyLLM, isAllowedRepairEndpoint } from "@/lib/agents/config";
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

// ─── Helpers de resultado ──────────────────────────────────────────────────
//
// Constructores compartidos para RepairResult. Eliminan la repetición del
// objeto literal { action, status, details, crmEndpointCalled } en cada rama.

function resultOk(action: RepairAction, details: string): RepairResult {
  return {
    action: action.action,
    status: "success",
    details,
    crmEndpointCalled: action.endpoint,
  };
}

function resultFail(action: RepairAction, details: string): RepairResult {
  return {
    action: action.action,
    status: "failed",
    details,
    crmEndpointCalled: action.endpoint,
  };
}

function resultSkipped(action: RepairAction, details: string): RepairResult {
  return {
    action: action.action,
    status: "skipped",
    details,
    crmEndpointCalled: action.endpoint,
  };
}

// ─── Acciones específicas ───────────────────────────────────────────────────
//
// Cada handler ejecuta una operación CRM concreta. Reciben action, path, payload
// y options; devuelven un RepairResult. El dispatch lo hace executeAction().

async function createTaskAction(
  action: RepairAction,
  path: string,
  payload: RepairAction["payload"],
  request: AgentRepairRequest,
  options: RepairOptions,
): Promise<RepairResult> {
  const typed = payload as {
    title: string;
    description?: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dealId?: string;
    contactId?: string;
  };
  const result = options.executeCrm
    ? await options.executeCrm("POST", path, payload)
    : await crmWriter.createTask({
        title: typed.title,
        description: typed.description,
        priority: typed.priority,
        dealId: typed.dealId ?? request.dealId,
        contactId: typed.contactId,
      });
  if (result === null) {
    return resultFail(action, "CRM no disponible o error HTTP al crear task.");
  }
  return resultOk(action, `Task creada: ${(result as { id: string }).id ?? "?"}`);
}

async function createActivityAction(
  action: RepairAction,
  path: string,
  payload: RepairAction["payload"],
  options: RepairOptions,
): Promise<RepairResult> {
  const result = options.executeCrm
    ? await options.executeCrm("POST", path, payload)
    : await crmWriter.createActivity(payload as Parameters<typeof crmWriter.createActivity>[0]);
  if (result === null) {
    return resultFail(action, "CRM no disponible o error HTTP al crear activity.");
  }
  return resultOk(action, "Activity creada.");
}

async function updateDealStageAction(
  action: RepairAction,
  path: string,
  payload: RepairAction["payload"],
  request: AgentRepairRequest,
  options: RepairOptions,
): Promise<RepairResult> {
  const dealId = path.split("/")[1] ?? request.dealId;
  const stageId = (payload as { stageId: string }).stageId;
  const result = options.executeCrm
    ? await options.executeCrm("PATCH", path, payload)
    : dealId && stageId
      ? await crmWriter.updateDealStage(dealId, stageId)
      : null;
  if (result === null) {
    return resultFail(action, "CRM no disponible o error HTTP al actualizar deal.");
  }
  return resultOk(action, `Deal ${dealId} actualizado.`);
}

// ─── Ejecución determinista de la acción ────────────────────────────────────

async function executeAction(
  action: RepairAction,
  request: AgentRepairRequest,
  options: RepairOptions,
): Promise<RepairResult> {
  // Seguridad: verificar que el endpoint está en la allowlist (defensa en profundidad)
  if (!isAllowedRepairEndpoint(action.endpoint)) {
    return resultSkipped(
      action,
      `Endpoint no permitido: ${action.endpoint}. Acción omitida por seguridad.`,
    );
  }

  const [, pathRaw] = action.endpoint.split(" ", 2);
  const path = (pathRaw ?? "").replace(/^\/api\/crm\//, "");

  try {
    if (path === "tasks") {
      return await createTaskAction(action, path, action.payload, request, options);
    }
    if (path === "activities") {
      return await createActivityAction(action, path, action.payload, options);
    }
    if (path.startsWith("deals/")) {
      return await updateDealStageAction(action, path, action.payload, request, options);
    }

    return resultSkipped(action, `Endpoint no soportado por el ejecutor: ${action.endpoint}`);
  } catch (err) {
    return resultFail(
      action,
      err instanceof Error ? err.message : "Error desconocido al ejecutar la acción.",
    );
  }
}

// ─── Wrapper LLM directo (desde index.ts o tests) ───────────────────────────
//
// Versión simplificada que planifica una reparación a partir de un texto de
// diagnóstico, sin necesidad de un objeto AgentRepairRequest completo.

export async function planRepair(diagnosisText: string): Promise<LLMResponse<RepairAction>> {
  return chatCompletionStructured(
    [
      {
        role: "system",
        content:
          "Eres un planificador de reparaciones. Dado un diagnóstico, " +
          "propón UNA acción correctiva concreta que se ejecutará vía CRM API. " +
          "Devuelve JSON con {action, endpoint, payload}. " +
          "El endpoint debe tener formato 'METHOD /api/crm/...'.",
      },
      { role: "user", content: diagnosisText },
    ],
    repairActionSchema,
  );
}

// Re-export schema for convenience
export { repairResultSchema };
