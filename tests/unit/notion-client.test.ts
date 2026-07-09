import { describe, expect, it, vi } from "vitest";

// Mock de @notionhq/client
const MockClient = vi.fn();
vi.mock("@notionhq/client", () => ({ Client: MockClient }));

describe("Notion client", () => {
  it("notion es null cuando NOTION_API_KEY no está definida", async () => {
    const original = process.env.NOTION_API_KEY;
    delete process.env.NOTION_API_KEY;
    vi.resetModules();
    const { notion } = await import("@/lib/crm/notion");
    expect(notion).toBeNull();
    if (original) process.env.NOTION_API_KEY = original;
  });

  it("notion es Client cuando NOTION_API_KEY existe", async () => {
    process.env.NOTION_API_KEY = "secret_test";
    vi.resetModules();
    MockClient.mockImplementation(function (this: Record<string, unknown>, opts: unknown) {
      this.opts = opts;
    });
    const { notion } = await import("@/lib/crm/notion");
    expect(notion).not.toBeNull();
    delete process.env.NOTION_API_KEY;
  });

  it("requireNotion lanza NotionUnavailableError si notion es null", async () => {
    delete process.env.NOTION_API_KEY;
    vi.resetModules();
    const { requireNotion, NotionUnavailableError } = await import("@/lib/crm/notion");
    expect(() => requireNotion()).toThrow(NotionUnavailableError);
  });

  it("NotionUnavailableError tiene status 503", async () => {
    const { NotionUnavailableError } = await import("@/lib/crm/notion");
    const err = new NotionUnavailableError();
    expect(err.status).toBe(503);
    expect(err.message).toBe("Notion no disponible.");
  });
});
