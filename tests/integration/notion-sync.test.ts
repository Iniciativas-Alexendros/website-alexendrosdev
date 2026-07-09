import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Contact, Deal } from "@prisma/client";

// Mocks de Notion
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/crm/notion", () => ({
  get notion() {
    return mockNotionInstance;
  },
}));

let mockNotionInstance: { pages: { create: typeof mockCreate; update: typeof mockUpdate } } | null =
  null;

const { syncContactToNotion, syncDealToNotion, deleteNotionPage } =
  await import("@/lib/crm/notion-sync");

const baseContact: Contact = {
  id: "c1",
  type: "INDIVIDUAL",
  status: "LEAD",
  firstName: "Alex",
  lastName: "García",
  email: "alex@example.com",
  phone: null,
  company: null,
  position: null,
  website: null,
  notes: null,
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
};

const baseDeal: Deal & { stage?: { name: string } | null; contact?: { firstName: string } | null } =
  {
    id: "d1",
    title: "Proyecto web",
    contactId: "c1",
    stageId: "s1",
    value: 12000 as unknown as Deal["value"],
    currency: "eur",
    probability: 60,
    closedAt: null,
    notes: null,
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
    stage: { name: "Propuesta" },
    contact: { firstName: "Alex" },
  };

beforeEach(() => {
  mockCreate.mockReset();
  mockUpdate.mockReset();
  mockNotionInstance = { pages: { create: mockCreate, update: mockUpdate } };
  process.env.NOTION_CONTACTS_DB_ID = "db-contacts";
  process.env.NOTION_DEALS_DB_ID = "db-deals";
});

describe("syncContactToNotion", () => {
  it("crea page en Notion si no hay notionPageId", async () => {
    mockCreate.mockResolvedValue({ id: "notion-page-1" });
    const result = await syncContactToNotion(baseContact);
    expect(result.ok).toBe(true);
    expect(result.action).toBe("created");
    expect(result.notionPageId).toBe("notion-page-1");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ parent: { database_id: "db-contacts" } }),
    );
  });

  it("actualiza page existente si hay notionPageId en notes", async () => {
    const contact = { ...baseContact, notes: "algo\n[notion:existing-id]" };
    mockUpdate.mockResolvedValue({ id: "existing-id" });
    const result = await syncContactToNotion(contact);
    expect(result.ok).toBe(true);
    expect(result.action).toBe("updated");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ page_id: "existing-id" }));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("es best-effort: error de Notion no lanza excepción", async () => {
    mockCreate.mockRejectedValue(new Error("Notion API error"));
    const result = await syncContactToNotion(baseContact);
    expect(result.ok).toBe(false);
    expect(result.action).toBe("skipped");
  });

  it("devuelve skipped si notion es null", async () => {
    mockNotionInstance = null;
    const result = await syncContactToNotion(baseContact);
    expect(result.ok).toBe(true);
    expect(result.action).toBe("skipped");
  });
});

describe("syncDealToNotion", () => {
  it("crea page en Notion para deal nuevo", async () => {
    mockCreate.mockResolvedValue({ id: "notion-deal-1" });
    const result = await syncDealToNotion(baseDeal);
    expect(result.ok).toBe(true);
    expect(result.action).toBe("created");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ parent: { database_id: "db-deals" } }),
    );
  });

  it("actualiza page existente si hay notionPageId", async () => {
    const deal = { ...baseDeal, notes: "[notion:deal-page-id]" };
    mockUpdate.mockResolvedValue({ id: "deal-page-id" });
    const result = await syncDealToNotion(deal);
    expect(result.action).toBe("updated");
  });
});

describe("deleteNotionPage", () => {
  it("archiva página en Notion", async () => {
    mockUpdate.mockResolvedValue({ id: "page-1" });
    const result = await deleteNotionPage("page-1");
    expect(result.ok).toBe(true);
    expect(result.action).toBe("deleted");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ page_id: "page-1", archived: true }),
    );
  });

  it("devuelve skipped si notion es null", async () => {
    mockNotionInstance = null;
    const result = await deleteNotionPage("page-1");
    expect(result.ok).toBe(true);
    expect(result.action).toBe("skipped");
  });
});
