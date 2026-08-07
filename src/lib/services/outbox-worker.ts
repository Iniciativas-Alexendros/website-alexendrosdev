import "server-only";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/email";
import { syncContactToNotion, syncDealToNotion } from "@/lib/crm/notion-sync";
import { LeadNotification } from "@/emails/LeadNotification";
import { NewsletterEmail } from "@/emails/NewsletterEmail";
import type { OutboxEvent } from "@/generated/prisma/client";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 10;

function backoffMs(attempts: number): number {
  return Math.pow(2, attempts) * 60_000;
}

async function processEvent(event: OutboxEvent): Promise<{ success: boolean; error?: string }> {
  if (event.type === "sync_notion") {
    return processSyncNotion(event);
  }
  if (event.type === "send_email") {
    return processSendEmail(event);
  }
  return { success: false, error: `tipo de evento desconocido: ${event.type}` };
}

async function processSyncNotion(
  event: OutboxEvent,
): Promise<{ success: boolean; error?: string }> {
  const { aggregateType, aggregateId } = event;

  if (aggregateType === "Contact") {
    if (!prisma) return { success: false, error: "prisma no disponible" };
    const contact = await prisma.contact.findUnique({ where: { id: aggregateId } });
    if (!contact) return { success: false, error: `contacto ${aggregateId} no encontrado` };
    const result = await syncContactToNotion(contact);
    return result.ok
      ? { success: true }
      : { success: false, error: result.error ?? "error desconocido" };
  }

  if (aggregateType === "Deal") {
    if (!prisma) return { success: false, error: "prisma no disponible" };
    const deal = await prisma.deal.findUnique({
      where: { id: aggregateId },
      include: { stage: true, contact: true },
    });
    if (!deal) return { success: false, error: `deal ${aggregateId} no encontrado` };
    const result = await syncDealToNotion(deal);
    return result.ok
      ? { success: true }
      : { success: false, error: result.error ?? "error desconocido" };
  }

  return { success: false, error: `aggregateType desconocido: ${aggregateType}` };
}

async function processSendEmail(event: OutboxEvent): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: "Resend no configurado" };
  }

  const payload = event.payload as Record<string, unknown>;
  const template = payload.template as string;
  const subject = payload.subject as string;
  const to = payload.to as string;

  try {
    if (template === "lead_notification") {
      await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        replyTo: payload.replyTo as string,
        react: LeadNotification({
          name: payload.name as string,
          email: payload.email as string,
          type: payload.type as string,
          message: payload.message as string,
        }),
      });
    } else if (template === "newsletter") {
      await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        react: NewsletterEmail({
          subject,
          body: payload.body as string,
        }),
      });
    } else {
      return { success: false, error: `template desconocido: ${template}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface WorkerResult {
  processed: number;
  succeeded: number;
  failed: number;
  dead: number;
  remaining: number;
}

export async function runOutboxWorker(): Promise<WorkerResult> {
  if (!prisma) {
    return { processed: 0, succeeded: 0, failed: 0, dead: 0, remaining: 0 };
  }

  const now = new Date();

  const events = await prisma.outboxEvent.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      availableAt: { lte: now },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  let succeeded = 0;
  let failed = 0;
  let dead = 0;

  for (const event of events) {
    if (event.attempts >= MAX_ATTEMPTS) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "dead" },
      });
      dead++;
      continue;
    }

    const result = await processEvent(event);

    if (result.success) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "processed", processedAt: new Date() },
      });
      succeeded++;
    } else {
      const newAttempts = event.attempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: "dead",
            attempts: newAttempts,
            lastError: result.error,
          },
        });
        dead++;
      } else {
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: "failed",
            attempts: newAttempts,
            lastError: result.error,
            availableAt: new Date(now.getTime() + backoffMs(newAttempts)),
          },
        });
        failed++;
      }
    }
  }

  const remaining = await prisma.outboxEvent.count({
    where: { status: { in: ["pending", "failed"] } },
  });

  return {
    processed: events.length,
    succeeded,
    failed,
    dead,
    remaining,
  };
}
