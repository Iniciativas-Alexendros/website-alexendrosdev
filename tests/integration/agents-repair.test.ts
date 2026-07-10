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

vi.mock("@/google/genai", () => ({}));
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

import { POST as repairPOST } from "@/app/api/agents/repair/route";

function makeReq(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/agents/repair", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.fetchMock.mockReset();
  mocks.generateContent.mockReset();
  mocks.state.geminiKey = "";
  mocks.state.zenKey = "";
  delete process.env.CRM_API_KEY;
});

describe("POST /api/agents/repair", () => {
  const validRequest = {
    diagnosis: {
      diagnosis: "DB caída",
      hypotheses: [
        {
          cause: "Postgres connection refused",
          confidence: 0.85,
          evidence: ["ECONNREFUSED"],
          suggestedAction: "restart supabase",
        },
      ],
      context: { dealId: "deal-1" },
    },
    dealId: "deal-1",
  };

  it("T11.1: 401 sin X-API-Key", async () => {
    const res = await repairPOST(makeReq(validRequest));
    expect(res.status).toBe(401);
  });

  it("T11.2: 422 con body invalido (sin diagnosis)", async () => {
    process.env.CRM_API_KEY = "test-key";
    const res = await repairPOST(makeReq({ dealId: "x" }, { "x-api-key": "test-key" }));
    expect(res.status).toBe(422);
  });

  it("T11.3: 200 con diagnostico valido (modo determinista, sin LLM)", async () => {
    process.env.CRM_API_KEY = "test-key";
    // Mockear el fetch a CRM para que la llamada POST /api/crm/tasks devuelva 200
    mocks.fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "task-1" }), { status: 200 }),
    );
    const res = await repairPOST(makeReq(validRequest, { "x-api-key": "test-key" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("deterministic");
    expect(body.result.status).toBe("success");
  });

  it("T11.4: 200 con dryRun=true (no ejecuta)", async () => {
    process.env.CRM_API_KEY = "test-key";
    const res = await repairPOST(
      makeReq(validRequest, { "x-api-key": "test-key", "x-dry-run": "true" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dryRun).toBe(true);
    expect(body.result.status).toBe("skipped");
    expect(mocks.fetchMock).not.toHaveBeenCalled();
  });
});
