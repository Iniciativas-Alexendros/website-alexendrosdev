import { beforeEach, describe, expect, it } from "vitest";
import { GET as healthGET } from "@/app/api/agents/health/route";

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENCODE_ZEN_API_KEY;
  delete process.env.CRM_API_KEY;
});

describe("GET /api/agents/health", () => {
  it("T10.1: devuelve status='degraded' sin ninguna key", async () => {
    const res = await healthGET();
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.llm.any).toBe(false);
    expect(body.checks.gemini.ok).toBe(false);
    expect(body.checks.opencodeZen.ok).toBe(false);
    expect(body.checks.crm.ok).toBe(false);
  });

  it("T10.2: devuelve status='limited' con solo LLM (sin CRM)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const res = await healthGET();
    const body = await res.json();
    expect(body.status).toBe("limited");
    expect(body.llm.gemini).toBe(true);
    expect(body.checks.gemini.ok).toBe(true);
    expect(body.checks.crm.ok).toBe(false);
  });

  it("T10.3: devuelve status='ok' con Gemini + CRM", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.CRM_API_KEY = "test-key";
    const res = await healthGET();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.llm.gemini).toBe(true);
    expect(body.checks.crm.ok).toBe(true);
  });

  it("T10.4: timestamp en ISO 8601", async () => {
    const res = await healthGET();
    const body = await res.json();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("T10.5: no requiere auth (es health check)", async () => {
    const res = await healthGET();
    expect(res.status).toBe(200);
  });
});
