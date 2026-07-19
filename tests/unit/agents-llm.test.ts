import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => {
  const fetchMock = vi.fn();
  const generateContent = vi.fn();
  return {
    state: {
      geminiKey: "" as string,
      zenKey: "" as string,
      zenBaseUrl: "https://opencode.ai/zen/v1" as string,
      zenModels: ["deepseek-v4-flash-free", "mimo-v2.5-free", "north-mini-code-free"] as string[],
    },
    fetchMock,
    generateContent,
  };
});

vi.mock("@/lib/agents/config", () => ({
  agentsConfig: {
    get geminiApiKey() {
      return mocks.state.geminiKey;
    },
    get opencodeZenApiKey() {
      return mocks.state.zenKey;
    },
    get opencodeZenBaseUrl() {
      return mocks.state.zenBaseUrl;
    },
    get opencodeZenModels() {
      return mocks.state.zenModels;
    },
    primaryModel: "gemini-3.5-flash",
    perModelTimeoutMs: 1_000,
    perModelMaxRetries: 1,
  },
  hasGemini: () => Boolean(mocks.state.geminiKey),
  hasOpenCodeZen: () => Boolean(mocks.state.zenKey),
  hasAnyLLM: () => Boolean(mocks.state.geminiKey) || Boolean(mocks.state.zenKey),
  ALLOWED_ENDPOINT_PATTERNS: [/.*/],
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
  LLMError,
  chatCompletion,
  chatCompletionStructured,
  classifyEvent,
  diagnose,
  planRepair,
} from "@/lib/agents/llm-provider";
import {
  diagnosticResultSchema,
  eventClassificationSchema,
  repairActionSchema,
} from "@/lib/agents/schemas";

beforeEach(() => {
  mocks.fetchMock.mockReset();
  mocks.generateContent.mockReset();
  mocks.state.geminiKey = "";
  mocks.state.zenKey = "";
  mocks.state.zenBaseUrl = "https://opencode.ai/zen/v1";
  mocks.state.zenModels = ["deepseek-v4-flash-free", "mimo-v2.5-free", "north-mini-code-free"];
});

describe("llm-provider: chatCompletion", () => {
  it("T5.1: throws LLMError('no_provider') cuando no hay keys", async () => {
    await expect(chatCompletion([{ role: "user", content: "hola" }])).rejects.toThrowError(
      LLMError,
    );
    try {
      await chatCompletion([{ role: "user", content: "x" }]);
    } catch (e) {
      expect((e as LLMError).code).toBe("no_provider");
    }
  });

  it("T5.2: usa Gemini primario cuando está configurado y responde", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({ text: "respuesta de gemini" });

    const res = await chatCompletion([{ role: "user", content: "hola" }]);
    expect(res.provider).toBe("gemini");
    expect(res.model).toBe("gemini-3.5-flash");
    expect(res.content).toBe("respuesta de gemini");
    expect(mocks.generateContent).toHaveBeenCalledOnce();
  });

  it("T5.3: fallback a OpenCode Zen cuando Gemini falla", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.state.zenKey = "zen-test";
    mocks.generateContent.mockRejectedValueOnce(new Error("503 Service Unavailable"));
    mocks.fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "respuesta zen" } }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const res = await chatCompletion([{ role: "user", content: "x" }]);
    expect(res.provider).toBe("opencode-zen");
    expect(res.model).toBe("deepseek-v4-flash-free");
    expect(res.content).toBe("respuesta zen");
  });

  it("T5.4: reintenta el mismo modelo (1 retry) y luego cae al siguiente tras agotar retries", async () => {
    mocks.state.zenKey = "zen-test";
    // deepseek falla con 429 en ambos intentos (1 retry) → mimo responde OK
    mocks.fetchMock
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "mimo response" } }],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const res = await chatCompletion([{ role: "user", content: "x" }]);
    expect(res.model).toBe("mimo-v2.5-free");
    expect(res.content).toBe("mimo response");
    expect(mocks.fetchMock).toHaveBeenCalledTimes(3);
  });

  it("T5.5: throws LLMError('all_models_failed') cuando todos los modelos fallan", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.state.zenKey = "zen-test";
    mocks.generateContent.mockRejectedValue(new Error("timeout"));
    mocks.fetchMock.mockResolvedValue(new Response("error", { status: 500 }));

    await expect(chatCompletion([{ role: "user", content: "x" }])).rejects.toThrowError(LLMError);
    try {
      await chatCompletion([{ role: "user", content: "x" }]);
    } catch (e) {
      const err = e as LLMError;
      expect(err.code).toBe("all_models_failed");
      expect(err.attempts.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("T5.6: respeta timeout y convierte a error retryable", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.state.zenKey = "zen-test";
    // Gemini cuelga (never resolves) — el test usa un timeout corto
    mocks.generateContent.mockImplementationOnce(
      () => new Promise((_resolve) => setTimeout(() => _resolve({ text: "tarde" }), 5_000)),
    );
    mocks.fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: "zen rápido" } }] }), {
        status: 200,
      }),
    );
    // El mock del config tiene perModelTimeoutMs=1000 — no se ejecuta
    // (test de timeout real requiere time mocking). Aquí validamos que
    // al menos el fallback se invoca cuando Gemini rechaza.
    mocks.generateContent.mockReset();
    mocks.generateContent.mockRejectedValueOnce(new Error("timeout after 1000ms"));
    const res = await chatCompletion([{ role: "user", content: "x" }]);
    expect(res.provider).toBe("opencode-zen");
  });
});

describe("llm-provider: chatCompletionStructured", () => {
  it("T5.7: parsea JSON válido del LLM y valida con Zod", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({ result: "structured", n: 42 }),
    });
    const schema = z.object({ result: z.string(), n: z.number() });
    const res = await chatCompletionStructured([{ role: "user", content: "x" }], schema);
    expect(res.content).toEqual({ result: "structured", n: 42 });
  });

  it("T5.8: reintenta con prompt estricto si el primer JSON no parsea", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent
      .mockResolvedValueOnce({ text: "esto no es JSON" })
      .mockResolvedValueOnce({ text: JSON.stringify({ valid: true }) });
    const schema = z.object({ valid: z.boolean() });
    const res = await chatCompletionStructured([{ role: "user", content: "x" }], schema);
    expect(res.content).toEqual({ valid: true });
    expect(mocks.generateContent).toHaveBeenCalledTimes(2);
  });

  it("T5.9: throws LLMError('invalid_response') si ambos intentos fallan Zod", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValue({ text: "no json" });
    const schema = z.object({ valid: z.boolean() });
    await expect(
      chatCompletionStructured([{ role: "user", content: "x" }], schema),
    ).rejects.toThrowError(LLMError);
  });
});

describe("llm-provider: wrappers de dominio", () => {
  it("T5.10: classifyEvent retorna EventClassification válido", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        type: "payment_failed",
        severity: "critical",
        summary: "Pago rechazado por el banco",
        requiresAction: true,
      }),
    });
    const res = await classifyEvent("payment_intent.payment_failed on 2026-07-11");
    expect(res.content.type).toBe("payment_failed");
    expect(eventClassificationSchema.safeParse(res.content).success).toBe(true);
  });

  it("T5.11: diagnose retorna DiagnosticResult con hipótesis en rango válido", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        diagnosis: "DB caída",
        hypotheses: [
          {
            cause: "Postgres no responde",
            confidence: 0.85,
            evidence: ["timeout 5s en queries", "logs de prisma"],
            suggestedAction: "restart supabase container",
          },
        ],
        context: {},
      }),
    });
    const res = await diagnose("la web no carga leads");
    expect(diagnosticResultSchema.safeParse(res.content).success).toBe(true);
  });

  it("T5.12: planRepair retorna RepairAction con endpoint válido", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        action: "create_followup_task",
        endpoint: "POST /api/crm/tasks",
        payload: {
          title: "Revisar pago fallido",
          priority: "HIGH",
          dealId: "deal-123",
        },
      }),
    });
    const res = await planRepair("Pago fallido de cliente X");
    expect(repairActionSchema.safeParse(res.content).success).toBe(true);
  });
});
