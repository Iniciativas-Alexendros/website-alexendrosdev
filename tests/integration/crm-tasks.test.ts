import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTACT_ID, DEAL_ID, jsonReq, getReq, buildPrisma } from "../helpers/crm";
import type { CrmMocks } from "../helpers/crm";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const fns = {
    taskFindMany: vi.fn(),
    taskCreate: vi.fn(),
    activityFindMany: vi.fn(),
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

const { POST: tasksPOST, GET: tasksGET } = await import("@/app/api/crm/tasks/route");
const { GET: activitiesGET } = await import("@/app/api/crm/activities/route");

function mockPrisma() {
  mocks.state.prisma = buildPrisma({
    ...(undefined as unknown as CrmMocks),
    taskFindMany: mocks.mocks.taskFindMany,
    taskCreate: mocks.mocks.taskCreate,
    activityFindMany: mocks.mocks.activityFindMany,
  } as CrmMocks);
}

beforeEach(() => {
  mocks.state.prisma = null;
  Object.values(mocks.mocks).forEach((m) => m.mockReset());
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// ─── Tasks ──────────────────────────────────────────────────────────────────

describe("CRM: Tasks", () => {
  it("GET tasks con ?contactId → 200 array filtrado", async () => {
    mockPrisma();
    mocks.mocks.taskFindMany.mockResolvedValue([
      { id: "t1", title: "Tarea de contacto", contactId: CONTACT_ID },
    ]);
    const res = await tasksGET(getReq(`http://localhost/api/crm/tasks?contactId=${CONTACT_ID}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mocks.mocks.taskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ contactId: CONTACT_ID }) }),
    );
  });

  it("POST task con dealId inválido (FK error) → 422", async () => {
    mockPrisma();
    mocks.mocks.taskCreate.mockRejectedValue(new Error("Foreign key constraint"));
    const res = await tasksPOST(
      jsonReq({ title: "Tarea con deal inválido", dealId: "00000000-0000-0000-0000-000000000000" }),
    );
    expect(res.status).toBe(422);
  });

  it("POST task con cuerpo JSON malformed → 400", async () => {
    mockPrisma();
    const req = new Request("http://localhost/api/crm/tasks", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "test-crm-key" },
      body: "esto-no-es-json",
    });
    const res = await tasksPOST(req);
    expect(res.status).toBe(400);
  });

  it("GET tasks sin prisma → 503", async () => {
    const res = await tasksGET(getReq("http://localhost/api/crm/tasks"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });

  it("POST tasks sin prisma → 503", async () => {
    const res = await tasksPOST(jsonReq({ title: "Tarea test" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("CRM no disponible.");
  });
});

// ─── Activities ─────────────────────────────────────────────────────────────

describe("CRM: Activities", () => {
  it("GET activities con ?dealId → 200 array", async () => {
    mockPrisma();
    mocks.mocks.activityFindMany.mockResolvedValue([{ id: "a1", dealId: DEAL_ID, title: "Nota" }]);
    const res = await activitiesGET(
      getReq(`http://localhost/api/crm/activities?dealId=${DEAL_ID}`),
    );
    expect(res.status).toBe(200);
  });
});
