import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type OutboxEventType = "sync_notion" | "send_email";

export interface OutboxPayload {
  [key: string]: unknown;
}

export async function publishOutboxEvent(
  type: OutboxEventType,
  aggregateType: string,
  aggregateId: string,
  payload: OutboxPayload = {},
): Promise<void> {
  if (!prisma) {
    console.warn("[outbox] prisma no disponible, evento no encolado:", {
      type,
      aggregateType,
      aggregateId,
    });
    return;
  }

  await prisma.outboxEvent.create({
    data: {
      type,
      aggregateType,
      aggregateId,
      payload: payload as Prisma.InputJsonValue,
    },
  });
}

export async function publishOutboxEventInTransaction(
  tx: Prisma.TransactionClient,
  type: OutboxEventType,
  aggregateType: string,
  aggregateId: string,
  payload: OutboxPayload = {},
): Promise<void> {
  await tx.outboxEvent.create({
    data: {
      type,
      aggregateType,
      aggregateId,
      payload: payload as Prisma.InputJsonValue,
    },
  });
}
