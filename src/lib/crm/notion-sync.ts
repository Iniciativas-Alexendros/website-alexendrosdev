import type { Contact, Deal } from "@prisma/client";
import { notion } from "./notion";
import { contactToNotion, dealToNotion, extractNotionPageId } from "./notion-mapper";
import type { NotionSyncResult } from "./notion-types";

function getContactsDbId(): string | null {
  return process.env.NOTION_CONTACTS_DB_ID ?? null;
}

function getDealsDbId(): string | null {
  return process.env.NOTION_DEALS_DB_ID ?? null;
}

/**
 * Sincroniza un Contact de Prisma a Notion (create o update).
 * Best-effort: si Notion no está configurado o falla, loggea y continúa.
 */
export async function syncContactToNotion(contact: Contact): Promise<NotionSyncResult> {
  const contactsDbId = getContactsDbId();
  if (!notion || !contactsDbId) {
    return { ok: true, action: "skipped" };
  }

  try {
    const notionPageId = extractNotionPageId(contact.notes);
    const { database_id, properties } = contactToNotion(contact, contactsDbId);

    if (notionPageId) {
      // Update existente
      await notion.pages.update({
        page_id: notionPageId,
        properties,
      });
      return { ok: true, notionPageId, action: "updated" };
    }

    // Crear nuevo
    const page = await notion.pages.create({
      parent: { database_id },
      properties,
    });
    return { ok: true, notionPageId: page.id, action: "created" };
  } catch (err) {
    console.warn("[notion-sync] error sincronizando contacto:", err);
    return { ok: false, action: "skipped", error: String(err) };
  }
}

/**
 * Sincroniza un Deal de Prisma a Notion (create o update).
 * Best-effort: si Notion no está configurado o falla, loggea y continúa.
 */
export async function syncDealToNotion(
  deal: Deal & { stage?: { name: string } | null; contact?: { firstName: string } | null },
): Promise<NotionSyncResult> {
  const dealsDbId = getDealsDbId();
  if (!notion || !dealsDbId) {
    return { ok: true, action: "skipped" };
  }

  try {
    const notionPageId = extractNotionPageId(deal.notes);
    const { database_id, properties } = dealToNotion(deal, dealsDbId);

    if (notionPageId) {
      await notion.pages.update({
        page_id: notionPageId,
        properties,
      });
      return { ok: true, notionPageId, action: "updated" };
    }

    const page = await notion.pages.create({
      parent: { database_id },
      properties,
    });
    return { ok: true, notionPageId: page.id, action: "created" };
  } catch (err) {
    console.warn("[notion-sync] error sincronizando deal:", err);
    return { ok: false, action: "skipped", error: String(err) };
  }
}

/**
 * Archiva (soft delete) una página de Notion.
 */
export async function deleteNotionPage(pageId: string): Promise<NotionSyncResult> {
  if (!notion) {
    return { ok: true, action: "skipped" };
  }

  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });
    return { ok: true, notionPageId: pageId, action: "deleted" };
  } catch (err) {
    console.warn("[notion-sync] error archivando página:", err);
    return { ok: false, action: "skipped", error: String(err) };
  }
}
