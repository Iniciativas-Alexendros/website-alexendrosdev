import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const subscriberUpsert = vi.fn();
  const emailSend = vi.fn();
  return {
    state: {
      prisma: null as null | { subscriber: { upsert: typeof subscriberUpsert } },
      resend: null as null | { emails: { send: typeof emailSend } },
    },
    subscriberUpsert,
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
  EMAIL_FROM: "Portfolio <test@from.dev>",
}));

const { POST } = await import("@/app/api/newsletter/route");

function post(body: unknown, ip: string) {
  return POST(
    new Request("http://localhost/api/newsletter", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  mocks.state.prisma = null;
  mocks.state.resend = null;
  mocks.subscriberUpsert.mockReset();
  mocks.emailSend.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/newsletter", () => {
  it("responde 200 y degrada sin prisma ni resend", async () => {
    const res = await post({ email: "nuevo@suscriptor.dev" }, "10.2.0.1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("hace upsert idempotente y envía email de bienvenida con clientes", async () => {
    mocks.state.prisma = { subscriber: { upsert: mocks.subscriberUpsert } };
    mocks.state.resend = { emails: { send: mocks.emailSend } };
    const res = await post({ email: "nuevo@suscriptor.dev" }, "10.2.0.2");
    expect(res.status).toBe(200);
    expect(mocks.subscriberUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "nuevo@suscriptor.dev" } }),
    );
    expect(mocks.emailSend).toHaveBeenCalledOnce();
  });

  it("responde 400 ante JSON inválido", async () => {
    const res = await post("{", "10.2.0.3");
    expect(res.status).toBe(400);
  });

  it("responde 422 ante email inválido", async () => {
    const res = await post({ email: "x" }, "10.2.0.4");
    expect(res.status).toBe(422);
    const body = (await res.json()) as { fields?: Record<string, string> };
    expect(body.fields).toHaveProperty("email");
  });

  it("rechaza con 422 cuando el honeypot viene relleno", async () => {
    const res = await post({ email: "a@b.com", website: "bot" }, "10.2.0.5");
    expect(res.status).toBe(422);
  });

  it("responde 502 cuando todos los canales configurados fallan", async () => {
    mocks.state.prisma = { subscriber: { upsert: mocks.subscriberUpsert } };
    mocks.state.resend = { emails: { send: mocks.emailSend } };
    mocks.subscriberUpsert.mockRejectedValue(new Error("db down"));
    mocks.emailSend.mockRejectedValue(new Error("resend down"));
    const res = await post({ email: "a@b.com" }, "10.2.0.50");
    expect(res.status).toBe(502);
  });

  it("responde 429 al superar el límite por IP", async () => {
    const ip = "10.2.0.99";
    for (let i = 0; i < 5; i++) {
      const r = await post({ email: "a@b.com" }, ip);
      expect(r.status).toBe(200);
    }
    expect((await post({ email: "a@b.com" }, ip)).status).toBe(429);
  });
});
