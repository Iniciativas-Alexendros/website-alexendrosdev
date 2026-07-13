import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const fetchMock = vi.fn();
  const generateContent = vi.fn();
  return {
    state: {
      crmKey: "" as string,
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

import { POST as hooksPOST } from "@/app/api/agents/hooks/route";
import { POST as auditPOST } from "@/app/api/agents/audit/route";
import { _resetFailureWindow } from "@/lib/agents/auditor";

function makeReq(method: string, body?: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/agents/test", {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/agents/hooks", () => {
  it("T7.1: 503 sin CRM_API_KEY (auth requerida)", async () => {
    const req = makeReq("POST", { type: "payment_intent.succeeded" });
    const res = await hooksPOST(req);
    expect(res.status).toBe(503);
  });

  it("T7.2: 401 con X-API-Key incorrecta", async () => {
    process.env.CRM_API_KEY = "correcta";
    const req = makeReq(
      "POST",
      { type: "payment_intent.succeeded" },
      { "x-api-key": "incorrecta" },
    );
    const res = await hooksPOST(req);
    expect(res.status).toBe(401);
  });

  it("T7.3: 422 con evento invalido (falta type)", async () => {
    process.env.CRM_API_KEY = "test-key";
    const req = makeReq("POST", { id: "evt_1" }, { "x-api-key": "test-key" });
    const res = await hooksPOST(req);
    expect(res.status).toBe(422);
  });

  it("T7.4: 200 con evento valido payment_failed (modo determinista)", async () => {
    process.env.CRM_API_KEY = "test-key";
    const req = makeReq(
      "POST",
      { type: "payment_intent.payment_failed", id: "evt_1" },
      { "x-api-key": "test-key" },
    );
    const res = await hooksPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classification.type).toBe("payment_failed");
    expect(body.mode).toBe("deterministic");
  });

  it("T7.5: 200 con evento valido payment_intent.succeeded", async () => {
    process.env.CRM_API_KEY = "test-key";
    const req = makeReq(
      "POST",
      {
        type: "payment_intent.succeeded",
        id: "evt_2",
        data: { object: { amount: 6000 } },
      },
      { "x-api-key": "test-key" },
    );
    const res = await hooksPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classification.type).toBe("payment_success");
  });

  it("T7.6: 3 fallos seguidos marcan anomalia=true", async () => {
    process.env.CRM_API_KEY = "test-key";
    _resetFailureWindow();
    for (let i = 0; i < 3; i++) {
      const req = makeReq(
        "POST",
        { type: "payment_intent.payment_failed", id: `evt_${i}` },
        { "x-api-key": "test-key" },
      );
      const res = await hooksPOST(req);
      const body = await res.json();
      if (i === 2) {
        expect(body.anomaly).toBe(true);
        expect(body.failureCount).toBe(3);
      }
    }
  });
});

describe("POST /api/agents/audit", () => {
  it("T7.7: 503 sin CRM_API_KEY (auth requerida)", async () => {
    delete process.env.CRM_API_KEY;
    const req = makeReq("POST");
    const res = await auditPOST(req);
    expect(res.status).toBe(503);
  });

  it("T7.8: 200 con X-API-Key valida (modo determinista, sin deals)", async () => {
    process.env.CRM_API_KEY = "test-key";
    const req = makeReq("POST", undefined, { "x-api-key": "test-key" });
    const res = await auditPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.generatedAt).toBeTruthy();
    expect(body.mode).toBe("deterministic");
    expect(body.stalledDeals).toEqual([]);
  });
});
