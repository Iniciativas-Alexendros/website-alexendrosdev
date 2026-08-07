import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const findMany = vi.fn();
  const transaction = vi.fn();
  const emailSend = vi.fn();
  return {
    state: {
      prisma: null as null | {
        subscriber: { findMany: typeof findMany };
        $transaction: typeof transaction;
        outboxEvent: { create: ReturnType<typeof vi.fn> };
      },
      resend: null as null | { emails: { send: typeof emailSend } },
    },
    findMany,
    transaction,
    emailSend,
  };
});

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.state.prisma;
  },
}));
vi.mock("@/lib/email", () => ({
  get resend() {
    return mocks.state.resend;
  },
  EMAIL_FROM: "Portfolio <[EMAIL]>",
}));

const { POST } = await import("@/app/api/newsletter/send/route");

const crmHeader = {
  "x-api-key": "test-crm-key",
  "content-type": "application/json",
};

function post(body: unknown, key = "test-crm-key") {
  return POST(
    new Request("http://localhost/api/newsletter/send", {
      method: "POST",
      headers: { ...crmHeader, "x-api-key": key },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function withPrisma() {
  mocks.state.prisma = {
    subscriber: { findMany: mocks.findMany },
    $transaction: mocks.transaction,
    outboxEvent: { create: vi.fn() },
  };
}

beforeEach(() => {
  mocks.state.prisma = null;
  mocks.state.resend = null;
  mocks.findMany.mockReset();
  mocks.transaction.mockReset();
  mocks.emailSend.mockReset();
  mocks.transaction.mockImplementation(async (fn: unknown) => {
    const tx = { outboxEvent: { create: vi.fn().mockResolvedValue({}) } };
    return (fn as (tx: Record<string, unknown>) => Promise<unknown>)(tx);
  });
  process.env.CRM_API_KEY = "test-crm-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("POST /api/newsletter/send (admin)", () => {
  it("responde 401 sin X-API-Key válida", async () => {
    const res = await post({ subject: "H", body: "B" }, "");
    expect(res.status).toBe(401);
  });

  it("responde 422 con payload inválido", async () => {
    withPrisma();
    const res = await post({ subject: "", body: 123 });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { fields?: Record<string, string> };
    expect(body.fields).toHaveProperty("subject");
  });

  it("responde 503 si Resend no está configurado y no es dryRun", async () => {
    withPrisma();
    mocks.findMany.mockResolvedValue([{ email: "[EMAIL]" }]);
    const res = await post({ subject: "H", body: "B" });
    expect(res.status).toBe(503);
  });

  it("dryRun cuenta destinatarios sin enviar", async () => {
    withPrisma();
    mocks.state.resend = { emails: { send: mocks.emailSend } };
    mocks.findMany.mockResolvedValue([{ email: "[EMAIL]" }, { email: "[EMAIL]" }]);
    const res = await post({ subject: "H", body: "B", dryRun: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      ok: true,
      dryRun: true,
      recipients: 2,
    });
    expect(mocks.emailSend).not.toHaveBeenCalled();
  });

  it("200 con 0 destinatarios cuando no hay confirmados", async () => {
    withPrisma();
    mocks.state.resend = { emails: { send: mocks.emailSend } };
    mocks.findMany.mockResolvedValue([]);
    const res = await post({ subject: "H", body: "B", dryRun: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, recipients: 0 });
  });

  it("201 encola emails para cada destinatario vía outbox", async () => {
    withPrisma();
    mocks.state.resend = { emails: { send: mocks.emailSend } };
    mocks.findMany.mockResolvedValue([{ email: "[EMAIL]" }, { email: "[EMAIL]" }]);
    const res = await post({ subject: "Hola", body: "Cuerpo" });
    expect(res.status).toBe(201);
    // Verificar que se encolaron 2 eventos (uno por destinatario)
    const txCalls = mocks.transaction.mock.calls;
    expect(txCalls.length).toBe(1);
    expect(await res.json()).toMatchObject({ ok: true, queued: 2, recipients: 2 });
  });
});
