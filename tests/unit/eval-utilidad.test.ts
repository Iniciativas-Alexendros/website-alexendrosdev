import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const fetchMock = vi.fn();
  const generateContent = vi.fn();
  return {
    state: {
      geminiKey: "" as string,
      zenKey: "" as string,
    },
    fetchMock,
    generateContent,
  };
});

vi.mock("@/lib/agents/config", () => ({
  agentsConfig: {
    primaryModel: "gemini-3.5-flash",
    perModelTimeoutMs: 1_000,
    perModelMaxRetries: 1,
    get geminiApiKey() {
      return mocks.state.geminiKey;
    },
    get opencodeZenApiKey() {
      return mocks.state.zenKey;
    },
    get opencodeZenModels() {
      return ["deepseek-v4-flash-free", "mimo-v2.5-free", "north-mini-code-free"];
    },
  },
  hasGemini: () => Boolean(mocks.state.geminiKey),
  hasOpenCodeZen: () => Boolean(mocks.state.zenKey),
  hasAnyLLM: () => Boolean(mocks.state.geminiKey) || Boolean(mocks.state.zenKey),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor(_opts: { apiKey: string }) {
      void _opts;
    }
    models = {
      generateContent: mocks.generateContent,
    };
  },
}));

vi.stubGlobal("fetch", mocks.fetchMock);

import {
  evaluateDiagnoseUtility,
  evaluateRepairUtility,
  type DiagnoseScenario,
  type RepairScenario,
} from "@/lib/agents/eval/utilidad";

beforeEach(() => {
  mocks.fetchMock.mockReset();
  mocks.generateContent.mockReset();
  mocks.state.geminiKey = "";
  mocks.state.zenKey = "";
});

describe("eval/utilidad: evaluateDiagnoseUtility (modo determinista)", () => {
  it("T11.1: escenario timeout -> pasa (cause=timeout, confidence>=0.6)", async () => {
    const scenarios: DiagnoseScenario[] = [
      {
        name: "timeout 5s en checkout",
        request: { context: "request timeout al llamar a Stripe" },
        groundTruth: {
          expectedCauseSubstring: "timeout",
          minConfidence: 0.6,
          expectedActionType: "create_followup_task",
        },
      },
    ];
    const { results, passRate } = await evaluateDiagnoseUtility(scenarios);
    expect(results[0]?.passed).toBe(true);
    expect(passRate).toBe(1);
  });

  it("T11.2: escenario 429 rate limit -> pasa (cause=rate limit)", async () => {
    const scenarios: DiagnoseScenario[] = [
      {
        name: "rate limit 429",
        request: { context: "Stripe responde 429 too many requests" },
        groundTruth: {
          expectedCauseSubstring: "rate limit",
          minConfidence: 0.7,
          expectedActionType: "create_followup_task",
        },
      },
    ];
    const { results } = await evaluateDiagnoseUtility(scenarios);
    expect(results[0]?.passed).toBe(true);
  });

  it("T11.3: escenario 422 validation -> pasa (cause=validation)", async () => {
    const scenarios: DiagnoseScenario[] = [
      {
        name: "validation 422",
        request: { context: "API responde 422 invalid email format" },
        groundTruth: {
          expectedCauseSubstring: "validation",
          minConfidence: 0.9,
          expectedActionType: "noop",
        },
      },
    ];
    const { results } = await evaluateDiagnoseUtility(scenarios);
    expect(results[0]?.passed).toBe(true);
  });

  it("T11.4: escenario generico -> falla confidence < minimo", async () => {
    const scenarios: DiagnoseScenario[] = [
      {
        name: "caso vago",
        request: { context: "algo no va bien, no se qué es" },
        groundTruth: {
          expectedCauseSubstring: "DB",
          minConfidence: 0.95, // La heuristica asigna 0.3 al generico
          expectedActionType: "create_followup_task",
        },
      },
    ];
    const { results } = await evaluateDiagnoseUtility(scenarios);
    expect(results[0]?.passed).toBe(false);
  });

  it("T11.5: passRate refleja proporcion de aciertos", async () => {
    const scenarios: DiagnoseScenario[] = [
      {
        name: "ok",
        request: { context: "timeout en checkout" },
        groundTruth: {
          expectedCauseSubstring: "timeout",
          minConfidence: 0.5,
          expectedActionType: "x",
        },
      },
      {
        name: "fail",
        request: { context: "no se que pasa" },
        groundTruth: {
          expectedCauseSubstring: "DB",
          minConfidence: 0.99,
          expectedActionType: "y",
        },
      },
    ];
    const { passRate, results } = await evaluateDiagnoseUtility(scenarios);
    expect(results.filter((r) => r.passed).length).toBe(1);
    expect(passRate).toBe(0.5);
  });
});

describe("eval/utilidad: evaluateRepairUtility (modo determinista)", () => {
  it("T11.6: accion conservadora -> endpoint POST /api/crm/tasks", async () => {
    const scenarios: RepairScenario[] = [
      {
        name: "reparar tras timeout",
        request: {
          diagnosis: {
            diagnosis: "timeout",
            hypotheses: [
              {
                cause: "timeout en checkout",
                confidence: 0.85,
                evidence: ["x"],
                suggestedAction: "y",
              },
            ],
            context: {},
          },
          dealId: "deal-1",
        },
        groundTruth: {
          expectedEndpointPattern: /^POST \/api\/crm\/tasks$/,
          expectedActionType: "create_followup_task",
          expectedPriority: "HIGH",
        },
      },
    ];
    const { results } = await evaluateRepairUtility(scenarios);
    expect(results[0]?.passed).toBe(true);
  });

  it("T11.7: con confidence < 0.7 -> prioridad MEDIUM", async () => {
    const scenarios: RepairScenario[] = [
      {
        name: "reparar con baja confianza",
        request: {
          diagnosis: {
            diagnosis: "timeout",
            hypotheses: [
              {
                cause: "timeout",
                confidence: 0.5,
                evidence: ["x"],
                suggestedAction: "y",
              },
            ],
            context: {},
          },
        },
        groundTruth: {
          expectedEndpointPattern: /^POST \/api\/crm\/tasks$/,
          expectedActionType: "create_followup_task",
          expectedPriority: "MEDIUM",
        },
      },
    ];
    const { results } = await evaluateRepairUtility(scenarios);
    expect(results[0]?.passed).toBe(true);
  });
});
