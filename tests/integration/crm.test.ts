import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONTACT_ID,
  STAGE_NUEVO_ID,
  STAGE_CONTACTADO_ID,
  jsonReq,
  getReq,
  getReqNoAuth,
  buildPrisma,
} from "../helpers/crm";
import type { CrmMocks } from "../helpers/crm";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const fns = {
    contactFindMany: vi.fn(),
    contactCreate: vi.fn(),
    pipelineStageFindMany: vi.fn(),
    productFindMany: vi.fn(),
    productCreate: vi.fn(),
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

const { POST: contactsPOST, GET: contactsGET } = await import("@/app/api/crm/contacts/route");
const { GET: pipelineGET } = await import("@/app/api/crm/pipeline-stages/route");
const { POST: productsPOST, GET: productsGET } = await import("@/app/api/crm/products/route");

function mockPrisma() {
  mocks.state.prisma = buildPrisma({
    ...(undefined as unknown as CrmMocks),
    contactFindMany: mocks.mocks.contactFindMany,
    contactCreate: mocks.mocks.contactCreate,
    pipelineStageFindMany: mocks.mocks.pipelineStageFindMany,
    productFindMany: mocks.mocks.productFindMany,
    productCreate: mocks.mocks.productCreate,
  } as CrmMocks);
}

beforeEach(() => {
  mocks.state.prisma = null;
  Object.values(mocks.mocks).forEach((m) => m.mockReset());
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// ─── Contacts ───────────────────────────────────────────────────────────────

describe("CRM: Contacts", () => {
  it("T4.7: GET contacts → 200 array", async () => {
    mockPrisma();
    mocks.mocks.contactFindMany.mockResolvedValue([{ id: CONTACT_ID, firstName: "Test" }]);
    const res = await contactsGET(getReq("http://localhost/api/crm/contacts"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it("T4.8: POST contact → 201", async () => {
    mockPrisma();
    mocks.mocks.contactCreate.mockResolvedValue({ id: CONTACT_ID, firstName: "Nuevo" });
    const res = await contactsPOST(jsonReq({ firstName: "Nuevo", email: "test@example.com" }));
    expect(res.status).toBe(201);
  });

  it("T4.9: POST email duplicado → 201 (Contact no unique email)", async () => {
    mockPrisma();
    mocks.mocks.contactCreate.mockResolvedValue({ id: CONTACT_ID, firstName: "Dup" });
    const res = await contactsPOST(jsonReq({ firstName: "Dup", email: "dup@example.com" }));
    expect(res.status).toBe(201);
  });

  it("T4.10: POST sin firstName → 422", async () => {
    mockPrisma();
    const res = await contactsPOST(jsonReq({ lastName: "Solo" }));
    expect(res.status).toBe(422);
  });
});

// ─── Pipeline Stages ────────────────────────────────────────────────────────

describe("CRM: Pipeline Stages", () => {
  it("T4.18: GET pipeline-stages → 200, ordenados por order", async () => {
    mockPrisma();
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
      expect.objectContaining({ orderBy: { order: "asc" } }),
    );
  });
});

// ─── Products ───────────────────────────────────────────────────────────────

describe("CRM: Products", () => {
  it("T4.19: GET products → 200", async () => {
    mockPrisma();
    mocks.mocks.productFindMany.mockResolvedValue([{ id: "p1", name: "Retainer" }]);
    const res = await productsGET(getReq("http://localhost/api/crm/products"));
    expect(res.status).toBe(200);
  });

  it("T4.20: POST product → 201", async () => {
    mockPrisma();
    mocks.mocks.productCreate.mockResolvedValue({ id: "p2", name: "Nuevo producto" });
    const res = await productsPOST(jsonReq({ name: "Nuevo producto", unitPrice: 5000 }));
    expect(res.status).toBe(201);
  });
});

// ─── Auth ───────────────────────────────────────────────────────────────────

describe("CRM: Auth", () => {
  it("T4.27: endpoints sin X-API-Key → 401", async () => {
    mockPrisma();
    const { requireCrmAuth } = await import("@/lib/crm-auth");
    const { NextResponse } = await import("next/server");
    vi.mocked(requireCrmAuth).mockReturnValueOnce(
      NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    );
    const res = await contactsGET(getReqNoAuth("http://localhost/api/crm/contacts"));
    expect(res.status).toBe(401);
  });
});
