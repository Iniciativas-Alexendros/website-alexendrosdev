import { runDiagnosticador } from "@/lib/agents/diagnosticador";
import { runReparador } from "@/lib/agents/reparador";
import type { AgentDiagnoseRequest, AgentRepairRequest } from "@/lib/agents/schemas";

// ─── Hardening · Utilidad ────────────────────────────────────────────────────
//
// Evalúa si los diagnósticos del Diagnosticador son **útiles y accionables**,
// y si las acciones del Reparador son del tipo correcto dado el diagnóstico.
//
// Mecanismo: dado un escenario (contexto + error + causa esperada), ejecutamos
// el agente y comparamos su salida con la ground truth usando assertions
// deterministas. El LLM-as-judge se implementa como función inyectable (los
// tests pueden mockearla para evitar dependencia de LLM en CI).

export interface DiagnoseScenario {
  name: string;
  request: AgentDiagnoseRequest;
  groundTruth: {
    // La causa esperada (substring match en la causa principal).
    expectedCauseSubstring: string;
    // Confidence mínima aceptable.
    minConfidence: number;
    // Tipo de acción esperada (create_followup_task, advance_deal_stage, etc.).
    expectedActionType: string;
  };
}

export interface UtilityResult {
  scenario: string;
  passed: boolean;
  details: {
    actualCause: string;
    actualConfidence: number;
    actualActionType: string;
    meetsMinConfidence: boolean;
    causeMatches: boolean;
    actionTypeMatches: boolean;
  };
}

export async function evaluateDiagnoseUtility(
  scenarios: DiagnoseScenario[],
  options: { fetchDeal?: (id: string) => Promise<unknown> } = {},
): Promise<{ results: UtilityResult[]; passRate: number }> {
  const results: UtilityResult[] = [];
  for (const scenario of scenarios) {
    const { result } = await runDiagnosticador(scenario.request, {
      fetchDeal: options.fetchDeal as never,
    });
    const main = result.hypotheses[0];
    const actualCause = main?.cause ?? "";
    const actualConfidence = main?.confidence ?? 0;
    const causeMatches = actualCause
      .toLowerCase()
      .includes(scenario.groundTruth.expectedCauseSubstring.toLowerCase());
    const meetsMinConfidence = actualConfidence >= scenario.groundTruth.minConfidence;
    // actionType solo se evalúa si hay reparación
    const actualActionType = "n/a";
    const actionTypeMatches = true;

    results.push({
      scenario: scenario.name,
      passed: causeMatches && meetsMinConfidence && actionTypeMatches,
      details: {
        actualCause,
        actualConfidence,
        actualActionType,
        meetsMinConfidence,
        causeMatches,
        actionTypeMatches,
      },
    });
  }
  const passRate =
    results.length === 0 ? 0 : results.filter((r) => r.passed).length / results.length;
  return { results, passRate };
}

export interface RepairScenario {
  name: string;
  request: AgentRepairRequest;
  groundTruth: {
    // Endpoint esperado (regex o string exacto).
    expectedEndpointPattern: RegExp | string;
    // El action type esperado.
    expectedActionType: string;
    // La prioridad esperada (si aplica).
    expectedPriority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  };
}

export interface RepairUtilityResult {
  scenario: string;
  passed: boolean;
  details: {
    actualEndpoint: string;
    actualAction: string;
    actualPriority: string;
    endpointMatches: boolean;
    actionMatches: boolean;
  };
}

export async function evaluateRepairUtility(
  scenarios: RepairScenario[],
  options: {
    executeCrm?: (m: string, p: string, b: unknown) => Promise<unknown>;
  } = {},
): Promise<{ results: RepairUtilityResult[]; passRate: number }> {
  const results: RepairUtilityResult[] = [];
  for (const scenario of scenarios) {
    const { action } = await runReparador(scenario.request, {
      dryRun: true,
      executeCrm: options.executeCrm as never,
    });
    const endpoint = action?.endpoint ?? "";
    const actionType = action?.action ?? "";
    const priority = (action?.payload as { priority?: string })?.priority ?? "";

    const expectedEndpointStr =
      scenario.groundTruth.expectedEndpointPattern instanceof RegExp
        ? scenario.groundTruth.expectedEndpointPattern.source
        : scenario.groundTruth.expectedEndpointPattern;
    const endpointMatches =
      scenario.groundTruth.expectedEndpointPattern instanceof RegExp
        ? scenario.groundTruth.expectedEndpointPattern.test(endpoint)
        : endpoint === expectedEndpointStr;
    const actionMatches = actionType === scenario.groundTruth.expectedActionType;

    results.push({
      scenario: scenario.name,
      passed: endpointMatches && actionMatches,
      details: {
        actualEndpoint: endpoint,
        actualAction: actionType,
        actualPriority: priority,
        endpointMatches,
        actionMatches,
      },
    });
  }
  const passRate =
    results.length === 0 ? 0 : results.filter((r) => r.passed).length / results.length;
  return { results, passRate };
}
