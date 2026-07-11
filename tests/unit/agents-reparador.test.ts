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

import { runReparador } from "@/lib/agents/reparador";
import type { AgentRepairRequest } from "@/lib/agents/schemas";

const baseRequest: AgentRepairRequest = {
  diagnosis: {
    diagnosis: "DB caída",
    hypotheses: [
      {
        cause: "Postgres connection refused",
        confidence: 0.85,
        evidence: ["ECONNREFUSED", "timeout 5s"],
        suggestedAction: "Restart supabase container y verificar logs.",
      },
    ],
    context: {},
  },
  dealId: "deal-1",
  dryRun: false,
};

beforeEach(() => {
  mocks.fetchMock.mockReset();
  mocks.generateContent.mockReset();
  mocks.state.geminiKey = "";
  mocks.state.zenKey = "";
});

describe("reparador: sin LLM (modo determinista)", () => {
  it("T9.1: crea task de seguimiento con prioridad HIGH si confidence > 0.7", async () => {
    const executeCrm = vi.fn().mockResolvedValue({ id: "task-1" });
    const { result, action, mode } = await runReparador(baseRequest, {
      executeCrm,
    });
    expect(mode).toBe("deterministic");
    expect(action?.action).toBe("create_followup_task");
    expect(executeCrm).toHaveBeenCalledWith(
      "POST",
      "tasks",
      expect.objectContaining({
        title: expect.stringContaining("Postgres"),
        priority: "HIGH",
        dealId: "deal-1",
      }),
    );
    expect(result.status).toBe("success");
    expect(result.details).toContain("task-1");
  });

  it("T9.2: prioridad MEDIUM si confidence <= 0.7", async () => {
    const lowConfidence: AgentRepairRequest = {
      ...baseRequest,
      diagnosis: {
        ...baseRequest.diagnosis,
        hypotheses: [{ ...baseRequest.diagnosis.hypotheses[0]!, confidence: 0.5 }],
      },
    };
    const executeCrm = vi.fn().mockResolvedValue({ id: "task-2" });
    await runReparador(lowConfidence, { executeCrm });
    expect(executeCrm).toHaveBeenCalledWith(
      "POST",
      "tasks",
      expect.objectContaining({ priority: "MEDIUM" }),
    );
  });

  it("T9.3: devuelve failed si executeCrm devuelve null", async () => {
    const executeCrm = vi.fn().mockResolvedValue(null);
    const { result } = await runReparador(baseRequest, { executeCrm });
    expect(result.status).toBe("failed");
    expect(result.details).toContain("CRM no disponible");
  });

  it("T9.4: dryRun=true no ejecuta, devuelve status=skipped", async () => {
    const executeCrm = vi.fn();
    const { result, action } = await runReparador(baseRequest, {
      executeCrm,
      dryRun: true,
    });
    expect(result.status).toBe("skipped");
    expect(result.details).toContain("dryRun");
    expect(executeCrm).not.toHaveBeenCalled();
    expect(action).toBeDefined();
  });
});

describe("reparador: con LLM (Gemini)", () => {
  it("T9.5: usa LLM para planificar y ejecuta la accion devuelta", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        action: "create_followup_task",
        endpoint: "POST /api/crm/tasks",
        payload: {
          title: "Revisar: Postgres connection refused",
          priority: "URGENT",
          dealId: "deal-1",
        },
      }),
    });
    const executeCrm = vi.fn().mockResolvedValue({ id: "task-3" });
    const { result, action, mode } = await runReparador(baseRequest, {
      executeCrm,
    });
    expect(mode).toBe("llm");
    expect(action?.payload).toMatchObject({ priority: "URGENT" });
    expect(executeCrm).toHaveBeenCalledWith(
      "POST",
      "tasks",
      expect.objectContaining({ priority: "URGENT" }),
    );
    expect(result.status).toBe("success");
  });

  it("T9.6: fallback a accion conservadora si LLM falla", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockRejectedValue(new Error("LLM down"));
    const executeCrm = vi.fn().mockResolvedValue({ id: "task-4" });
    const { result, action, mode } = await runReparador(baseRequest, {
      executeCrm,
    });
    expect(mode).toBe("deterministic");
    expect(action?.action).toBe("create_followup_task");
    expect(result.status).toBe("success");
  });

  it("T9.7: endpoint no soportado devuelve skipped", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        action: "do_unknown",
        endpoint: "DELETE /api/crm/unknown",
        payload: {},
      }),
    });
    const executeCrm = vi.fn();
    const { result } = await runReparador(baseRequest, { executeCrm });
    expect(result.status).toBe("skipped");
    expect(executeCrm).not.toHaveBeenCalled();
  });
});
