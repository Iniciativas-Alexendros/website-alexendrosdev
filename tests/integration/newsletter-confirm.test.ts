import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const findUnique = vi.fn();
  const update = vi.fn();
  const emailSend = vi.fn();
  return {
    state: {
      prisma: null as null | {
        subscriber: { findUnique: typeof findUnique; update: typeof update };
      },
      resend: null as null | { emails: { send: typeof emailSend } },
    },
    findUnique,
    update,
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

const { GET } = await import("@/app/api/newsletter/confirm/route");

function get(token?: string) {
  const url = token
    ? `http://localhost/api/newsletter/confirm?token=${token}`
    : "http://localhost/api/newsletter/confirm";
  return GET(new NextRequest(url));
}

const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);

beforeEach(() => {
  mocks.state.prisma = {
    subscriber: { findUnique: mocks.findUnique, update: mocks.update },
  };
  mocks.state.resend = { emails: { send: mocks.emailSend } };
  mocks.findUnique.mockReset();
  mocks.update.mockReset();
  mocks.emailSend.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/newsletter/confirm", () => {
  it("confirma con token válido, consume el token y redirige a la página de éxito", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "s1",
      email: "ok@dev.test",
      tokenExpiresAt: future(),
    });
    mocks.update.mockResolvedValue({});
    const res = await get("validtoken");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/newsletter/confirmado");
    expect(res.headers.get("location")).not.toContain("error");
    const arg = mocks.update.mock.calls[0]![0];
    expect(arg.data).toMatchObject({ confirmed: true, token: null });
    expect(mocks.emailSend).toHaveBeenCalledOnce(); // bienvenida
  });

  it("redirige a error si el token no existe", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const res = await get("desconocido");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=1");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("redirige a error si el token está caducado", async () => {
    mocks.findUnique.mockResolvedValue({ id: "s1", email: "x@dev.test", tokenExpiresAt: past() });
    const res = await get("caducado");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=1");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("redirige a error si falta el token", async () => {
    const res = await get();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=1");
  });
});
