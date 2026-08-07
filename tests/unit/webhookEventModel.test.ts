import { prisma } from "@/lib/db";
import { describe, expect, it } from "vitest";

describe("WebhookEvent model", () => {
  it("prisma client has webhookEvent model when DB env is set", async () => {
    if (prisma) {
      expect(prisma.webhookEvent).toBeDefined();
    } else {
      // In CI without DATABASE_URL, prisma is null; test passes trivially
      expect(prisma).toBeNull();
    }
  });
});
