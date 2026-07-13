import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const constructEvent = vi.fn();
  const orderUpsert = vi.fn();
  const invoiceUpsert = vi.fn();
  const subscriptionUpsert = vi.fn();
  const subscriptionUpdate = vi.fn();
  const subscriptionFindUnique = vi.fn();
  const dealUpdate = vi.fn();
  const dealFindFirst = vi.fn();
  const activityCreate = vi.fn();
  const activityFindFirst = vi.fn();
  const taskCreate = vi.fn();
  const taskFindFirst = vi.fn();
  const pipelineStageFindFirst = vi.fn();
  return {
    state: {
      stripe: null as null | { webhooks: { constructEvent: typeof constructEvent } },
      secret: "" as string,
      prisma: null as null | {
        order: { upsert: typeof orderUpsert };
        invoice: { upsert: typeof invoiceUpsert };
        subscription: {
          upsert: typeof subscriptionUpsert;
          update: typeof subscriptionUpdate;
          findUnique: typeof subscriptionFindUnique;
        };
        deal: { update: typeof dealUpdate; findFirst: typeof dealFindFirst };
        activity: { create: typeof activityCreate; findFirst: typeof activityFindFirst };
        task: { create: typeof taskCreate; findFirst: typeof taskFindFirst };
        pipelineStage: { findFirst: typeof pipelineStageFindFirst };
      },
    },
    constructEvent,
    orderUpsert,
    invoiceUpsert,
    subscriptionUpsert,
    subscriptionUpdate,
    subscriptionFindUnique,
    dealUpdate,
    dealFindFirst,
    activityCreate,
    activityFindFirst,
    taskCreate,
    taskFindFirst,
    pipelineStageFindFirst,
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

function buildPrisma() {
  return {
    order: { upsert: mocks.orderUpsert },
    invoice: { upsert: mocks.invoiceUpsert },
    subscription: {
      upsert: mocks.subscriptionUpsert,
      update: mocks.subscriptionUpdate,
      findUnique: mocks.subscriptionFindUnique,
    },
    deal: { update: mocks.dealUpdate, findFirst: mocks.dealFindFirst },
    activity: { create: mocks.activityCreate, findFirst: mocks.activityFindFirst },
    task: { create: mocks.taskCreate, findFirst: mocks.taskFindFirst },
    pipelineStage: { findFirst: mocks.pipelineStageFindFirst },
  };
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

const completedWithDealEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_deal",
      payment_status: "paid",
      metadata: { item: "retainer-pro", dealId: "deal-uuid-123" },
      amount_total: 129_000,
      currency: "eur",
      customer_details: { email: "cliente@test.dev" },
    },
  },
};

const invoicePaidEvent = {
  id: "evt_invoice_456",
  type: "invoice.paid",
  data: {
    object: {
      id: "in_stripe_123",
      amount_paid: 129000,
      currency: "eur",
      subscription: "sub_stripe_123",
    },
  },
};

const subscriptionUpdatedEvent = {
  type: "customer.subscription.updated",
  data: {
    object: {
      id: "sub_stripe_123",
      customer: "cus_stripe_123",
      status: "active",
      current_period_start: 1720000000,
      current_period_end: 1722592000,
      canceled_at: null,
      metadata: {},
    },
  },
};

const subscriptionDeletedEvent = {
  id: "evt_sub_789",
  type: "customer.subscription.deleted",
  data: {
    object: {
      id: "sub_stripe_123",
      customer: "cus_stripe_123",
      status: "canceled",
      current_period_start: 1720000000,
      current_period_end: 1722592000,
      canceled_at: 1722000000,
      metadata: {},
    },
  },
};

beforeEach(() => {
  mocks.state.stripe = { webhooks: { constructEvent: mocks.constructEvent } };
  mocks.state.secret = "whsec_test";
  mocks.state.prisma = null;
  mocks.constructEvent.mockReset();
  mocks.orderUpsert.mockReset();
  mocks.invoiceUpsert.mockReset();
  mocks.subscriptionUpsert.mockReset();
  mocks.subscriptionUpdate.mockReset();
  mocks.subscriptionFindUnique.mockReset();
  mocks.dealUpdate.mockReset();
  mocks.dealFindFirst.mockReset();
  mocks.activityCreate.mockReset();
  mocks.activityFindFirst.mockReset();
  mocks.taskCreate.mockReset();
  mocks.taskFindFirst.mockReset();
  mocks.pipelineStageFindFirst.mockReset();
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
    mocks.state.prisma = buildPrisma();
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

  it("responde 500 si la persistencia falla", async () => {
    mocks.constructEvent.mockReturnValue(completedEvent);
    mocks.state.prisma = buildPrisma();
    mocks.orderUpsert.mockRejectedValue(new Error("db down"));
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(500);
  });

  // ─── F14 — Nuevos tests webhook ampliado ─────────────────────────

  it("T4.1: invoice.paid → upsert Invoice CRM con stripeInvoiceId", async () => {
    mocks.constructEvent.mockReturnValue(invoicePaidEvent);
    mocks.state.prisma = buildPrisma();
    mocks.subscriptionFindUnique.mockResolvedValue({ contactId: "contact-1" });
    mocks.dealFindFirst.mockResolvedValue({ id: "deal-1" });
    mocks.activityFindFirst.mockResolvedValue(null);
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(200);
    expect(mocks.invoiceUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeInvoiceId: "in_stripe_123" },
      }),
    );
    expect(mocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "NOTE",
          title: expect.stringContaining("Factura Stripe pagada"),
        }),
      }),
    );
  });

  it("T4.2: customer.subscription.updated → upsert Subscription", async () => {
    mocks.constructEvent.mockReturnValue(subscriptionUpdatedEvent);
    mocks.state.prisma = buildPrisma();
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(200);
    expect(mocks.subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: "sub_stripe_123" },
      }),
    );
  });

  it("T4.3: customer.subscription.deleted → subscription.cancelled + task.create", async () => {
    mocks.constructEvent.mockReturnValue(subscriptionDeletedEvent);
    mocks.state.prisma = buildPrisma();
    mocks.subscriptionUpsert.mockResolvedValue({ contactId: "contact-1" });
    mocks.taskFindFirst.mockResolvedValue(null);
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(200);
    expect(mocks.subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: "sub_stripe_123" },
        update: expect.objectContaining({ status: "canceled" }),
      }),
    );
    expect(mocks.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: expect.stringContaining("cancelación"),
          priority: "HIGH",
        }),
      }),
    );
  });

  it("T4.4: checkout.session.completed con dealId → deal.update stage Cerrado ganado", async () => {
    mocks.constructEvent.mockReturnValue(completedWithDealEvent);
    mocks.state.prisma = buildPrisma();
    mocks.pipelineStageFindFirst.mockResolvedValue({
      id: "stage-cerrado-ganado",
      order: 5,
    });
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(200);
    expect(mocks.dealUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "deal-uuid-123" },
        data: expect.objectContaining({
          stageId: "stage-cerrado-ganado",
          probability: 100,
        }),
      }),
    );
    expect(mocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "NOTE",
          title: expect.stringContaining("cerrado ganado"),
          dealId: "deal-uuid-123",
        }),
      }),
    );
  });

  it("T4.5: sin prisma → 200 warn (no falla)", async () => {
    mocks.constructEvent.mockReturnValue(invoicePaidEvent);
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(200);
    expect(mocks.invoiceUpsert).not.toHaveBeenCalled();
    expect(mocks.subscriptionUpsert).not.toHaveBeenCalled();
  });

  it("T4.6: persistencia falla → 500", async () => {
    mocks.constructEvent.mockReturnValue(invoicePaidEvent);
    mocks.state.prisma = buildPrisma();
    mocks.invoiceUpsert.mockRejectedValue(new Error("db down"));
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(500);
  });

  it("responde 500 si subscription.updated falla al persistir", async () => {
    mocks.constructEvent.mockReturnValue(subscriptionUpdatedEvent);
    mocks.state.prisma = buildPrisma();
    mocks.subscriptionUpsert.mockRejectedValue(new Error("db down"));
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(500);
  });

  it("responde 500 si subscription.deleted falla al actualizar la subscription", async () => {
    mocks.constructEvent.mockReturnValue(subscriptionDeletedEvent);
    mocks.state.prisma = buildPrisma();
    mocks.subscriptionUpsert.mockRejectedValue(new Error("db down"));
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(500);
  });

  it("responde 500 si subscription.deleted falla al crear la task de cancelación", async () => {
    mocks.constructEvent.mockReturnValue(subscriptionDeletedEvent);
    mocks.state.prisma = buildPrisma();
    mocks.subscriptionUpsert.mockResolvedValue({ contactId: "contact-1" });
    mocks.taskFindFirst.mockResolvedValue(null);
    mocks.taskCreate.mockRejectedValue(new Error("db down"));
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(500);
  });

  it("responde 500 si checkout con dealId falla al buscar pipelineStage", async () => {
    mocks.constructEvent.mockReturnValue(completedWithDealEvent);
    mocks.state.prisma = buildPrisma();
    mocks.pipelineStageFindFirst.mockRejectedValue(new Error("db down"));
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(500);
  });

  it("responde 500 si checkout con dealId falla al actualizar el deal", async () => {
    mocks.constructEvent.mockReturnValue(completedWithDealEvent);
    mocks.state.prisma = buildPrisma();
    mocks.pipelineStageFindFirst.mockResolvedValue({
      id: "stage-cerrado-ganado",
      order: 5,
    });
    mocks.dealUpdate.mockRejectedValue(new Error("db down"));
    const res = await post("raw", { "stripe-signature": "buena" });
    expect(res.status).toBe(500);
  });
});
