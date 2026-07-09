import { beforeEach, describe, expect, it, vi } from "vitest";

import { createHmac } from "crypto";

// Hoisted mocks
const mocks = vi.hoisted(() => ({
  prisma: {
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

const { POST: webhookPOST } = await import("@/app/api/crm/notion-webhook/route");

// Helper para crear request con firma válida
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

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NOTION_WEBHOOK_SECRET = "test-webhook-secret";
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("Notion Webhook", () => {
  it("verification_token → 200", async () => {
    const res = await webhookReq({ verification_token: "secret_xxx" });
    const result = await webhookPOST(res);
    expect(result.status).toBe(200);
  });

  it("firma inválida → 401", async () => {
    const res = webhookReq({ type: "page.created" }, false);
    const result = await webhookPOST(res);
    expect(result.status).toBe(401);
  });

  it("page.created → 200 sin acción", async () => {
    const res = webhookReq({
      id: "evt-1",
      type: "page.created",
      timestamp: "2026-07-09T10:00:00Z",
      entity: { id: "page-1", type: "page" },
    });
    const result = await webhookPOST(res);
    expect(result.status).toBe(200);
    expect(mocks.prisma.contact.findFirst).not.toHaveBeenCalled();
  });

  it("page.deleted → 200 sin acción", async () => {
    const res = webhookReq({
      id: "evt-2",
      type: "page.deleted",
      timestamp: "2026-07-09T10:00:00Z",
      entity: { id: "page-1", type: "page" },
    });
    const result = await webhookPOST(res);
    expect(result.status).toBe(200);
  });

  it("page.properties_updated → actualiza Contact en Postgres", async () => {
    mocks.prisma.contact.findFirst.mockResolvedValue({
      id: "contact-1",
      notes: "[notion:notion-page-1]",
    });
    mocks.notion.pages.retrieve.mockResolvedValue({
      properties: {
        Nombre: { title: [{ text: { content: "Alex" } }] },
        Email: { email: "nuevo@email.com" },
      },
    });
    mocks.prisma.contact.update.mockResolvedValue({});

    const res = webhookReq({
      id: "evt-3",
      type: "page.properties_updated",
      timestamp: "2026-07-09T10:00:00Z",
      entity: { id: "notion-page-1", type: "page" },
    });
    const result = await webhookPOST(res);
    expect(result.status).toBe(200);
    expect(mocks.prisma.contact.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "contact-1" },
        data: expect.objectContaining({ email: "nuevo@email.com" }),
      }),
    );
  });

  it("page.properties_updated → actualiza Deal en Postgres", async () => {
    mocks.prisma.contact.findFirst.mockResolvedValue(null);
    mocks.prisma.deal.findFirst.mockResolvedValue({
      id: "deal-1",
      notes: "[notion:notion-deal-1]",
    });
    mocks.notion.pages.retrieve.mockResolvedValue({
      properties: {
        Nombre: { title: [{ text: { content: "Retainer" } }] },
        Probabilidad: { number: 90 },
        Fase: { select: { name: "Negociación" } },
      },
    });
    mocks.prisma.pipelineStage.findFirst.mockResolvedValue({
      id: "stage-neg",
      name: "Negociación",
    });
    mocks.prisma.deal.update.mockResolvedValue({});

    const res = webhookReq({
      id: "evt-4",
      type: "page.properties_updated",
      timestamp: "2026-07-09T10:00:00Z",
      entity: { id: "notion-deal-1", type: "page" },
    });
    const result = await webhookPOST(res);
    expect(result.status).toBe(200);
    expect(mocks.prisma.deal.update).toHaveBeenCalled();
  });

  it("page.properties_updated → página no encontrada en Postgres → 200", async () => {
    mocks.prisma.contact.findFirst.mockResolvedValue(null);
    mocks.prisma.deal.findFirst.mockResolvedValue(null);
    mocks.notion.pages.retrieve.mockResolvedValue({
      properties: {
        Nombre: { title: [{ text: { content: "Desconocido" } }] },
      },
    });

    const res = webhookReq({
      id: "evt-5",
      type: "page.properties_updated",
      timestamp: "2026-07-09T10:00:00Z",
      entity: { id: "unknown-page", type: "page" },
    });
    const result = await webhookPOST(res);
    expect(result.status).toBe(200);
  });

  it("degraded (sin NOTION_WEBHOOK_SECRET) → 200 sin procesar", async () => {
    delete process.env.NOTION_WEBHOOK_SECRET;
    const res = new Request("http://localhost/api/crm/notion-webhook", {
      method: "POST",
      body: JSON.stringify({ type: "page.created" }),
    });
    const result = await webhookPOST(res);
    expect(result.status).toBe(200);
  });
});
