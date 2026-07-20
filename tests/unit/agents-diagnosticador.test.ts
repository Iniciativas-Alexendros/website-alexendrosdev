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

import { diagnosticResultSchema } from "@/lib/agents/schemas";
import { runDiagnosticador } from "@/lib/agents/diagnosticador";

beforeEach(() => {
  mocks.fetchMock.mockReset();
  mocks.generateContent.mockReset();
  mocks.state.geminiKey = "";
  mocks.state.zenKey = "";
});

describe("diagnosticador: heuristica determinista (sin LLM)", () => {
  it("T8.1: keyword 'timeout' -> hipotesis de red con confidence 0.7", async () => {
    const { result, mode } = await runDiagnosticador({
      context: "request timeout al llamar a Stripe",
    });
    expect(mode).toBe("deterministic");
    expect(result.hypotheses[0]?.cause.toLowerCase()).toContain("timeout");
    expect(result.hypotheses[0]?.confidence).toBeGreaterThan(0.5);
  });

  it("T8.2: keyword '429' -> rate limit con confidence alta", async () => {
    const { result } = await runDiagnosticador({
      context: "Stripe responde 429 too many requests",
    });
    const rateLimit = result.hypotheses.find((h) => h.cause.toLowerCase().includes("rate limit"));
    expect(rateLimit).toBeDefined();
    expect(rateLimit?.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("T8.3: keyword 'prisma' -> DB no responde con confidence 0.9", async () => {
    const { result } = await runDiagnosticador({
      context: "PrismaClientKnownRequestError: connection refused",
    });
    const db = result.hypotheses.find((h) => h.cause.toLowerCase().includes("db"));
    expect(db).toBeDefined();
    expect(db?.confidence).toBe(0.9);
  });

  it("T8.4: keyword '422' -> validation error con confidence 0.95", async () => {
    const { result } = await runDiagnosticador({
      context: "POST /api/checkout devuelve 422 invalid email",
    });
    const validation = result.hypotheses.find(
      (h) =>
        h.cause.toLowerCase().includes("validation") || h.cause.toLowerCase().includes("schema"),
    );
    expect(validation).toBeDefined();
    expect(validation?.confidence).toBe(0.95);
  });

  it("T8.5: contexto sin keywords -> hipotesis generica con confidence baja", async () => {
    const { result } = await runDiagnosticador({
      context: "algo no funciona bien",
    });
    expect(result.hypotheses[0]?.confidence).toBeLessThan(0.5);
  });

  it("T8.6: enriquece contexto con datos del CRM (dealId)", async () => {
    const { result } = await runDiagnosticador(
      { context: "test", dealId: "deal-1" },
      {
        fetchDeal: () =>
          Promise.resolve({
            id: "deal-1",
            title: "Mi proyecto",
            value: 100000,
            currency: "eur",
            probability: 60,
            stageId: "s1",
            contactId: "c1",
          }),
        fetchInvoices: () =>
          Promise.resolve([
            {
              id: "i1",
              number: "INV-001",
              status: "pending",
              total: 100000,
              currency: "eur",
              dealId: "deal-1",
              contactId: null,
            },
          ]),
      },
    );
    expect(result.context.dealId).toBe("deal-1");
    expect(result.context.relevantInvoices).toContain("INV-001");
  });
});

describe("diagnosticador: con LLM (Gemini)", () => {
  it("T8.7: usa LLM cuando hay GEMINI_API_KEY y devuelve resultado validado", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        diagnosis: "DB caída por overload",
        hypotheses: [
          {
            cause: "Postgres connection pool exhausted",
            confidence: 0.88,
            evidence: ["pool size exceeded", "no available connections"],
            suggestedAction: "restart supabase",
          },
        ],
        context: { dealId: "deal-x" },
      }),
    });
    const { result, mode } = await runDiagnosticador({
      context: "errores intermitentes",
      dealId: "deal-x",
    });
    expect(mode).toBe("llm");
    expect(result.hypotheses[0]?.confidence).toBe(0.88);
  });

  it("T8.8: fallback a determinista si LLM falla", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockRejectedValue(new Error("503 from gemini"));
    const { result, mode } = await runDiagnosticador({
      context: "timeout en checkout",
    });
    expect(mode).toBe("deterministic");
    expect(result.hypotheses.length).toBeGreaterThan(0);
  });
});

// ─── Seguridad: integridad de capas ──────────────────────────────────────────
//
// Verifica que el output del Diagnosticador (DiagnosticResult) NO contiene
// campos que permitan ejecutar acciones de escritura en el CRM. Solo texto.

describe("diagnosticador: integridad de capas — sin write fields en output", () => {
  const validInput = {
    diagnosis: "DB caída",
    hypotheses: [
      {
        cause: "Postgres connection refused",
        confidence: 0.85,
        evidence: ["ECONNREFUSED"],
        suggestedAction: "restart supabase",
      },
    ],
    context: {},
  };

  it("S1: schema no expone endpoint/action/payload", () => {
    const shape = diagnosticResultSchema.shape as Record<string, unknown>;
    const keys = Object.keys(shape);
    expect(keys).not.toContain("endpoint");
    expect(keys).not.toContain("action");
    expect(keys).not.toContain("payload");
    expect(keys).not.toContain("method");
    expect(keys).not.toContain("url");
    // Solo debe tener diagnosis, hypotheses, context (orden no importa)
    expect([...keys].sort()).toEqual(["diagnosis", "hypotheses", "context"]);
  });

  it("S2: extra fields con nombres peligrosos son strippeados por Zod", () => {
    const malicious = {
      ...validInput,
      endpoint: "DELETE /api/crm/tasks",
      action: "delete_all_contacts",
      payload: { malicious: true },
    };
    const parsed = diagnosticResultSchema.parse(malicious);
    expect(parsed).not.toHaveProperty("endpoint");
    expect(parsed).not.toHaveProperty("action");
    expect(parsed).not.toHaveProperty("payload");
    // Los campos válidos se preservan
    expect(parsed.diagnosis).toBe("DB caída");
    expect(parsed.hypotheses).toHaveLength(1);
  });

  it("S3: LLM que devuelve endpoint malicioso -> strippeado por Zod antes del caller", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        ...validInput,
        endpoint: "DELETE /api/crm/deals/all",
        action: "malicious_delete",
      }),
    });
    const { result } = await runDiagnosticador({
      context: "test",
    });
    // Verificar que los campos maliciosos NO están en el resultado
    expect(result).not.toHaveProperty("endpoint");
    expect(result).not.toHaveProperty("action");
    // Los campos válidos están presentes
    expect(result.diagnosis).toBe("DB caída");
    expect(result.hypotheses).toHaveLength(1);
  });
});
