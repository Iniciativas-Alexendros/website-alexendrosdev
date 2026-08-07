import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "crypto";

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
    webhookEvent: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
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

describe("Notion Webhook Idempotency", () => {
  it("ignora evento duplicado (mismo payload hash → ya procesado)", async () => {
    const body = {
      id: "evt-dup-1",
      type: "page.properties_updated",
      timestamp: "2026-07-09T10:00:00Z",
      entity: { id: "notion-page-1", type: "page" },
    };

    // Primer request: no existe → procesa
    mocks.prisma.webhookEvent.findUnique.mockResolvedValueOnce(null);
    mocks.prisma.webhookEvent.upsert.mockResolvedValueOnce({});
    mocks.prisma.contact.findFirst.mockResolvedValueOnce(null);
    mocks.prisma.deal.findFirst.mockResolvedValueOnce(null);
    mocks.notion.pages.retrieve.mockResolvedValueOnce({
      properties: { Nombre: { title: [{ text: { content: "Test" } }] } },
    });

    const res1 = await webhookPOST(webhookReq(body));
    expect(res1.status).toBe(200);

    // Segundo request mismo payload: ya procesado → skip
    mocks.prisma.webhookEvent.findUnique.mockResolvedValueOnce({
      status: "processed",
    });

    const res2 = await webhookPOST(webhookReq(body));
    expect(res2.status).toBe(200);

    // Solo se hizo upsert una vez (en el primer request)
    expect(mocks.prisma.webhookEvent.upsert).toHaveBeenCalledTimes(1);
    // En el segundo request no se busca contacto ni deal (ya procesado)
    expect(mocks.prisma.contact.findFirst).toHaveBeenCalledTimes(1);
  });

  it("procesa el mismo evento tras fallo previo (status != processed)", async () => {
    const body = {
      id: "evt-retry-1",
      type: "page.properties_updated",
      timestamp: "2026-07-09T10:00:00Z",
      entity: { id: "notion-page-2", type: "page" },
    };

    // Primer request: no existe → procesa
    mocks.prisma.webhookEvent.findUnique.mockResolvedValueOnce(null);
    mocks.prisma.webhookEvent.upsert.mockResolvedValueOnce({});
    mocks.prisma.contact.findFirst.mockResolvedValueOnce(null);
    mocks.prisma.deal.findFirst.mockResolvedValueOnce(null);
    mocks.notion.pages.retrieve.mockResolvedValueOnce({
      properties: { Nombre: { title: [{ text: { content: "Test" } }] } },
    });

    const res1 = await webhookPOST(webhookReq(body));
    expect(res1.status).toBe(200);

    // Segundo request: existe pero status = "failed" → reprocesa
    mocks.prisma.webhookEvent.findUnique.mockResolvedValueOnce({
      status: "processing",
    });
    mocks.prisma.webhookEvent.upsert.mockResolvedValueOnce({});
    mocks.prisma.contact.findFirst.mockResolvedValueOnce(null);
    mocks.prisma.deal.findFirst.mockResolvedValueOnce(null);
    mocks.notion.pages.retrieve.mockResolvedValueOnce({
      properties: { Nombre: { title: [{ text: { content: "Test" } }] } },
    });

    const res2 = await webhookPOST(webhookReq(body));
    expect(res2.status).toBe(200);

    // Se hizo upsert dos veces (reintento)
    expect(mocks.prisma.webhookEvent.upsert).toHaveBeenCalledTimes(2);
  });
});
