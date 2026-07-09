import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { notion } from "@/lib/crm/notion";
import { notionToContact, notionToDeal } from "@/lib/crm/notion-mapper";
import type { NotionWebhookEvent } from "@/lib/crm/notion-types";

function getWebhookSecret(): string | null {
  return process.env.NOTION_WEBHOOK_SECRET ?? null;
}

function verifySignature(raw: string, signature: string | null): boolean {
  const secret = getWebhookSecret();
  if (!secret || !signature) return false;
  try {
    const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Busca un Contact por notionPageId tag en notes.
 */
async function findContactByNotionId(notionPageId: string) {
  if (!prisma) return null;
  return prisma.contact.findFirst({
    where: { notes: { contains: `[notion:${notionPageId}]` } },
  });
}

/**
 * Busca un Deal por notionPageId tag en notes.
 */
async function findDealByNotionId(notionPageId: string) {
  if (!prisma) return null;
  return prisma.deal.findFirst({
    where: { notes: { contains: `[notion:${notionPageId}]` } },
  });
}

export async function POST(req: Request) {
  // Degradación graceful si falta config
  if (!prisma || !notion || !getWebhookSecret()) {
    console.warn("[notion-webhook] config incompleta, ack sin procesar");
    return NextResponse.json({ ok: true });
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  // Verificar firma HMAC-SHA256
  const signature = req.headers.get("x-notion-signature");
  if (!verifySignature(raw, signature)) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  let event: NotionWebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  // Evento de verificación inicial (verification_token)
  if (event.verification_token) {
    console.info("[notion-webhook] verification_token recibido");
    return NextResponse.json({ ok: true });
  }

  switch (event.type) {
    case "page.properties_updated": {
      if (event.entity) {
        await handlePropertiesUpdated(event.entity.id);
      }
      break;
    }
    case "page.created":
    case "page.deleted":
    case "page.moved":
    case "page.content_updated":
      // Ack sin acción — Postgres es source of truth
      break;
    default:
      console.info(`[notion-webhook] evento no manejado: ${event.type}`);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Fetch página actualizada de Notion → upsert en Postgres.
 */
async function handlePropertiesUpdated(notionPageId: string) {
  if (!notion || !prisma) return;

  try {
    const page = await notion.pages.retrieve({ page_id: notionPageId });
    if (!("properties" in page)) return;

    const properties = page.properties as Record<string, unknown>;

    // Intentar actualizar Contact
    const contact = await findContactByNotionId(notionPageId);
    if (contact) {
      const partial = notionToContact(properties);
      if (Object.keys(partial).length > 0) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: partial,
        });
        console.info(`[notion-webhook] contacto ${contact.id} actualizado desde Notion`);
      }
      return;
    }

    // Intentar actualizar Deal
    const deal = await findDealByNotionId(notionPageId);
    if (deal) {
      const partial = notionToDeal(properties);
      const { stageName, ...dealData } = partial;
      if (Object.keys(dealData).length > 0 || stageName) {
        // Si cambió el stage name, buscar stageId correspondiente
        let stageId: string | undefined;
        if (stageName && prisma) {
          const stage = await prisma.pipelineStage.findFirst({
            where: { name: stageName },
          });
          if (stage) stageId = stage.id;
        }

        await prisma.deal.update({
          where: { id: deal.id },
          data: {
            ...dealData,
            ...(stageId ? { stageId } : {}),
          },
        });
        console.info(`[notion-webhook] deal ${deal.id} actualizado desde Notion`);
      }
      return;
    }

    console.info(`[notion-webhook] página ${notionPageId} no encontrada en Postgres`);
  } catch (err) {
    console.error("[notion-webhook] error procesando properties_updated:", err);
  }
}
