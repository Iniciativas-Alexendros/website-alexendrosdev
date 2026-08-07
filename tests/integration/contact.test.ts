import { beforeEach, describe, expect, it, vi } from "vitest";
import { contactoValido } from "../fixtures/content";

const mocks = vi.hoisted(() => {
  const leadCreate = vi.fn();
  const emailSend = vi.fn();
  const transaction = vi.fn();
  return {
    state: {
      prisma: null as null | {
        lead: { create: typeof leadCreate };
        $transaction: typeof transaction;
        outboxEvent: { create: ReturnType<typeof vi.fn> };
      },
      resend: null as null | { emails: { send: typeof emailSend } },
    },
    leadCreate,
    emailSend,
    transaction,
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
  EMAIL_FROM: "Portfolio <test@from.dev>",
  CONTACT_TO: "destino@test.dev",
}));

const { POST } = await import("@/app/api/contact/route");

function post(body: unknown, ip: string) {
  return POST(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function withPrisma() {
  mocks.state.prisma = {
    lead: { create: mocks.leadCreate },
    $transaction: mocks.transaction,
    outboxEvent: { create: vi.fn() },
  };
}

beforeEach(() => {
  mocks.state.prisma = null;
  mocks.state.resend = null;
  mocks.leadCreate.mockReset();
  mocks.emailSend.mockReset();
  mocks.transaction.mockReset();
  mocks.transaction.mockImplementation(async (fn: unknown) => {
    const tx = {
      lead: { create: mocks.leadCreate },
      outboxEvent: { create: vi.fn().mockResolvedValue({}) },
    };
    return (fn as (tx: Record<string, unknown>) => Promise<unknown>)(tx);
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/contact", () => {
  it("responde 200 y degrada sin prisma ni resend", async () => {
    const res = await post(contactoValido, "10.1.0.1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.leadCreate).not.toHaveBeenCalled();
  });

  it("persiste el lead y encola email vía outbox cuando hay prisma", async () => {
    withPrisma();
    mocks.state.resend = { emails: { send: mocks.emailSend } };
    const res = await post(contactoValido, "10.1.0.2");
    expect(res.status).toBe(200);
    expect(mocks.leadCreate).toHaveBeenCalledOnce();
    expect(mocks.transaction).toHaveBeenCalledOnce();
    // El email NO se envía directamente (se encola en outbox)
    expect(mocks.emailSend).not.toHaveBeenCalled();
  });

  it("captura los parámetros UTM en el lead", async () => {
    withPrisma();
    await post({ ...contactoValido, utmSource: "newsletter" }, "10.1.0.3");
    expect(mocks.leadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ utmSource: "newsletter" }),
      }),
    );
  });

  it("responde 400 ante un cuerpo JSON inválido", async () => {
    const res = await post("{ no es json", "10.1.0.4");
    expect(res.status).toBe(400);
  });

  it("responde 422 con fields ante datos inválidos", async () => {
    const res = await post({ ...contactoValido, email: "no-es-email" }, "10.1.0.5");
    expect(res.status).toBe(422);
    const body = (await res.json()) as { fields?: Record<string, string> };
    expect(body.fields).toHaveProperty("email");
  });

  it("rechaza con 422 cuando el honeypot viene relleno", async () => {
    const res = await post({ ...contactoValido, website: "http://spam" }, "10.1.0.6");
    expect(res.status).toBe(422);
  });

  it("responde 502 cuando falla la transacción (lead no persistido)", async () => {
    withPrisma();
    mocks.transaction.mockRejectedValue(new Error("db down"));
    const res = await post(contactoValido, "10.1.0.50");
    expect(res.status).toBe(502);
  });

  it("responde 200 si la transacción succeede", async () => {
    withPrisma();
    const res = await post(contactoValido, "10.1.0.51");
    expect(res.status).toBe(200);
  });

  it("bloqueo legal: rechaza 422 un envío sin consentimiento (GDPR)", async () => {
    const res = await post({ ...contactoValido, consent: false }, "[IP_ADDRESS]");
    expect(res.status).toBe(422);
    const body = (await res.json()) as { fields?: Record<string, string> };
    expect(body.fields).toHaveProperty("consent");
    expect(mocks.leadCreate).not.toHaveBeenCalled();
  });

  it("bloqueo legal: rechaza 422 si falta el campo consent", async () => {
    const sinConsent = { ...contactoValido };
    delete (sinConsent as { consent?: boolean }).consent;
    const res = await post(sinConsent, "[IP_ADDRESS]");
    expect(res.status).toBe(422);
  });

  it("responde 429 al superar el límite por IP", async () => {
    const ip = "10.1.0.99";
    for (let i = 0; i < 5; i++) {
      const r = await post(contactoValido, ip);
      expect(r.status).toBe(200);
    }
    const blocked = await post(contactoValido, ip);
    expect(blocked.status).toBe(429);
  });
});
