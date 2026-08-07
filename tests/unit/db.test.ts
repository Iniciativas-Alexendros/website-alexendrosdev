import { describe, expect, it, vi } from "vitest";

describe("db.ts createClient", () => {
  it("retorna null cuando DATABASE_URL no está configurada", async () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "";
    vi.resetModules();
    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeNull();
    process.env.DATABASE_URL = original;
  });
});
