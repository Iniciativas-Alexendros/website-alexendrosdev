import { beforeEach, describe, expect, it, vi } from "vitest";

// Solo se mockea el cliente Stripe (y BASE_URL). `getPurchasable` es el catálogo
// REAL: así se verifica que el precio es fuente de verdad del servidor.
type StripeMock = {
  checkout: { sessions: { create: ReturnType<typeof vi.fn> } };
  paymentLinks?: { create: ReturnType<typeof vi.fn> };
};

const mocks = vi.hoisted(() => ({
  state: {
    stripe: null as null | StripeMock,
    transfer: {
      iban: "",
      beneficiary: "",
      bank: "",
      configured: false,
    },
    prisma: null as null | {
      invoice: { create: ReturnType<typeof vi.fn> };
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  get stripe() {
    return mocks.state.stripe;
  },
  BASE_URL: "https://alexendros.dev",
  get TRANSFER_IBAN() {
    return mocks.state.transfer.iban;
  },
  get TRANSFER_BENEFICIARY() {
    return mocks.state.transfer.beneficiary;
  },
  get TRANSFER_BANK() {
    return mocks.state.transfer.bank;
  },
  hasTransferConfig() {
    return mocks.state.transfer.configured;
  },
}));

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.state.prisma;
  },
}));

vi.mock("@/lib/crm/invoice-number", () => ({
  generateInvoiceNumberAsync: vi.fn(async () => "INV-2026-001"),
}));

const { POST } = await import("@/app/api/checkout/route");

function post(body: unknown, ip: string) {
  return POST(
    new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
        origin: "https://alexendros.dev",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  mocks.state.stripe = null;
  mocks.state.transfer = {
    iban: "",
    beneficiary: "",
    bank: "",
    configured: false,
  };
  mocks.state.prisma = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/checkout", () => {
  it("crea la sesión y devuelve la URL de Stripe", async () => {
    const create = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.test/c/abc" });
    mocks.state.stripe = { checkout: { sessions: { create } } };
    const res = await post({ item: "sesion-consultoria" }, "10.3.0.1");
    expect(res.status).toBe(200);
    expect((await res.json()).url).toBe("https://checkout.stripe.test/c/abc");
  });

  it("usa el precio del catálogo e ignora cualquier importe del cliente", async () => {
    const create = vi.fn().mockResolvedValue({ url: "https://x" });
    mocks.state.stripe = { checkout: { sessions: { create } } };
    // El cliente intenta colar amount: 1; el servidor usa 6000 (sesion-consultoria).
    await post({ item: "sesion-consultoria", amount: 1 }, "10.3.0.2");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 6_000 }),
          }),
        ],
      }),
    );
  });

  it("responde 422 cuando el item no existe en el catálogo", async () => {
    mocks.state.stripe = { checkout: { sessions: { create: vi.fn() } } };
    const res = await post({ item: "item-inexistente" }, "10.3.0.3");
    expect(res.status).toBe(422);
  });

  it("responde 422 cuando falta el item (schema)", async () => {
    const res = await post({ item: "" }, "10.3.0.4");
    expect(res.status).toBe(422);
  });

  it("responde 503 cuando no hay cliente Stripe (degradación)", async () => {
    const res = await post({ item: "sesion-consultoria" }, "10.3.0.5");
    expect(res.status).toBe(503);
  });

  it("responde 502 si la sesión no trae URL", async () => {
    mocks.state.stripe = {
      checkout: {
        sessions: { create: vi.fn().mockResolvedValue({ url: null }) },
      },
    };
    const res = await post({ item: "sesion-consultoria" }, "10.3.0.6");
    expect(res.status).toBe(502);
  });

  it("responde 502 si Stripe lanza al crear la sesión", async () => {
    mocks.state.stripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockRejectedValue(new Error("stripe caído")),
        },
      },
    };
    const res = await post({ item: "sesion-consultoria" }, "10.3.0.7");
    expect(res.status).toBe(502);
  });

  it("responde 429 al superar el límite por IP", async () => {
    const create = vi.fn().mockResolvedValue({ url: "https://x" });
    mocks.state.stripe = { checkout: { sessions: { create } } };
    const ip = "10.3.0.99";
    for (let i = 0; i < 5; i++) {
      const r = await post({ item: "sesion-consultoria" }, ip);
      expect(r.status).toBe(200);
    }
    expect((await post({ item: "sesion-consultoria" }, ip)).status).toBe(429);
  });

  // ─── F12 — Checkout unificado (subscription mode) ────────────────

  it("F12.1: POST con itemId (nuevo formato) funciona igual que item legacy", async () => {
    const create = vi.fn().mockResolvedValue({ url: "https://x" });
    mocks.state.stripe = { checkout: { sessions: { create } } };
    const res = await post({ itemId: "sesion-consultoria" }, "10.4.0.1");
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ mode: "payment" }));
  });

  it("F12.2: POST con mode=subscription crea sesión recurring", async () => {
    const create = vi.fn().mockResolvedValue({ url: "https://x" });
    mocks.state.stripe = { checkout: { sessions: { create } } };
    const res = await post({ itemId: "retainer-pro", mode: "subscription" }, "10.4.0.2");
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 129_000,
              recurring: { interval: "month" },
            }),
          }),
        ],
      }),
    );
  });

  it("F12.3: POST con item one_time ignora mode=subscription (fuerza payment)", async () => {
    const create = vi.fn().mockResolvedValue({ url: "https://x" });
    mocks.state.stripe = { checkout: { sessions: { create } } };
    const res = await post({ itemId: "sesion-consultoria", mode: "subscription" }, "10.4.0.3");
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ mode: "payment" }));
  });

  it("F12.4: POST con itemId + item legacy → usa itemId", async () => {
    const create = vi.fn().mockResolvedValue({ url: "https://x" });
    mocks.state.stripe = { checkout: { sessions: { create } } };
    const res = await post({ itemId: "sesion-consultoria", item: "otro-item" }, "10.4.0.4");
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 6_000 }),
          }),
        ],
      }),
    );
  });

  it("F12.5: POST sin itemId ni item → 422", async () => {
    const res = await post({}, "10.4.0.5");
    expect(res.status).toBe(422);
  });

  it("F12.6: POST con itemId inexistente → 422", async () => {
    mocks.state.stripe = { checkout: { sessions: { create: vi.fn() } } };
    const res = await post({ itemId: "no-existe" }, "10.4.0.6");
    expect(res.status).toBe(422);
  });

  // ─── F13 — Canal secundario (transferencia + Payment Link) ────────

  it("T3.1: POST transfer → 200 con method=transfer e iban definido", async () => {
    mocks.state.transfer = {
      iban: "ES7621000418401234560123",
      beneficiary: "Alexendros",
      bank: "CaixaBank",
      configured: true,
    };
    mocks.state.prisma = {
      invoice: {
        create: vi.fn().mockResolvedValue({
          id: "inv-1",
          number: "INV-2026-001",
        }),
      },
    };
    const res = await post(
      {
        itemId: "sesion-consultoria",
        paymentMethod: "transfer",
        email: "cliente@example.com",
        name: "Cliente Test",
      },
      "10.5.0.1",
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.method).toBe("transfer");
    expect(body.iban).toBe("ES7621000418401234560123");
    expect(body.beneficiary).toBe("Alexendros");
    expect(body.reference).toBe("INV-2026-001");
    expect(body.invoiceId).toBe("inv-1");
  });

  it("T3.2: POST transfer sin email → 422 con fields.email", async () => {
    mocks.state.transfer = {
      iban: "ES7621000418401234560123",
      beneficiary: "Alexendros",
      bank: "",
      configured: true,
    };
    const res = await post(
      {
        itemId: "sesion-consultoria",
        paymentMethod: "transfer",
        name: "Cliente Test",
      },
      "10.5.0.2",
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.fields?.email).toBeDefined();
  });

  it("T3.3: POST transfer sin name → 422", async () => {
    mocks.state.transfer = {
      iban: "ES7621000418401234560123",
      beneficiary: "Alexendros",
      bank: "",
      configured: true,
    };
    const res = await post(
      {
        itemId: "sesion-consultoria",
        paymentMethod: "transfer",
        email: "cliente@example.com",
      },
      "10.5.0.3",
    );
    expect(res.status).toBe(422);
  });

  it("T3.4: POST transfer crea Invoice con status=pending_transfer", async () => {
    mocks.state.transfer = {
      iban: "ES7621000418401234560123",
      beneficiary: "Alexendros",
      bank: "",
      configured: true,
    };
    const create = vi.fn().mockResolvedValue({
      id: "inv-2",
      number: "INV-2026-002",
    });
    mocks.state.prisma = { invoice: { create } };
    await post(
      {
        itemId: "sesion-consultoria",
        paymentMethod: "transfer",
        email: "cliente@example.com",
        name: "Cliente Test",
      },
      "10.5.0.4",
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "pending_transfer",
          items: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({
                description: "Sesión de consultoría (1 h)",
                quantity: 1,
              }),
            ]),
          }),
        }),
      }),
    );
  });

  it("T3.5: POST transfer sin prisma → 503", async () => {
    mocks.state.transfer = {
      iban: "ES7621000418401234560123",
      beneficiary: "Alexendros",
      bank: "",
      configured: true,
    };
    mocks.state.prisma = null;
    const res = await post(
      {
        itemId: "sesion-consultoria",
        paymentMethod: "transfer",
        email: "cliente@example.com",
        name: "Cliente Test",
      },
      "10.5.0.5",
    );
    expect(res.status).toBe(503);
  });

  it("T3.6: POST transfer sin TRANSFER_IBAN → 503", async () => {
    mocks.state.transfer = {
      iban: "",
      beneficiary: "",
      bank: "",
      configured: false,
    };
    const res = await post(
      {
        itemId: "sesion-consultoria",
        paymentMethod: "transfer",
        email: "cliente@example.com",
        name: "Cliente Test",
      },
      "10.5.0.6",
    );
    expect(res.status).toBe(503);
  });

  it("T3.7: Stripe session falla → paymentLink.create éxito → 200 fallback=true", async () => {
    mocks.state.stripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockRejectedValue(new Error("stripe caído")),
        },
      },
      paymentLinks: {
        create: vi.fn().mockResolvedValue({ url: "https://buy.stripe.test/link_abc" }),
      },
    };
    const res = await post({ itemId: "sesion-consultoria" }, "10.5.0.7");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://buy.stripe.test/link_abc");
    expect(body.fallback).toBe(true);
  });

  it("T3.8: Ambos fallan (session + paymentLink) → 502 fallbackAttempted=true", async () => {
    mocks.state.stripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockRejectedValue(new Error("stripe caído")),
        },
      },
      paymentLinks: {
        create: vi.fn().mockRejectedValue(new Error("payment link caído")),
      },
    };
    const res = await post({ itemId: "sesion-consultoria" }, "10.5.0.8");
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.fallbackAttempted).toBe(true);
  });

  it("T3.9: Sin Stripe + con TRANSFER_IBAN → 503 con datos transferencia", async () => {
    mocks.state.stripe = null;
    mocks.state.transfer = {
      iban: "ES7621000418401234560123",
      beneficiary: "Alexendros",
      bank: "CaixaBank",
      configured: true,
    };
    const res = await post({ itemId: "sesion-consultoria" }, "10.5.0.9");
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.method).toBe("transfer");
    expect(body.iban).toBe("ES7621000418401234560123");
    expect(body.beneficiary).toBe("Alexendros");
  });

  it("T3.10: POST transfer con email inválido → 422", async () => {
    mocks.state.transfer = {
      iban: "ES7621000418401234560123",
      beneficiary: "Alexendros",
      bank: "",
      configured: true,
    };
    const res = await post(
      {
        itemId: "sesion-consultoria",
        paymentMethod: "transfer",
        email: "no-es-email",
        name: "Cliente Test",
      },
      "10.5.0.10",
    );
    expect(res.status).toBe(422);
  });
});
