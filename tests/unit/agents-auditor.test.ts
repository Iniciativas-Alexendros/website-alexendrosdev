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
    perModelTimeoutMs: 1000,
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

import { eventClassificationSchema } from "@/lib/agents/schemas";
import {
  classifyStripeEvent,
  recordAndCheckAnomaly,
  findStalledDeals,
  runAudit,
  processHookEvent,
  _resetFailureWindow,
} from "@/lib/agents/auditor";

beforeEach(() => {
  mocks.fetchMock.mockReset();
  mocks.generateContent.mockReset();
  mocks.state.geminiKey = "";
  mocks.state.zenKey = "";
  _resetFailureWindow();
});

describe("auditor: classifyStripeEvent (modo determinista)", () => {
  it("T6.1: payment_intent.succeeded -> payment_success / info", async () => {
    const { classification, mode } = await classifyStripeEvent({
      type: "payment_intent.succeeded",
      data: { object: { amount: 6000, currency: "eur" } },
    });
    expect(classification.type).toBe("payment_success");
    expect(classification.severity).toBe("info");
    expect(classification.requiresAction).toBe(false);
    expect(mode).toBe("deterministic");
  });

  it("T6.2: payment_intent.payment_failed -> payment_failed / critical", async () => {
    const { classification } = await classifyStripeEvent({
      type: "payment_intent.payment_failed",
      data: { object: { last_payment_error: { message: "card_declined" } } },
    });
    expect(classification.type).toBe("payment_failed");
    expect(classification.severity).toBe("critical");
    expect(classification.requiresAction).toBe(true);
    expect(classification.summary).toContain("card_declined");
  });

  it("T6.3: customer.subscription.deleted -> subscription_cancelled / warning", async () => {
    const { classification } = await classifyStripeEvent({
      type: "customer.subscription.deleted",
    });
    expect(classification.type).toBe("subscription_cancelled");
    expect(classification.severity).toBe("warning");
  });

  it("T6.4: evento desconocido -> unknown / info", async () => {
    const { classification } = await classifyStripeEvent({
      type: "invoice.upcoming",
    });
    expect(classification.type).toBe("unknown");
    expect(classification.severity).toBe("info");
  });
});

describe("auditor: recordAndCheckAnomaly", () => {
  it("T6.5: un solo fallo no genera anomalia", () => {
    const { isAnomaly, failureCount } = recordAndCheckAnomaly({
      type: "payment_intent.payment_failed",
    });
    expect(isAnomaly).toBe(false);
    expect(failureCount).toBe(1);
  });

  it("T6.6: 3 fallos en ventana de 5min disparan anomalia", () => {
    recordAndCheckAnomaly({
      type: "payment_intent.payment_failed",
      id: "evt_1",
    });
    recordAndCheckAnomaly({
      type: "payment_intent.payment_failed",
      id: "evt_2",
    });
    const { isAnomaly, failureCount } = recordAndCheckAnomaly({
      type: "payment_intent.payment_failed",
      id: "evt_3",
    });
    expect(failureCount).toBe(3);
    expect(isAnomaly).toBe(true);
  });

  it("T6.7: eventos exitosos no incrementan el contador", () => {
    recordAndCheckAnomaly({ type: "payment_intent.succeeded" });
    recordAndCheckAnomaly({ type: "payment_intent.succeeded" });
    const { failureCount } = recordAndCheckAnomaly({
      type: "checkout.session.completed",
    });
    expect(failureCount).toBe(0);
  });
});

describe("auditor: findStalledDeals", () => {
  it("T6.8: detecta deal estancado >7 dias", async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const stalled = await findStalledDeals(() =>
      Promise.resolve([
        {
          id: "d1",
          title: "Stalled deal",
          value: 1000,
          currency: "eur",
          probability: 50,
          stageId: "s1",
          contactId: null,
          updatedAt: tenDaysAgo,
        },
        {
          id: "d2",
          title: "Fresh deal",
          value: 2000,
          currency: "eur",
          probability: 30,
          stageId: "s1",
          contactId: null,
          updatedAt: twoDaysAgo,
        },
      ]),
    );
    expect(stalled).toHaveLength(1);
    expect(stalled[0]?.id).toBe("d1");
    expect(stalled[0]?.daysSinceUpdate).toBeGreaterThanOrEqual(10);
  });

  it("T6.9: fetchDeals=null (sin CRM) -> lista vacia", async () => {
    const stalled = await findStalledDeals(() => Promise.resolve(null));
    expect(stalled).toEqual([]);
  });
});

describe("auditor: runAudit (modo determinista)", () => {
  it("T6.10: reporta anomalias y deals estancados", async () => {
    recordAndCheckAnomaly({
      type: "payment_intent.payment_failed",
      id: "evt_1",
    });
    recordAndCheckAnomaly({
      type: "payment_intent.payment_failed",
      id: "evt_2",
    });
    recordAndCheckAnomaly({
      type: "payment_intent.payment_failed",
      id: "evt_3",
    });

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const report = await runAudit({
      fetchDeals: () =>
        Promise.resolve([
          {
            id: "d1",
            title: "Stalled",
            value: 1,
            currency: "eur",
            probability: 50,
            stageId: "s1",
            contactId: null,
            updatedAt: tenDaysAgo,
          },
        ]),
    });

    expect(
      report.anomalies.some((a) => a.type === "checkout_failures" && a.severity === "critical"),
    ).toBe(true);
    expect(report.anomalies.some((a) => a.type === "stalled_deals")).toBe(true);
    expect(report.stalledDeals).toHaveLength(1);
    expect(report.mode).toBe("deterministic");
  });
});

describe("auditor: processHookEvent (integracion)", () => {
  it("T6.11: procesa evento de pago fallido y actualiza ventana de anomalias", async () => {
    const result = await processHookEvent({
      type: "payment_intent.payment_failed",
      id: "evt_x",
    });
    expect(result.classification.type).toBe("payment_failed");
    expect(result.failureCount).toBe(1);
    expect(result.isAnomaly).toBe(false);
  });
});

// ─── Seguridad: integridad de capas ──────────────────────────────────────────
//
// Verifica que el output del Auditor (EventClassification) NO contiene
// campos que permitan ejecutar acciones de escritura en el CRM. Solo texto.

describe("auditor: integridad de capas — sin write fields en output", () => {
  const validInput = {
    type: "payment_failed" as const,
    severity: "critical" as const,
    summary: "Pago fallido: card_declined.",
    requiresAction: true,
  };

  it("S4: schema no expone endpoint/action/payload", () => {
    const shape = eventClassificationSchema.shape as Record<string, unknown>;
    const keys = Object.keys(shape);
    expect(keys).not.toContain("endpoint");
    expect(keys).not.toContain("action");
    expect(keys).not.toContain("payload");
    expect(keys).not.toContain("method");
    expect(keys).not.toContain("url");
    // Solo debe tener type, severity, summary, requiresAction (orden no importa)
    expect([...keys].sort()).toEqual(["type", "severity", "summary", "requiresAction"]);
  });

  it("S5: extra fields con nombres peligrosos son strippeados por Zod", () => {
    const malicious = {
      ...validInput,
      endpoint: "DELETE /api/crm/contacts",
      action: "drop_database",
      payload: { sql: "DROP TABLE deals" },
    };
    const parsed = eventClassificationSchema.parse(malicious);
    expect(parsed).not.toHaveProperty("endpoint");
    expect(parsed).not.toHaveProperty("action");
    expect(parsed).not.toHaveProperty("payload");
    // Los campos válidos se preservan
    expect(parsed.type).toBe("payment_failed");
    expect(parsed.severity).toBe("critical");
    expect(parsed.requiresAction).toBe(true);
  });

  it("S6: LLM que devuelve endpoint malicioso -> strippeado por Zod antes del caller", async () => {
    mocks.state.geminiKey = "AIza-test";
    mocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        ...validInput,
        endpoint: "DELETE /api/crm/deals/all",
        action: "malicious_delete",
      }),
    });
    const { classification } = await classifyStripeEvent({
      type: "payment_intent.payment_failed",
      data: { object: { last_payment_error: { message: "card_declined" } } },
    });
    expect(classification).not.toHaveProperty("endpoint");
    expect(classification).not.toHaveProperty("action");
    expect(classification).not.toHaveProperty("payload");
    expect(classification.type).toBe("payment_failed");
    expect(classification.severity).toBe("critical");
    expect(classification.requiresAction).toBe(true);
  });
});
