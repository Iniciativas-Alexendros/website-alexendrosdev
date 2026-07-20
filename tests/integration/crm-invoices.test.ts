import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTACT_ID, DEAL_ID, INVOICE_ID, jsonReq, getReq, buildPrisma } from "../helpers/crm";
import type { CrmMocks } from "../helpers/crm";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const fns = {
    invoiceFindMany: vi.fn(),
    invoiceCreate: vi.fn(),
    invoiceUpdate: vi.fn(),
    invoiceFindUnique: vi.fn(),
    activityCreate: vi.fn(),
  } satisfies Partial<CrmMocks>;

  return {
    state: {
      prisma: null as null | Record<string, Record<string, ReturnType<typeof vi.fn>>>,
    },
    mocks: fns,
  };
});

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.state.prisma;
  },
}));

vi.mock("@/lib/crm/invoice-number", () => ({
  generateInvoiceNumberAsync: vi.fn(async () => "INV-2026-001"),
}));

vi.mock("@/lib/crm-auth", () => ({
  requireCrmAuth: vi.fn(() => undefined),
}));

const { POST: invoicesPOST, GET: invoicesGET } = await import("@/app/api/crm/invoices/route");
const { PATCH: invoicesPATCH } = await import("@/app/api/crm/invoices/[id]/route");

function mockPrisma() {
  mocks.state.prisma = buildPrisma({
    ...(undefined as unknown as CrmMocks),
    invoiceFindMany: mocks.mocks.invoiceFindMany,
    invoiceCreate: mocks.mocks.invoiceCreate,
    invoiceUpdate: mocks.mocks.invoiceUpdate,
    invoiceFindUnique: mocks.mocks.invoiceFindUnique,
    activityCreate: mocks.mocks.activityCreate,
  } as CrmMocks);
}

beforeEach(() => {
  mocks.state.prisma = null;
  Object.values(mocks.mocks).forEach((m) => m.mockReset());
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// ─── Invoices ───────────────────────────────────────────────────────────────

describe("CRM: Invoices", () => {
  it("T4.21: GET invoices → 200", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindMany.mockResolvedValue([{ id: INVOICE_ID, number: "INV-2026-001" }]);
    const res = await invoicesGET(getReq("http://localhost/api/crm/invoices"));
    expect(res.status).toBe(200);
  });

  it("T4.22: POST invoice → 201 con number INV-YYYY-NNN", async () => {
    mockPrisma();
    mocks.mocks.invoiceCreate.mockResolvedValue({ id: INVOICE_ID, number: "INV-2026-001" });
    const res = await invoicesPOST(
      jsonReq({
        contactId: CONTACT_ID,
        items: [{ description: "Consultoría", quantity: 1, unitPrice: 6000 }],
      }),
    );
    expect(res.status).toBe(201);
  });

  it("T4.23: POST sin items → 422", async () => {
    mockPrisma();
    const res = await invoicesPOST(jsonReq({ contactId: CONTACT_ID, items: [] }));
    expect(res.status).toBe(422);
  });

  it("T4.24: POST taxRate 0.21 → total correcto", async () => {
    mockPrisma();
    mocks.mocks.invoiceCreate.mockResolvedValue({ id: INVOICE_ID, number: "INV-2026-001" });
    await invoicesPOST(
      jsonReq({
        contactId: CONTACT_ID,
        taxRate: 0.21,
        items: [{ description: "Consultoría", quantity: 1, unitPrice: 10000 }],
      }),
    );
    expect(mocks.mocks.invoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taxRate: "0.21",
          subtotal: "10000",
          taxAmount: "2100",
          total: "12100",
        }),
      }),
    );
  });

  it("T4.31: POST invoice completa con items, dealId y notes → 201 con items.create detallado", async () => {
    mockPrisma();
    mocks.mocks.invoiceCreate.mockResolvedValue({ id: INVOICE_ID, number: "INV-2026-002" });
    const PRODUCT_ID = "b0000001-0000-4000-8000-000000000001";
    const res = await invoicesPOST(
      jsonReq({
        contactId: CONTACT_ID,
        dealId: DEAL_ID,
        notes: "Factura completa de prueba",
        items: [
          { description: "Retainer Starter", quantity: 1, unitPrice: 69000, productId: PRODUCT_ID },
          { description: "Sesión extra", quantity: 2, unitPrice: 6000 },
        ],
      }),
    );
    expect(res.status).toBe(201);
    expect(mocks.mocks.invoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contactId: CONTACT_ID,
          dealId: DEAL_ID,
          notes: "Factura completa de prueba",
          status: "draft",
          subtotal: "81000",
          taxRate: "0",
          taxAmount: "0",
          total: "81000",
          items: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({
                description: "Retainer Starter",
                quantity: 1,
                unitPrice: 69000,
                totalPrice: 69000,
                productId: PRODUCT_ID,
              }),
              expect.objectContaining({
                description: "Sesión extra",
                quantity: 2,
                unitPrice: 6000,
                totalPrice: 12000,
              }),
            ]),
          }),
        }),
      }),
    );
  });

  it("T4.38: GET invoices con ?dealId → 200 filtrado", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindMany.mockResolvedValue([
      { id: INVOICE_ID, number: "INV-2026-001", dealId: DEAL_ID },
    ]);
    const res = await invoicesGET(getReq(`http://localhost/api/crm/invoices?dealId=${DEAL_ID}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(mocks.mocks.invoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ dealId: DEAL_ID }) }),
    );
  });

  it("T4.39: GET invoices con ?status=paid → 200 filtrado", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindMany.mockResolvedValue([
      { id: INVOICE_ID, number: "INV-2026-001", status: "paid" },
    ]);
    const res = await invoicesGET(getReq("http://localhost/api/crm/invoices?status=paid"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(mocks.mocks.invoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "paid" }) }),
    );
  });

  it("T4.40: POST invoice falla al crear → 500", async () => {
    mockPrisma();
    mocks.mocks.invoiceCreate.mockRejectedValue(new Error("DB connection error"));
    const res = await invoicesPOST(
      jsonReq({
        contactId: CONTACT_ID,
        items: [{ description: "Item", quantity: 1, unitPrice: 5000 }],
      }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("No se pudo crear la factura.");
  });

  it("T4.43: POST invoice sin contactId ni dealId → 422 (Zod refine)", async () => {
    mockPrisma();
    const res = await invoicesPOST(
      jsonReq({ items: [{ description: "Item", quantity: 1, unitPrice: 5000 }] }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("Solicitud inválida.");
    expect(body.fields).toBeDefined();
  });

  it("T4.44: POST invoice con JSON malformed → 400", async () => {
    mockPrisma();
    const req = new Request("http://localhost/api/crm/invoices", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "test-crm-key" },
      body: "esto-no-es-json",
    });
    const res = await invoicesPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Cuerpo de petición inválido.");
  });

  it("T4.45: GET invoices sin prisma → 503", async () => {
    const res = await invoicesGET(getReq("http://localhost/api/crm/invoices"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });

  it("T4.46: POST invoices sin prisma → 503", async () => {
    const res = await invoicesPOST(
      jsonReq({
        contactId: CONTACT_ID,
        items: [{ description: "Test", quantity: 1, unitPrice: 1000 }],
      }),
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });
});

// ─── Invoice PATCH ──────────────────────────────────────────────────────────

describe("CRM: Invoice PATCH", () => {
  it("T4.25: PATCH invoice status paid → 200", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindUnique.mockResolvedValue({ id: INVOICE_ID, status: "sent" });
    mocks.mocks.invoiceUpdate.mockResolvedValue({ id: INVOICE_ID, status: "paid" });
    const res = await invoicesPATCH(jsonReq({ status: "paid" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
  });

  it("T4.26: PATCH transición inválida (draft→paid) → 422", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindUnique.mockResolvedValue({ id: INVOICE_ID, status: "draft" });
    const res = await invoicesPATCH(jsonReq({ status: "paid" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(422);
  });

  it("T4.32: PATCH draft→sent → 200", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindUnique.mockResolvedValue({ id: INVOICE_ID, status: "draft" });
    mocks.mocks.invoiceUpdate.mockResolvedValue({ id: INVOICE_ID, status: "sent" });
    const res = await invoicesPATCH(jsonReq({ status: "sent" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.mocks.invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INVOICE_ID },
        data: expect.objectContaining({ status: "sent" }),
      }),
    );
  });

  it("T4.33: PATCH sent→cancelled → 200", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindUnique.mockResolvedValue({ id: INVOICE_ID, status: "sent" });
    mocks.mocks.invoiceUpdate.mockResolvedValue({ id: INVOICE_ID, status: "cancelled" });
    const res = await invoicesPATCH(jsonReq({ status: "cancelled" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.mocks.invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INVOICE_ID },
        data: expect.objectContaining({ status: "cancelled" }),
      }),
    );
  });

  it("T4.34: PATCH invoice no encontrada → 404", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindUnique.mockResolvedValue(null);
    const res = await invoicesPATCH(jsonReq({ status: "sent" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(404);
    expect(mocks.mocks.invoiceUpdate).not.toHaveBeenCalled();
  });

  it("T4.35: PATCH sent→paid auto-asigna paidAt a new Date()", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindUnique.mockResolvedValue({ id: INVOICE_ID, status: "sent" });
    mocks.mocks.invoiceUpdate.mockResolvedValue({ id: INVOICE_ID, status: "paid" });
    const res = await invoicesPATCH(jsonReq({ status: "paid" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.mocks.invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INVOICE_ID },
        data: expect.objectContaining({ status: "paid", paidAt: expect.any(Date) }),
      }),
    );
  });

  it("T4.36: PATCH sent→paid con paidAt explícito usa ese valor", async () => {
    mockPrisma();
    mocks.mocks.invoiceFindUnique.mockResolvedValue({ id: INVOICE_ID, status: "sent" });
    mocks.mocks.invoiceUpdate.mockResolvedValue({ id: INVOICE_ID, status: "paid" });
    const explicitDate = "2026-07-18T00:00:00.000Z";
    const res = await invoicesPATCH(jsonReq({ status: "paid", paidAt: explicitDate }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.mocks.invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INVOICE_ID },
        data: expect.objectContaining({ status: "paid", paidAt: expect.any(Date) }),
      }),
    );
    const callArg = mocks.mocks.invoiceUpdate.mock.calls[0][0];
    expect(callArg.data.paidAt.toISOString()).toBe(explicitDate);
  });
});
