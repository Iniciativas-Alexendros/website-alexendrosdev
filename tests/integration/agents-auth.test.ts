import { describe, expect, it, beforeAll, afterAll, beforeEach, vi } from "vitest";

const reparadorMock = vi.hoisted(() => ({
  runReparador: vi.fn(),
}));

vi.mock("@/lib/agents/reparador", () => ({
  runReparador: reparadorMock.runReparador,
}));

import { POST as repairPOST } from "@/app/api/agents/repair/route";

import { POST as diagnosePOST } from "@/app/api/agents/diagnose/route";
import { POST as auditPOST } from "@/app/api/agents/audit/route";
import { POST as hooksPOST } from "@/app/api/agents/hooks/route";

const validBody = {
  diagnosis: {
    diagnosis: "d",
    hypotheses: [{ cause: "c", confidence: 0.5, evidence: ["e"], suggestedAction: "a" }],
    context: {},
  },
};

// DEFECTO-012 + DEFECTO-013 + DEFECTO-018: las rutas /api/agents/*
// deben usar requireCrmAuth (timingSafeEqual + rate-limit 30/min IP).
// Este test es el que cubre el hueco: fuerza bruta, key ausente, key valida.

const makeReq = (body: unknown, headers: Record<string, string>) =>
  new Request("http://localhost/api/agents/diagnose", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body ?? {}),
  });

const handlers: Record<string, (r: Request) => Promise<Response>> = {
  diagnose: diagnosePOST,
  audit: auditPOST,
  repair: repairPOST,
  hooks: hooksPOST,
};

describe("P0 — Auth de agentes hereda requireCrmAuth (DEFECTO-012)", () => {
  beforeAll(() => {
    process.env.CRM_API_KEY = "test-crm-key";
  });
  afterAll(() => {
    delete process.env.CRM_API_KEY;
  });

  for (const [name, handler] of Object.entries(handlers)) {
    it(`${name}: 401 sin X-API-Key`, async () => {
      const res = await handler(makeReq({}, {}));
      expect(res.status).toBe(401);
    });

    it(`${name}: 401 con key inválida`, async () => {
      const res = await handler(makeReq({}, { "x-api-key": "wrong", "x-real-ip": "10.0.0.5" }));
      expect(res.status).toBe(401);
    });

    it(`${name}: 200 con key válida`, async () => {
      const res = await handler(
        makeReq(
          name === "repair"
            ? { dealId: "x" }
            : { id: "evt_1", type: "checkout.session.async_payment_failed" },
          { "x-api-key": "test-crm-key", "x-real-ip": "10.0.0.6" },
        ),
      );
      // 200 ó 422 (validación de body) — en todo caso NO 401.
      expect([200, 400, 422]).toContain(res.status);
    });
  }

  it("503 si CRM_API_KEY no está configurada", async () => {
    const prev = process.env.CRM_API_KEY;
    delete process.env.CRM_API_KEY;
    try {
      const res = await diagnosePOST(makeReq({}, { "x-api-key": "whatever" }));
      expect(res.status).toBe(503);
    } finally {
      process.env.CRM_API_KEY = prev;
    }
  });
});

describe("P0 — Rate-limit de auth (brute-force) en /api/agents/*", () => {
  const ip = "203.0.113.9";

  beforeEach(() => {
    process.env.CRM_API_KEY = "test-crm-key";
  });
  afterAll(() => {
    delete process.env.CRM_API_KEY;
  });

  it("429 tras 31 intentos con key inválida (ventana 30/min IP)", async () => {
    let last = 200;
    for (let i = 0; i < 31; i++) {
      const res = await diagnosePOST(makeReq({}, { "x-api-key": "wrong", "x-real-ip": ip }));
      last = res.status;
    }
    expect(last).toBe(429);
  });
});

describe("P1 — Repair dry-run por defecto (DEFECTO-013)", () => {
  beforeAll(() => {
    process.env.CRM_API_KEY = "test-crm-key";
  });
  afterAll(() => {
    delete process.env.CRM_API_KEY;
  });

  beforeEach(() => {
    reparadorMock.runReparador.mockReset();
    reparadorMock.runReparador.mockResolvedValue({
      result: { action: "a", status: "skipped", details: "d" },
      action: "a",
      mode: "dry-run",
    });
  });

  it("sin x-apply ni x-dry-run → runReparador(dryRun=true)", async () => {
    await repairPOST(
      makeReq(validBody, {
        "x-api-key": "test-crm-key",
        "x-real-ip": "10.0.0.7",
      }),
    );
    expect(reparadorMock.runReparador).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ dryRun: true }),
    );
  });

  it("con x-dry-run:true → runReparador(dryRun=true)", async () => {
    await repairPOST(
      makeReq(validBody, {
        "x-api-key": "test-crm-key",
        "x-dry-run": "true",
        "x-real-ip": "10.0.0.8",
      }),
    );
    expect(reparadorMock.runReparador).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ dryRun: true }),
    );
  });

  it("con x-apply explícito → runReparador(dryRun=false)", async () => {
    await repairPOST(
      makeReq(validBody, {
        "x-api-key": "test-crm-key",
        "x-apply": "1",
        "x-real-ip": "10.0.0.9",
      }),
    );
    expect(reparadorMock.runReparador).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ dryRun: false }),
    );
  });
});
