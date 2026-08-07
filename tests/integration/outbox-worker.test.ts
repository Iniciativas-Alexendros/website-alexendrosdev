import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const findMany = vi.fn();
  const update = vi.fn();
  const findUnique = vi.fn();
  return {
    state: {
      prisma: null as null | {
        outboxEvent: {
          create: ReturnType<typeof vi.fn>;
          findMany: typeof findMany;
          update: typeof update;
          count: ReturnType<typeof vi.fn>;
        };
        contact: { findUnique: typeof findUnique };
        deal: { findUnique: typeof findUnique };
      },
      resendSend: null as null | ReturnType<typeof vi.fn>,
    },
    findMany,
    update,
    findUnique,
  };
});

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.state.prisma;
  },
}));

vi.mock("@/lib/email", () => ({
  get resend() {
    return mocks.state.resendSend ? { emails: { send: mocks.state.resendSend } } : null;
  },
  EMAIL_FROM: "test@alexendros.dev",
}));

vi.mock("@/lib/crm/notion-sync", () => ({
  syncContactToNotion: vi.fn().mockResolvedValue({ ok: true }),
  syncDealToNotion: vi.fn().mockResolvedValue({ ok: true }),
}));

const { runOutboxWorker } = await import("@/lib/services/outbox-worker");

describe("outbox worker", () => {
  beforeEach(() => {
    mocks.state.prisma = {
      outboxEvent: {
        create: vi.fn(),
        findMany: mocks.findMany,
        update: mocks.update,
        count: vi.fn(),
      },
      contact: { findUnique: mocks.findUnique },
      deal: { findUnique: mocks.findUnique },
    };
    mocks.state.resendSend = vi.fn().mockResolvedValue({ id: "email-1" });
    mocks.findMany.mockReset();
    mocks.update.mockReset();
    mocks.findUnique.mockReset();
    vi.mocked(mocks.state.prisma.outboxEvent.count).mockResolvedValue(0);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("retorna zeros cuando no hay eventos", async () => {
    mocks.findMany.mockResolvedValue([]);
    const result = await runOutboxWorker();
    expect(result).toEqual({
      processed: 0,
      succeeded: 0,
      failed: 0,
      dead: 0,
      remaining: 0,
    });
  });

  it("procesa eventos pending y los marca como processed", async () => {
    const events = [
      {
        id: "evt-1",
        type: "send_email",
        aggregateType: "Subscriber",
        aggregateId: "user@test.dev",
        payload: { template: "newsletter", subject: "Hi", body: "Body" },
        attempts: 0,
      },
    ];
    mocks.findMany.mockResolvedValue(events);
    mocks.update.mockResolvedValue({});

    const result = await runOutboxWorker();
    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.dead).toBe(0);
  });

  it("incrementa attempts y agenda reintento en fallo", async () => {
    const events = [
      {
        id: "evt-2",
        type: "send_email",
        aggregateType: "Subscriber",
        aggregateId: "fail@test.dev",
        payload: { template: "newsletter", subject: "Hi", body: "Body" },
        attempts: 0,
      },
    ];
    mocks.findMany.mockResolvedValue(events);
    mocks.update.mockResolvedValue({});
    mocks.state.resendSend = vi.fn().mockRejectedValue(new Error("SMTP error"));

    const result = await runOutboxWorker();
    expect(result.failed).toBe(1);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "evt-2" },
        data: expect.objectContaining({
          status: "failed",
          attempts: 1,
        }),
      }),
    );
  });

  it("marca como dead cuando excede max_attempts", async () => {
    const events = [
      {
        id: "evt-3",
        type: "send_email",
        aggregateType: "Subscriber",
        aggregateId: "dead@test.dev",
        payload: { template: "newsletter", subject: "Hi", body: "Body" },
        attempts: 5,
      },
    ];
    mocks.findMany.mockResolvedValue(events);
    mocks.update.mockResolvedValue({});

    const result = await runOutboxWorker();
    expect(result.dead).toBe(1);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "evt-3" },
        data: { status: "dead" },
      }),
    );
  });

  it("procesa sync_notion para Contact", async () => {
    const events = [
      {
        id: "evt-4",
        type: "sync_notion",
        aggregateType: "Contact",
        aggregateId: "contact-1",
        payload: { action: "created" },
        attempts: 0,
      },
    ];
    mocks.findMany.mockResolvedValue(events);
    mocks.findUnique.mockResolvedValue({ id: "contact-1" });
    mocks.update.mockResolvedValue({});

    const result = await runOutboxWorker();
    expect(result.succeeded).toBe(1);
  });

  it("procesa sync_notion para Deal", async () => {
    const events = [
      {
        id: "evt-5",
        type: "sync_notion",
        aggregateType: "Deal",
        aggregateId: "deal-1",
        payload: { action: "created" },
        attempts: 0,
      },
    ];
    mocks.findMany.mockResolvedValue(events);
    mocks.findUnique.mockResolvedValue({ id: "deal-1", stage: null, contact: null });
    mocks.update.mockResolvedValue({});

    const result = await runOutboxWorker();
    expect(result.succeeded).toBe(1);
  });
});
