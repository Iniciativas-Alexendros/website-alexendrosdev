import { beforeEach, describe, expect, it, vi } from "vitest";

// Double opt-in: el POST deja al suscriptor en estado pendiente con un token y
// envía un email de CONFIRMACIÓN (no la bienvenida). La respuesta de éxito es
// siempre genérica (anti-enumeración).
const mocks = vi.hoisted(() => {
  const findUnique = vi.fn();
  const upsert = vi.fn();
  const emailSend = vi.fn();
  return {
    state: {
      prisma: null as null | {
        subscriber: { findUnique: typeof findUnique; upsert: typeof upsert };
      },
      resend: null as null | { emails: { send: typeof emailSend } },
    },
    findUnique,
    upsert,
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
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
        origin: "http://localhost",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function withClients() {
  mocks.state.prisma = {
    subscriber: { findUnique: mocks.findUnique, upsert: mocks.upsert },
  };
  mocks.state.resend = { emails: { send: mocks.emailSend } };
}

beforeEach(() => {
  mocks.state.prisma = null;
  mocks.state.resend = null;
  mocks.findUnique.mockReset();
  mocks.upsert.mockReset();
  mocks.emailSend.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/newsletter (double opt-in)", () => {
  it("degrada a 200 genérico sin DATABASE_URL (no se puede iniciar el flujo)", async () => {
    const res = await post({ email: "nuevo@suscriptor.dev" }, "10.2.0.1");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("deja al suscriptor pendiente con token y envía email de confirmación (no bienvenida)", async () => {
    withClients();
    mocks.findUnique.mockResolvedValue(null);
    const res = await post({ email: "nuevo@suscriptor.dev" }, "10.2.0.2");
    expect(res.status).toBe(200);
    // upsert con token, expiración y confirmed:false
    const arg = mocks.upsert.mock.calls[0]![0];
    expect(arg.where).toEqual({ email: "nuevo@suscriptor.dev" });
    expect(arg.create.token).toEqual(expect.any(String));
    expect(arg.create.tokenExpiresAt).toBeInstanceOf(Date);
    expect(arg.update.confirmed).toBe(false);
    // email de CONFIRMACIÓN, no de bienvenida
    expect(mocks.emailSend).toHaveBeenCalledOnce();
    expect(mocks.emailSend.mock.calls[0]![0].subject).toMatch(/[Cc]onfirma/);
  });

  it("no reenvía ni revela nada si el email ya está confirmado", async () => {
    withClients();
    mocks.findUnique.mockResolvedValue({ id: "s1", email: "ya@confirmado.dev", confirmed: true });
    const res = await post({ email: "ya@confirmado.dev" }, "10.2.0.3");
    expect(res.status).toBe(200);
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.emailSend).not.toHaveBeenCalled();
  });

  it("responde 502 si falla la consulta del suscriptor", async () => {
    withClients();
    mocks.findUnique.mockRejectedValue(new Error("db down"));
    const res = await post({ email: "a@b.com" }, "10.2.0.4");
    expect(res.status).toBe(502);
  });

  it("responde 502 si falla la persistencia del pendiente", async () => {
    withClients();
    mocks.findUnique.mockResolvedValue(null);
    mocks.upsert.mockRejectedValue(new Error("db down"));
    const res = await post({ email: "a@b.com" }, "10.2.0.5");
    expect(res.status).toBe(502);
  });

  it("responde 502 si no se puede enviar el email de confirmación", async () => {
    withClients();
    mocks.findUnique.mockResolvedValue(null);
    mocks.upsert.mockResolvedValue({});
    mocks.emailSend.mockRejectedValue(new Error("resend down"));
    const res = await post({ email: "a@b.com" }, "10.2.0.6");
    expect(res.status).toBe(502);
  });

  it("responde 400 ante JSON inválido", async () => {
    const res = await post("{", "10.2.0.7");
    expect(res.status).toBe(400);
  });

  it("responde 422 ante email inválido", async () => {
    const res = await post({ email: "x" }, "10.2.0.8");
    expect(res.status).toBe(422);
    const body = (await res.json()) as { fields?: Record<string, string> };
    expect(body.fields).toHaveProperty("email");
  });

  it("rechaza con 422 cuando el honeypot viene relleno", async () => {
    const res = await post({ email: "a@b.com", website: "bot" }, "10.2.0.9");
    expect(res.status).toBe(422);
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
