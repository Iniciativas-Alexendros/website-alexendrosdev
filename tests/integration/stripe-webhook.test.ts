import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const constructEvent = vi.fn();
  const orderUpsert = vi.fn();
  return {
    state: {
      stripe: null as null | { webhooks: { constructEvent: typeof constructEvent } },
      secret: "" as string,
      prisma: null as null | { order: { upsert: typeof orderUpsert } },
    },
    constructEvent,
    orderUpsert,
  };
});

vi.mock("@/lib/stripe", () => ({
  get stripe() {
    return mocks.state.stripe;
  },
  get STRIPE_WEBHOOK_SECRET() {
    return mocks.state.secret;
  },
}));
vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.state.prisma;
  },
}));

const { POST } = await import("@/app/api/stripe/webhook/route");

function post(body: string, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers,
      body,
    }),
  );
}

const completedEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_1",
      payment_status: "paid",
      metadata: { item: "sesion-consultoria" },
      amount_total: 6_000,
      currency: "eur",
      customer_details: { email: "cliente@test.dev" },
    },
  },
};

beforeEach(() => {
  mocks.state.stripe = { webhooks: { constructEvent: mocks.constructEvent } };
  mocks.state.secret = "whsec_test";
  mocks.state.prisma = null;
  mocks.constructEvent.mockReset();
  mocks.orderUpsert.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/stripe/webhook", () => {
  it("acusa recibo sin procesar si falta cliente o secreto (degradación)", async () => {
    mocks.state.stripe = null;
    const res = await post("raw", { "stripe-signature": "sig" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(mocks.constructEvent).not.toHaveBeenCalled();
  });

  it("responde 400 si falta la cabecera de firma", async () => {
    const res = await post("raw", {});
    expect(res.status).toBe(400);
  });

  it("responde 400 si la firma es inválida", async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("firma inválida");
    });
    const res = await post("raw", { "stripe-signature": "mala" });
    expect(res.status).toBe(400);
  });

  it("persiste el pedido en checkout.session.completed con prisma", async () => {
    mocks.constructEvent.mockReturnValue(completedEvent);
    mocks.state.prisma = { order: { upsert: mocks.orderUpsert } };
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(mocks.orderUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeSessionId: "cs_test_1" } }),
    );
  });

  it("acusa recibo sin persistir cuando no hay prisma", async () => {
    mocks.constructEvent.mockReturnValue(completedEvent);
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(200);
    expect(mocks.orderUpsert).not.toHaveBeenCalled();
  });

  it("responde 500 si la persistencia falla (el pago ya se cobró → Stripe debe reintentar)", async () => {
    mocks.constructEvent.mockReturnValue(completedEvent);
    mocks.state.prisma = { order: { upsert: mocks.orderUpsert } };
    mocks.orderUpsert.mockRejectedValue(new Error("db down"));
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(500);
  });
});
