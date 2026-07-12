import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const findMany = vi.fn();
  const emailSend = vi.fn();
  return {
    state: {
      prisma: null as null | { subscriber: { findMany: typeof findMany } },
      resend: null as null | { emails: { send: typeof emailSend } },
    },
    findMany,
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

beforeEach(() => {
  mocks.state.prisma = null;
  mocks.state.resend = null;
  mocks.findMany.mockReset();
  mocks.emailSend.mockReset();
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
    mocks.state.prisma = { subscriber: { findMany: mocks.findMany } };
    const res = await post({ subject: "", body: 123 });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { fields?: Record<string, string> };
    expect(body.fields).toHaveProperty("subject");
  });

  it("responde 503 si Resend no está configurado y no es dryRun", async () => {
    mocks.state.prisma = { subscriber: { findMany: mocks.findMany } };
    mocks.findMany.mockResolvedValue([{ email: "[EMAIL]" }]);
    const res = await post({ subject: "H", body: "B" });
    expect(res.status).toBe(503);
  });

  it("dryRun cuenta destinatarios sin enviar", async () => {
    mocks.state.prisma = { subscriber: { findMany: mocks.findMany } };
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
    mocks.state.prisma = { subscriber: { findMany: mocks.findMany } };
    mocks.state.resend = { emails: { send: mocks.emailSend } };
    mocks.findMany.mockResolvedValue([]);
    const res = await post({ subject: "H", body: "B", dryRun: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, recipients: 0 });
  });

  it("201 enviando a cada destinatario confirmado vía Resend", async () => {
    mocks.state.prisma = { subscriber: { findMany: mocks.findMany } };
    mocks.state.resend = { emails: { send: mocks.emailSend } };
    mocks.findMany.mockResolvedValue([{ email: "[EMAIL]" }, { email: "[EMAIL]" }]);
    mocks.emailSend.mockResolvedValue({ id: "msg_1" });
    const res = await post({ subject: "Hola", body: "Cuerpo" });
    expect(res.status).toBe(201);
    expect(mocks.emailSend).toHaveBeenCalledTimes(2);
    const firstCall = mocks.emailSend.mock.calls[0]![0];
    expect(firstCall.subject).toBe("Hola");
    expect(firstCall.to).toBe("[EMAIL]");
    expect(await res.json()).toMatchObject({ ok: true, sent: 2, recipients: 2 });
  });
});
