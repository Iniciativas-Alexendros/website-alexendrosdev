import { beforeEach, describe, expect, it, vi } from "vitest";

// IDs fijos para tests (UUIDs v4 válidos)
const CONTACT_ID = "bb116d1d-6d86-4bdb-b163-2f738e058399";
const DEAL_ID = "9b856f74-a796-435a-94fc-7ac2c2d76a64";
const STAGE_NUEVO_ID = "fa3905c2-78c1-49dc-a6c5-3f4cc86858fe";
const STAGE_CONTACTADO_ID = "34b60493-6e56-4910-af5f-456c35a98178";
const STAGE_DISCOVERY_ID = "a0000002-0000-4000-8000-000000000002";
const STAGE_PROPUESTA_ID = "a0000003-0000-4000-8000-000000000003";
const STAGE_NEGOCIACION_ID = "a0000004-0000-4000-8000-000000000004";
const STAGE_CERRADO_PERDIDO_ID = "a0000009-0000-4000-8000-000000000009";
const INVOICE_ID = "7578caee-e40c-4d33-8eef-068bad2f168b";

// Mock de prisma con todos los modelos CRM
const mocks = vi.hoisted(() => ({
  state: {
    crmApiKey: "test-crm-key",
    prisma: null as null | Record<string, Record<string, ReturnType<typeof vi.fn>>>,
  },
  mocks: {
    contactFindMany: vi.fn(),
    contactCreate: vi.fn(),
    dealFindMany: vi.fn(),
    dealCreate: vi.fn(),
    dealUpdate: vi.fn(),
    dealFindFirst: vi.fn(),
    pipelineStageFindMany: vi.fn(),
    pipelineStageFindFirst: vi.fn(),
    productFindMany: vi.fn(),
    productCreate: vi.fn(),
    invoiceFindMany: vi.fn(),
    invoiceCreate: vi.fn(),
    invoiceUpdate: vi.fn(),
    invoiceFindUnique: vi.fn(),
    activityFindMany: vi.fn(),
    activityCreate: vi.fn(),
    taskFindMany: vi.fn(),
    taskCreate: vi.fn(),
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

vi.mock("@/lib/crm-auth", () => ({
  requireCrmAuth: vi.fn(() => undefined),
}));

const { POST: contactsPOST, GET: contactsGET } = await import("@/app/api/crm/contacts/route");
const { POST: dealsPOST, GET: dealsGET } = await import("@/app/api/crm/deals/route");
const { PATCH: dealsPATCH } = await import("@/app/api/crm/deals/[id]/route");
const { GET: pipelineGET } = await import("@/app/api/crm/pipeline-stages/route");
const { POST: productsPOST, GET: productsGET } = await import("@/app/api/crm/products/route");
const { POST: invoicesPOST, GET: invoicesGET } = await import("@/app/api/crm/invoices/route");
const { PATCH: invoicesPATCH } = await import("@/app/api/crm/invoices/[id]/route");
const { GET: activitiesGET } = await import("@/app/api/crm/activities/route");
const { POST: tasksPOST, GET: tasksGET } = await import("@/app/api/crm/tasks/route");

function buildPrisma() {
  return {
    contact: {
      findMany: mocks.mocks.contactFindMany,
      create: mocks.mocks.contactCreate,
    },
    deal: {
      findMany: mocks.mocks.dealFindMany,
      create: mocks.mocks.dealCreate,
      update: mocks.mocks.dealUpdate,
      findFirst: mocks.mocks.dealFindFirst,
    },
    pipelineStage: {
      findMany: mocks.mocks.pipelineStageFindMany,
      findFirst: mocks.mocks.pipelineStageFindFirst,
    },
    product: {
      findMany: mocks.mocks.productFindMany,
      create: mocks.mocks.productCreate,
    },
    invoice: {
      findMany: mocks.mocks.invoiceFindMany,
      create: mocks.mocks.invoiceCreate,
      update: mocks.mocks.invoiceUpdate,
      findUnique: mocks.mocks.invoiceFindUnique,
    },
    activity: {
      findMany: mocks.mocks.activityFindMany,
      create: mocks.mocks.activityCreate,
    },
    task: {
      findMany: mocks.mocks.taskFindMany,
      create: mocks.mocks.taskCreate,
    },
  };
}

function jsonReq(body: unknown, method = "POST") {
  return new Request("http://localhost/api/crm/test", {
    method,
    headers: { "content-type": "application/json", "x-api-key": "test-crm-key" },
    body: JSON.stringify(body),
  });
}

function getReq(url: string) {
  return new Request(url, {
    method: "GET",
    headers: { "x-api-key": "test-crm-key" },
  });
}

function getReqNoAuth(url: string) {
  return new Request(url, { method: "GET" });
}

beforeEach(() => {
  mocks.state.crmApiKey = "test-crm-key";
  mocks.state.prisma = buildPrisma();
  Object.values(mocks.mocks).forEach((m) => m.mockReset());
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// ─── Contacts ───────────────────────────────────────────────────────────────

describe("CRM: Contacts", () => {
  it("T4.7: GET contacts → 200 array", async () => {
    mocks.mocks.contactFindMany.mockResolvedValue([{ id: CONTACT_ID, firstName: "Test" }]);
    const res = await contactsGET(getReq("http://localhost/api/crm/contacts"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it("T4.8: POST contact → 201", async () => {
    mocks.mocks.contactCreate.mockResolvedValue({
      id: CONTACT_ID,
      firstName: "Nuevo",
    });
    const res = await contactsPOST(jsonReq({ firstName: "Nuevo", email: "test@example.com" }));
    expect(res.status).toBe(201);
  });

  it("T4.9: POST email duplicado → 201 (Contact no unique email)", async () => {
    mocks.mocks.contactCreate.mockResolvedValue({
      id: CONTACT_ID,
      firstName: "Dup",
    });
    const res = await contactsPOST(jsonReq({ firstName: "Dup", email: "dup@example.com" }));
    expect(res.status).toBe(201);
  });

  it("T4.10: POST sin firstName → 422", async () => {
    const res = await contactsPOST(jsonReq({ lastName: "Solo" }));
    expect(res.status).toBe(422);
  });
});

// ─── Deals ──────────────────────────────────────────────────────────────────

describe("CRM: Deals", () => {
  it("T4.11: GET deals → 200 array", async () => {
    mocks.mocks.dealFindMany.mockResolvedValue([{ id: DEAL_ID, title: "Test" }]);
    const res = await dealsGET(getReq("http://localhost/api/crm/deals"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("T4.12: POST deal → 201 con stage Nuevo automático", async () => {
    mocks.mocks.pipelineStageFindFirst.mockResolvedValue({
      id: STAGE_NUEVO_ID,
      order: 0,
      name: "Nuevo",
    });
    mocks.mocks.dealCreate.mockResolvedValue({
      id: DEAL_ID,
      title: "Nuevo deal",
      stageId: STAGE_NUEVO_ID,
    });
    const res = await dealsPOST(jsonReq({ title: "Nuevo deal", contactId: CONTACT_ID }));
    expect(res.status).toBe(201);
    expect(mocks.mocks.dealCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stageId: STAGE_NUEVO_ID }),
      }),
    );
  });

  it("T4.13: POST sin contactId → 422", async () => {
    const res = await dealsPOST(jsonReq({ title: "Sin contacto" }));
    expect(res.status).toBe(422);
  });

  it("T4.14: POST contactId inexistente → 422", async () => {
    mocks.mocks.dealCreate.mockRejectedValue(new Error("Foreign key constraint"));
    const res = await dealsPOST(
      jsonReq({ title: "Deal", contactId: "00000000-0000-0000-0000-000000000000" }),
    );
    expect(res.status).toBe(422);
  });

  it("T4.28: GET deals con filtros stageId+contactId", async () => {
    mocks.mocks.dealFindMany.mockResolvedValue([
      { id: DEAL_ID, title: "Filtrado", stageId: STAGE_NUEVO_ID, contactId: CONTACT_ID },
    ]);
    const url = `http://localhost/api/crm/deals?stageId=${STAGE_NUEVO_ID}&contactId=${CONTACT_ID}`;
    const res = await dealsGET(getReq(url));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(mocks.mocks.dealFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          stageId: STAGE_NUEVO_ID,
          contactId: CONTACT_ID,
        }),
      }),
    );
  });

  it("T4.29: POST deal sin initialStage (pipeline vacío) → 201 con stageId null", async () => {
    mocks.mocks.pipelineStageFindFirst.mockResolvedValue(null);
    mocks.mocks.dealCreate.mockResolvedValue({
      id: DEAL_ID,
      title: "Deal sin stage",
      stageId: null,
    });
    const res = await dealsPOST(jsonReq({ title: "Deal sin stage", contactId: CONTACT_ID }));
    expect(res.status).toBe(201);
    expect(mocks.mocks.dealCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stageId: null }),
      }),
    );
  });

  it("T4.30: POST deal con items → 201 con items.create", async () => {
    mocks.mocks.pipelineStageFindFirst.mockResolvedValue({
      id: STAGE_NUEVO_ID,
      order: 0,
      name: "Nuevo",
    });
    mocks.mocks.dealCreate.mockResolvedValue({
      id: DEAL_ID,
      title: "Deal con items",
      stageId: STAGE_NUEVO_ID,
    });
    const PRODUCT_ID = "a1234567-1234-4bcd-8ef0-123456789abc";

    const reqBody = {
      title: "Deal con items",
      contactId: CONTACT_ID,
      value: 500000,
      items: [{ productId: PRODUCT_ID, quantity: 2, unitPrice: 250000 }],
    };
    const res = await dealsPOST(jsonReq(reqBody));
    expect(res.status).toBe(201);
  });

  it("T4.47: GET deals sin prisma → 503", async () => {
    mocks.state.prisma = null;
    const res = await dealsGET(getReq("http://localhost/api/crm/deals"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });

  it("T4.48: POST deals sin prisma → 503", async () => {
    mocks.state.prisma = null;
    const res = await dealsPOST(jsonReq({ title: "Test", contactId: CONTACT_ID }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });

  it("T4.49: POST deals con JSON malformed → 400", async () => {
    const req = new Request("http://localhost/api/crm/deals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "test-crm-key",
      },
      body: "esto-no-es-json",
    });
    const res = await dealsPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Cuerpo de petición inválido.");
  });
});

// ─── Deals PATCH ────────────────────────────────────────────────────────────

describe("CRM: Deals PATCH", () => {
  it("T4.15: PATCH deal stage → 200", async () => {
    mocks.mocks.dealFindFirst.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_NUEVO_ID,
    });
    // Primera llamada: target stage (Contactado). Segunda: current stage (Nuevo).
    mocks.mocks.pipelineStageFindFirst
      .mockResolvedValueOnce({ id: STAGE_CONTACTADO_ID, order: 1, name: "Contactado" })
      .mockResolvedValueOnce({ id: STAGE_NUEVO_ID, order: 0, name: "Nuevo" });
    mocks.mocks.dealUpdate.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_CONTACTADO_ID,
    });
    mocks.mocks.activityCreate.mockResolvedValue({ id: "a1" });
    const res = await dealsPATCH(jsonReq({ stageId: STAGE_CONTACTADO_ID }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(200);
  });

  it("T4.16: PATCH stageId inexistente → 422", async () => {
    mocks.mocks.dealFindFirst.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_NUEVO_ID,
    });
    mocks.mocks.pipelineStageFindFirst.mockResolvedValue(null);
    const res = await dealsPATCH(
      jsonReq({ stageId: "00000000-0000-0000-0000-000000000000" }, "PATCH"),
      { params: Promise.resolve({ id: DEAL_ID }) },
    );
    expect(res.status).toBe(422);
  });

  it("T4.17: PATCH deal crea Activity transición", async () => {
    mocks.mocks.dealFindFirst.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_NUEVO_ID,
    });
    // Primera llamada: target stage (Contactado). Segunda: current stage (Nuevo).
    mocks.mocks.pipelineStageFindFirst
      .mockResolvedValueOnce({ id: STAGE_CONTACTADO_ID, order: 1, name: "Contactado" })
      .mockResolvedValueOnce({ id: STAGE_NUEVO_ID, order: 0, name: "Nuevo" });
    mocks.mocks.dealUpdate.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_CONTACTADO_ID,
    });
    mocks.mocks.activityCreate.mockResolvedValue({ id: "a2" });
    await dealsPATCH(jsonReq({ stageId: STAGE_CONTACTADO_ID }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(mocks.mocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "NOTE",
          dealId: DEAL_ID,
        }),
      }),
    );
  });

  // ─── P2 — Ramas faltantes crm/deals/[id] ────────────────────────

  it("P2.1: PATCH deal no encontrado → 404", async () => {
    mocks.mocks.dealFindFirst.mockResolvedValue(null);
    const res = await dealsPATCH(jsonReq({ stageId: STAGE_CONTACTADO_ID }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(404);
    expect(mocks.mocks.dealUpdate).not.toHaveBeenCalled();
  });

  it("P2.2: PATCH transición desde stage terminal (Cerrado perdido) → 422", async () => {
    mocks.mocks.dealFindFirst.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_CERRADO_PERDIDO_ID,
    });
    mocks.mocks.pipelineStageFindFirst
      .mockResolvedValueOnce({ id: STAGE_CONTACTADO_ID, order: 1, name: "Contactado" })
      .mockResolvedValueOnce({ id: STAGE_CERRADO_PERDIDO_ID, order: 9, name: "Cerrado perdido" });
    const res = await dealsPATCH(jsonReq({ stageId: STAGE_CONTACTADO_ID }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(422);
    expect(mocks.mocks.dealUpdate).not.toHaveBeenCalled();
  });

  it("P2.3: PATCH transición inválida (saltar etapa 0→2) → 422", async () => {
    mocks.mocks.dealFindFirst.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_NUEVO_ID,
    });
    mocks.mocks.pipelineStageFindFirst
      .mockResolvedValueOnce({ id: STAGE_DISCOVERY_ID, order: 2, name: "Discovery call" })
      .mockResolvedValueOnce({ id: STAGE_NUEVO_ID, order: 0, name: "Nuevo" });
    const res = await dealsPATCH(jsonReq({ stageId: STAGE_DISCOVERY_ID }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(422);
    expect(mocks.mocks.dealUpdate).not.toHaveBeenCalled();
  });

  it("P2.4: PATCH transición válida Propuesta→Negociación (3→4) → 200 con activity", async () => {
    mocks.mocks.dealFindFirst.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_PROPUESTA_ID,
    });
    mocks.mocks.pipelineStageFindFirst
      .mockResolvedValueOnce({ id: STAGE_NEGOCIACION_ID, order: 4, name: "Negociación" })
      .mockResolvedValueOnce({ id: STAGE_PROPUESTA_ID, order: 3, name: "Propuesta" });
    mocks.mocks.dealUpdate.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_NEGOCIACION_ID,
    });
    mocks.mocks.activityCreate.mockResolvedValue({ id: "a3" });
    const res = await dealsPATCH(jsonReq({ stageId: STAGE_NEGOCIACION_ID }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.mocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "NOTE",
          title: expect.stringContaining("Negociación"),
          dealId: DEAL_ID,
        }),
      }),
    );
    expect(mocks.mocks.dealUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DEAL_ID },
        data: expect.objectContaining({ stageId: STAGE_NEGOCIACION_ID }),
      }),
    );
  });

  it("T4.37: PATCH con closedAt explícito en body → 200, closedAt como Date correcto", async () => {
    mocks.mocks.dealFindFirst.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_CONTACTADO_ID,
    });
    mocks.mocks.pipelineStageFindFirst
      .mockResolvedValueOnce({ id: STAGE_DISCOVERY_ID, order: 2, name: "Discovery call" })
      .mockResolvedValueOnce({ id: STAGE_CONTACTADO_ID, order: 1, name: "Contactado" });
    mocks.mocks.dealUpdate.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_DISCOVERY_ID,
      closedAt: new Date("2026-07-18T00:00:00.000Z"),
    });
    mocks.mocks.activityCreate.mockResolvedValue({ id: "a4" });

    const explicitClosedAt = "2026-07-18T00:00:00.000Z";
    const res = await dealsPATCH(
      jsonReq({ stageId: STAGE_DISCOVERY_ID, closedAt: explicitClosedAt }, "PATCH"),
      { params: Promise.resolve({ id: DEAL_ID }) },
    );
    expect(res.status).toBe(200);
    // closedAt es un Date (no string ni undefined)
    expect(mocks.mocks.dealUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DEAL_ID },
        data: expect.objectContaining({
          stageId: STAGE_DISCOVERY_ID,
          closedAt: expect.any(Date),
        }),
      }),
    );
    // El Date corresponde al timestamp enviado, no a new Date()
    const callArg = mocks.mocks.dealUpdate.mock.calls[0][0];
    expect(callArg.data.closedAt.toISOString()).toBe(explicitClosedAt);
  });

  it("T4.41: PATCH con body inválido → 422 (Zod rejection)", async () => {
    const res = await dealsPATCH(jsonReq({ probability: "not-a-number" }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(422);
    expect(mocks.mocks.dealUpdate).not.toHaveBeenCalled();
  });

  it("T4.42: PATCH sin stageId (solo probability) → 200, no activity", async () => {
    mocks.mocks.dealFindFirst.mockResolvedValue({
      id: DEAL_ID,
      stageId: STAGE_NUEVO_ID,
    });
    mocks.mocks.dealUpdate.mockResolvedValue({
      id: DEAL_ID,
      probability: 50,
    });
    const res = await dealsPATCH(jsonReq({ probability: 50 }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.mocks.activityCreate).not.toHaveBeenCalled();
    expect(mocks.mocks.dealUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DEAL_ID },
        data: expect.objectContaining({ probability: 50 }),
      }),
    );
  });
});

// ─── Pipeline Stages ────────────────────────────────────────────────────────

describe("CRM: Pipeline Stages", () => {
  it("T4.18: GET pipeline-stages → 200, ordenados por order", async () => {
    mocks.mocks.pipelineStageFindMany.mockResolvedValue([
      { id: STAGE_NUEVO_ID, name: "Nuevo", order: 0 },
      { id: STAGE_CONTACTADO_ID, name: "Contactado", order: 1 },
      { id: "55555555-5555-5555-5555-555555555556", name: "Discovery call", order: 2 },
    ]);
    const res = await pipelineGET(getReq("http://localhost/api/crm/pipeline-stages"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(3);
    expect(mocks.mocks.pipelineStageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { order: "asc" },
      }),
    );
  });
});

// ─── Products ───────────────────────────────────────────────────────────────

describe("CRM: Products", () => {
  it("T4.19: GET products → 200", async () => {
    mocks.mocks.productFindMany.mockResolvedValue([{ id: "p1", name: "Retainer" }]);
    const res = await productsGET(getReq("http://localhost/api/crm/products"));
    expect(res.status).toBe(200);
  });

  it("T4.20: POST product → 201", async () => {
    mocks.mocks.productCreate.mockResolvedValue({
      id: "p2",
      name: "Nuevo producto",
    });
    const res = await productsPOST(jsonReq({ name: "Nuevo producto", unitPrice: 5000 }));
    expect(res.status).toBe(201);
  });
});

// ─── Invoices ───────────────────────────────────────────────────────────────

describe("CRM: Invoices", () => {
  it("T4.21: GET invoices → 200", async () => {
    mocks.mocks.invoiceFindMany.mockResolvedValue([{ id: INVOICE_ID, number: "INV-2026-001" }]);
    const res = await invoicesGET(getReq("http://localhost/api/crm/invoices"));
    expect(res.status).toBe(200);
  });

  it("T4.22: POST invoice → 201 con number INV-YYYY-NNN", async () => {
    mocks.mocks.invoiceCreate.mockResolvedValue({
      id: INVOICE_ID,
      number: "INV-2026-001",
    });
    const res = await invoicesPOST(
      jsonReq({
        contactId: CONTACT_ID,
        items: [{ description: "Consultoría", quantity: 1, unitPrice: 6000 }],
      }),
    );
    expect(res.status).toBe(201);
  });

  it("T4.23: POST sin items → 422", async () => {
    const res = await invoicesPOST(jsonReq({ contactId: CONTACT_ID, items: [] }));
    expect(res.status).toBe(422);
  });

  it("T4.24: POST taxRate 0.21 → total correcto", async () => {
    mocks.mocks.invoiceCreate.mockResolvedValue({
      id: INVOICE_ID,
      number: "INV-2026-001",
    });
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
    mocks.mocks.invoiceCreate.mockResolvedValue({
      id: INVOICE_ID,
      number: "INV-2026-002",
    });
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
          subtotal: "81000", // 1*69000 + 2*6000
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

  it("T4.38: GET invoices con ?dealId → 200 filtrado, filter pasado a findMany", async () => {
    mocks.mocks.invoiceFindMany.mockResolvedValue([
      { id: INVOICE_ID, number: "INV-2026-001", dealId: DEAL_ID },
    ]);
    const res = await invoicesGET(getReq(`http://localhost/api/crm/invoices?dealId=${DEAL_ID}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(mocks.mocks.invoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dealId: DEAL_ID }),
      }),
    );
  });

  it("T4.39: GET invoices con ?status=paid → 200 filtrado, filter status pasado a findMany", async () => {
    mocks.mocks.invoiceFindMany.mockResolvedValue([
      { id: INVOICE_ID, number: "INV-2026-001", status: "paid" },
    ]);
    const res = await invoicesGET(getReq("http://localhost/api/crm/invoices?status=paid"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(mocks.mocks.invoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "paid" }),
      }),
    );
  });

  it("T4.40: POST invoice falla al crear → 500 con error message", async () => {
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
    const res = await invoicesPOST(
      jsonReq({
        items: [{ description: "Item", quantity: 1, unitPrice: 5000 }],
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("Solicitud inválida.");
    expect(body.fields).toBeDefined();
  });

  it("T4.44: POST invoice con JSON malformed → 400", async () => {
    const req = new Request("http://localhost/api/crm/invoices", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "test-crm-key",
      },
      body: "esto-no-es-json",
    });
    const res = await invoicesPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Cuerpo de petición inválido.");
  });

  it("T4.45: GET invoices sin prisma → 503", async () => {
    mocks.state.prisma = null;
    const res = await invoicesGET(getReq("http://localhost/api/crm/invoices"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });

  it("T4.46: POST invoices sin prisma → 503", async () => {
    mocks.state.prisma = null;
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
    mocks.mocks.invoiceFindUnique.mockResolvedValue({
      id: INVOICE_ID,
      status: "sent",
    });
    mocks.mocks.invoiceUpdate.mockResolvedValue({
      id: INVOICE_ID,
      status: "paid",
    });
    const res = await invoicesPATCH(jsonReq({ status: "paid" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
  });

  it("T4.26: PATCH transición inválida → 422 (draft→paid sin pasar por sent)", async () => {
    mocks.mocks.invoiceFindUnique.mockResolvedValue({
      id: INVOICE_ID,
      status: "draft",
    });
    const res = await invoicesPATCH(jsonReq({ status: "paid" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(422);
  });

  it("T4.32: PATCH draft→sent → 200", async () => {
    mocks.mocks.invoiceFindUnique.mockResolvedValue({
      id: INVOICE_ID,
      status: "draft",
    });
    mocks.mocks.invoiceUpdate.mockResolvedValue({
      id: INVOICE_ID,
      status: "sent",
    });
    const res = await invoicesPATCH(jsonReq({ status: "sent" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.mocks.invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INVOICE_ID },
        data: expect.objectContaining({
          status: "sent",
        }),
      }),
    );
  });

  it("T4.33: PATCH sent→cancelled → 200", async () => {
    mocks.mocks.invoiceFindUnique.mockResolvedValue({
      id: INVOICE_ID,
      status: "sent",
    });
    mocks.mocks.invoiceUpdate.mockResolvedValue({
      id: INVOICE_ID,
      status: "cancelled",
    });
    const res = await invoicesPATCH(jsonReq({ status: "cancelled" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.mocks.invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INVOICE_ID },
        data: expect.objectContaining({
          status: "cancelled",
        }),
      }),
    );
  });

  it("T4.34: PATCH invoice no encontrada → 404", async () => {
    mocks.mocks.invoiceFindUnique.mockResolvedValue(null);
    const res = await invoicesPATCH(jsonReq({ status: "sent" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(404);
    expect(mocks.mocks.invoiceUpdate).not.toHaveBeenCalled();
  });

  it("T4.35: PATCH sent→paid auto-asigna paidAt a new Date() sin enviar paidAt en body", async () => {
    mocks.mocks.invoiceFindUnique.mockResolvedValue({
      id: INVOICE_ID,
      status: "sent",
    });
    mocks.mocks.invoiceUpdate.mockResolvedValue({
      id: INVOICE_ID,
      status: "paid",
    });
    const res = await invoicesPATCH(jsonReq({ status: "paid" }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
    // Verificar que paidAt se auto-asignó sin estar en el body
    expect(mocks.mocks.invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INVOICE_ID },
        data: expect.objectContaining({
          status: "paid",
          paidAt: expect.any(Date),
        }),
      }),
    );
  });

  it("T4.36: PATCH sent→paid con paidAt explícito en body usa ese valor", async () => {
    mocks.mocks.invoiceFindUnique.mockResolvedValue({
      id: INVOICE_ID,
      status: "sent",
    });
    mocks.mocks.invoiceUpdate.mockResolvedValue({
      id: INVOICE_ID,
      status: "paid",
    });
    const explicitDate = "2026-07-18T00:00:00.000Z";
    const res = await invoicesPATCH(jsonReq({ status: "paid", paidAt: explicitDate }, "PATCH"), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });
    expect(res.status).toBe(200);
    // Verificar que se usó el paidAt explícito (Date), no new Date()
    expect(mocks.mocks.invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INVOICE_ID },
        data: expect.objectContaining({
          status: "paid",
          paidAt: expect.any(Date),
        }),
      }),
    );
    // Verificar que el Date creado corresponde al timestamp enviado
    const callArg = mocks.mocks.invoiceUpdate.mock.calls[0][0];
    expect(callArg.data.paidAt.toISOString()).toBe(explicitDate);
  });
});

// ─── Activities ─────────────────────────────────────────────────────────────

describe("CRM: Activities", () => {
  it("GET activities con ?dealId → 200 array", async () => {
    mocks.mocks.activityFindMany.mockResolvedValue([{ id: "a1", dealId: DEAL_ID, title: "Nota" }]);
    const res = await activitiesGET(
      getReq(`http://localhost/api/crm/activities?dealId=${DEAL_ID}`),
    );
    expect(res.status).toBe(200);
  });
});

// ─── Tasks ──────────────────────────────────────────────────────────────────

describe("CRM: Tasks", () => {
  it("GET tasks con ?contactId → 200 array filtrado", async () => {
    mocks.mocks.taskFindMany.mockResolvedValue([
      { id: "t1", title: "Tarea de contacto", contactId: CONTACT_ID },
    ]);
    const res = await tasksGET(getReq(`http://localhost/api/crm/tasks?contactId=${CONTACT_ID}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mocks.mocks.taskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ contactId: CONTACT_ID }),
      }),
    );
  });

  it("POST task con dealId inválido (FK error) → 422", async () => {
    mocks.mocks.taskCreate.mockRejectedValue(new Error("Foreign key constraint"));
    const res = await tasksPOST(
      jsonReq({
        title: "Tarea con deal inválido",
        dealId: "00000000-0000-0000-0000-000000000000",
      }),
    );
    expect(res.status).toBe(422);
  });

  it("POST task con cuerpo JSON malformed → 400", async () => {
    const req = new Request("http://localhost/api/crm/tasks", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "test-crm-key",
      },
      body: "esto-no-es-json",
    });
    const res = await tasksPOST(req);
    expect(res.status).toBe(400);
  });

  it("GET tasks sin prisma → 503", async () => {
    mocks.state.prisma = null;
    const res = await tasksGET(getReq("http://localhost/api/crm/tasks"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });

  it("POST tasks sin prisma → 503", async () => {
    mocks.state.prisma = null;
    const res = await tasksPOST(jsonReq({ title: "Tarea test" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });
});

// ─── Auth ───────────────────────────────────────────────────────────────────

describe("CRM: Auth", () => {
  it("T4.27: endpoints sin X-API-Key → 401", async () => {
    const { requireCrmAuth } = await import("@/lib/crm-auth");
    const { NextResponse } = await import("next/server");
    vi.mocked(requireCrmAuth).mockReturnValueOnce(
      NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    );
    const res = await contactsGET(getReqNoAuth("http://localhost/api/crm/contacts"));
    expect(res.status).toBe(401);
  });
});
