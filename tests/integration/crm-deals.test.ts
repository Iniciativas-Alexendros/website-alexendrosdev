import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONTACT_ID,
  DEAL_ID,
  STAGE_NUEVO_ID,
  STAGE_CONTACTADO_ID,
  STAGE_DISCOVERY_ID,
  STAGE_PROPUESTA_ID,
  STAGE_NEGOCIACION_ID,
  STAGE_CERRADO_PERDIDO_ID,
  jsonReq,
  getReq,
  buildPrisma,
} from "../helpers/crm";
import type { CrmMocks } from "../helpers/crm";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const fns = {
    dealFindMany: vi.fn(),
    dealCreate: vi.fn(),
    dealUpdate: vi.fn(),
    dealFindFirst: vi.fn(),
    pipelineStageFindFirst: vi.fn(),
    activityCreate: vi.fn(),
    pipelineStageFindMany: vi.fn(),
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

vi.mock("@/lib/crm-auth", () => ({
  requireCrmAuth: vi.fn(() => undefined),
}));

const { POST: dealsPOST, GET: dealsGET } = await import("@/app/api/crm/deals/route");
const { PATCH: dealsPATCH } = await import("@/app/api/crm/deals/[id]/route");

function mockPrisma() {
  mocks.state.prisma = buildPrisma({
    ...(undefined as unknown as CrmMocks),
    dealFindMany: mocks.mocks.dealFindMany,
    dealCreate: mocks.mocks.dealCreate,
    dealUpdate: mocks.mocks.dealUpdate,
    dealFindFirst: mocks.mocks.dealFindFirst,
    pipelineStageFindFirst: mocks.mocks.pipelineStageFindFirst,
    activityCreate: mocks.mocks.activityCreate,
    pipelineStageFindMany: mocks.mocks.pipelineStageFindMany,
  } as CrmMocks);
}

beforeEach(() => {
  mocks.state.prisma = null;
  Object.values(mocks.mocks).forEach((m) => m.mockReset());
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// ─── Deals ──────────────────────────────────────────────────────────────────

describe("CRM: Deals", () => {
  it("T4.11: GET deals → 200 array", async () => {
    mockPrisma();
    mocks.mocks.dealFindMany.mockResolvedValue([{ id: DEAL_ID, title: "Test" }]);
    const res = await dealsGET(getReq("http://localhost/api/crm/deals"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("T4.12: POST deal → 201 con stage Nuevo automático", async () => {
    mockPrisma();
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
    mockPrisma();
    const res = await dealsPOST(jsonReq({ title: "Sin contacto" }));
    expect(res.status).toBe(422);
  });

  it("T4.14: POST contactId inexistente → 422", async () => {
    mockPrisma();
    mocks.mocks.dealCreate.mockRejectedValue(new Error("Foreign key constraint"));
    const res = await dealsPOST(
      jsonReq({ title: "Deal", contactId: "00000000-0000-0000-0000-000000000000" }),
    );
    expect(res.status).toBe(422);
  });

  it("T4.28: GET deals con filtros stageId+contactId", async () => {
    mockPrisma();
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
        where: expect.objectContaining({ stageId: STAGE_NUEVO_ID, contactId: CONTACT_ID }),
      }),
    );
  });

  it("T4.29: POST deal sin initialStage (pipeline vacío) → 201 con stageId null", async () => {
    mockPrisma();
    mocks.mocks.pipelineStageFindFirst.mockResolvedValue(null);
    mocks.mocks.dealCreate.mockResolvedValue({
      id: DEAL_ID,
      title: "Deal sin stage",
      stageId: null,
    });
    const res = await dealsPOST(jsonReq({ title: "Deal sin stage", contactId: CONTACT_ID }));
    expect(res.status).toBe(201);
    expect(mocks.mocks.dealCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ stageId: null }) }),
    );
  });

  it("T4.30: POST deal con items → 201 con items.create", async () => {
    mockPrisma();
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
    const res = await dealsPOST(
      jsonReq({
        title: "Deal con items",
        contactId: CONTACT_ID,
        value: 500000,
        items: [{ productId: PRODUCT_ID, quantity: 2, unitPrice: 250000 }],
      }),
    );
    expect(res.status).toBe(201);
  });

  it("T4.47: GET deals sin prisma → 503", async () => {
    const res = await dealsGET(getReq("http://localhost/api/crm/deals"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });

  it("T4.48: POST deals sin prisma → 503", async () => {
    const res = await dealsPOST(jsonReq({ title: "Test", contactId: CONTACT_ID }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });

  it("T4.49: POST deals con JSON malformed → 400", async () => {
    mockPrisma();
    const req = new Request("http://localhost/api/crm/deals", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "test-crm-key" },
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
    mockPrisma();
    mocks.mocks.dealFindFirst.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_NUEVO_ID });
    mocks.mocks.pipelineStageFindFirst
      .mockResolvedValueOnce({ id: STAGE_CONTACTADO_ID, order: 1, name: "Contactado" })
      .mockResolvedValueOnce({ id: STAGE_NUEVO_ID, order: 0, name: "Nuevo" });
    mocks.mocks.dealUpdate.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_CONTACTADO_ID });
    mocks.mocks.activityCreate.mockResolvedValue({ id: "a1" });
    const res = await dealsPATCH(jsonReq({ stageId: STAGE_CONTACTADO_ID }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(200);
  });

  it("T4.16: PATCH stageId inexistente → 422", async () => {
    mockPrisma();
    mocks.mocks.dealFindFirst.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_NUEVO_ID });
    mocks.mocks.pipelineStageFindFirst.mockResolvedValue(null);
    const res = await dealsPATCH(
      jsonReq({ stageId: "00000000-0000-0000-0000-000000000000" }, "PATCH"),
      { params: Promise.resolve({ id: DEAL_ID }) },
    );
    expect(res.status).toBe(422);
  });

  it("T4.17: PATCH deal crea Activity transición", async () => {
    mockPrisma();
    mocks.mocks.dealFindFirst.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_NUEVO_ID });
    mocks.mocks.pipelineStageFindFirst
      .mockResolvedValueOnce({ id: STAGE_CONTACTADO_ID, order: 1, name: "Contactado" })
      .mockResolvedValueOnce({ id: STAGE_NUEVO_ID, order: 0, name: "Nuevo" });
    mocks.mocks.dealUpdate.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_CONTACTADO_ID });
    mocks.mocks.activityCreate.mockResolvedValue({ id: "a2" });
    await dealsPATCH(jsonReq({ stageId: STAGE_CONTACTADO_ID }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(mocks.mocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "NOTE", dealId: DEAL_ID }),
      }),
    );
  });

  it("P2.1: PATCH deal no encontrado → 404", async () => {
    mockPrisma();
    mocks.mocks.dealFindFirst.mockResolvedValue(null);
    const res = await dealsPATCH(jsonReq({ stageId: STAGE_CONTACTADO_ID }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(404);
    expect(mocks.mocks.dealUpdate).not.toHaveBeenCalled();
  });

  it("P2.2: PATCH transición desde stage terminal (Cerrado perdido) → 422", async () => {
    mockPrisma();
    mocks.mocks.dealFindFirst.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_CERRADO_PERDIDO_ID });
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
    mockPrisma();
    mocks.mocks.dealFindFirst.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_NUEVO_ID });
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
    mockPrisma();
    mocks.mocks.dealFindFirst.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_PROPUESTA_ID });
    mocks.mocks.pipelineStageFindFirst
      .mockResolvedValueOnce({ id: STAGE_NEGOCIACION_ID, order: 4, name: "Negociación" })
      .mockResolvedValueOnce({ id: STAGE_PROPUESTA_ID, order: 3, name: "Propuesta" });
    mocks.mocks.dealUpdate.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_NEGOCIACION_ID });
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
    mockPrisma();
    mocks.mocks.dealFindFirst.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_CONTACTADO_ID });
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
    expect(mocks.mocks.dealUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DEAL_ID },
        data: expect.objectContaining({ stageId: STAGE_DISCOVERY_ID, closedAt: expect.any(Date) }),
      }),
    );
    const callArg = mocks.mocks.dealUpdate.mock.calls[0][0];
    expect(callArg.data.closedAt.toISOString()).toBe(explicitClosedAt);
  });

  it("T4.41: PATCH con body inválido → 422 (Zod rejection)", async () => {
    mockPrisma();
    const res = await dealsPATCH(jsonReq({ probability: "not-a-number" }, "PATCH"), {
      params: Promise.resolve({ id: DEAL_ID }),
    });
    expect(res.status).toBe(422);
    expect(mocks.mocks.dealUpdate).not.toHaveBeenCalled();
  });

  it("T4.42: PATCH sin stageId (solo probability) → 200, no activity", async () => {
    mockPrisma();
    mocks.mocks.dealFindFirst.mockResolvedValue({ id: DEAL_ID, stageId: STAGE_NUEVO_ID });
    mocks.mocks.dealUpdate.mockResolvedValue({ id: DEAL_ID, probability: 50 });
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
