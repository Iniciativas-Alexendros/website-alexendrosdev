import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "crypto";

const mocks = vi.hoisted(() => ({
  prisma: {
    task: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    contact: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    deal: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    pipelineStage: {
      findFirst: vi.fn(),
    },
  },
  notion: {
    pages: {
      retrieve: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma;
  },
}));

vi.mock("@/lib/crm/notion", () => ({
  get notion() {
    return mocks.notion;
  },
}));

import { POST as tasksPOST, GET as tasksGET } from "@/app/api/crm/tasks/route";
import { POST as webhookPOST } from "@/app/api/crm/notion-webhook/route";
import { requireCrmAuth } from "@/lib/crm-auth";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRM_API_KEY = "test-crm-key";
  process.env.NOTION_WEBHOOK_SECRET = "test-webhook-secret";
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("P0 Hardening: CRM Tasks Route", () => {
  const crmHeader = {
    "x-api-key": "test-crm-key",
    "content-type": "application/json",
  };

  it("POST /api/crm/tasks -> 201 on success", async () => {
    mocks.prisma.task.create.mockResolvedValue({ id: "task-1", title: "Test" });
    const req = new Request("http://localhost/api/crm/tasks", {
      method: "POST",
      headers: crmHeader,
      body: JSON.stringify({ title: "Test task", priority: "HIGH" }),
    });
    const res = await tasksPOST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe("task-1");
  });

  it("POST /api/crm/tasks -> 422 on validation error", async () => {
    const req = new Request("http://localhost/api/crm/tasks", {
      method: "POST",
      headers: crmHeader,
      body: JSON.stringify({ priority: "HIGH" }), // missing title
    });
    const res = await tasksPOST(req);
    expect(res.status).toBe(422);
  });

  it("GET /api/crm/tasks -> 200 list", async () => {
    mocks.prisma.task.findMany.mockResolvedValue([{ id: "task-1", title: "Test" }]);
    const req = new Request("http://localhost/api/crm/tasks?dealId=123", {
      method: "GET",
      headers: crmHeader,
    });
    const res = await tasksGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });
});

describe("P0 Hardening: Notion Webhook 500 on Fail", () => {
  function webhookReq(body: unknown, validSignature = true) {
    const raw = JSON.stringify(body);
    const secret = "test-webhook-secret";
    const sig = validSignature
      ? `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`
      : "sha256=invalid";

    return new Request("http://localhost/api/crm/notion-webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-notion-signature": sig,
      },
      body: raw,
    });
  }

  it("POST /api/crm/notion-webhook -> 500 when Postgres update fails", async () => {
    mocks.prisma.contact.findFirst.mockResolvedValue({
      id: "contact-1",
      notes: "[notion:page-1]",
    });
    mocks.notion.pages.retrieve.mockResolvedValue({
      properties: {
        Nombre: { title: [{ text: { content: "Alex" } }] },
      },
    });
    mocks.prisma.contact.update.mockRejectedValue(new Error("db error"));

    const req = webhookReq({
      id: "evt-1",
      type: "page.properties_updated",
      entity: { id: "page-1", type: "page" },
    });

    const res = await webhookPOST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("No se pudo procesar la actualización.");
  });
});

describe("P0 Hardening: CRM Auth Brute Force and Timing-Safe", () => {
  it("requireCrmAuth timing-safe and rate-limit on failed auths", async () => {
    process.env.CRM_API_KEY = "";
    const req503 = new Request("http://localhost/api/crm/contacts");
    const res503 = requireCrmAuth(req503);
    expect(res503?.status).toBe(503);

    process.env.CRM_API_KEY = "test-crm-key";

    const req401 = new Request("http://localhost/api/crm/contacts");
    const res401 = requireCrmAuth(req401);
    expect(res401?.status).toBe(401);

    const reqOk = new Request("http://localhost/api/crm/contacts", {
      headers: { "x-api-key": "test-crm-key" },
    });
    const resOk = requireCrmAuth(reqOk);
    expect(resOk).toBeUndefined();

    // 30 peticiones con claves incorrectas desde una IP aislada (1.2.3.4)
    for (let i = 0; i < 30; i++) {
      const reqFail = new Request("http://localhost/api/crm/contacts", {
        headers: { "x-api-key": "wrong-key-" + i, "x-real-ip": "1.2.3.4" },
      });
      const resFail = requireCrmAuth(reqFail);
      expect(resFail?.status).toBe(401);
    }

    // La petición 31 debe lanzar 429
    const reqLimit = new Request("http://localhost/api/crm/contacts", {
      headers: { "x-api-key": "wrong-key-31", "x-real-ip": "1.2.3.4" },
    });
    const resLimit = requireCrmAuth(reqLimit);
    expect(resLimit?.status).toBe(429);
    const limitBody = await resLimit?.json();
    expect(limitBody.error).toBe("Demasiadas solicitudes.");
  });
});
