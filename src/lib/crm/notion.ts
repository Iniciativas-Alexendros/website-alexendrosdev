import { Client } from "@notionhq/client";

const apiKey = process.env.NOTION_API_KEY ?? null;

export const notion: Client | null = apiKey ? new Client({ auth: apiKey }) : null;

/**
 * Devuelve el cliente Notion o lanza 503 si no está configurado.
 * Patrón idéntico a requireStripe / requireResend.
 */
export function requireNotion(): Client {
  if (!notion) {
    throw new NotionUnavailableError();
  }
  return notion;
}

export class NotionUnavailableError extends Error {
  status = 503;
  constructor() {
    super("Notion no disponible.");
    this.name = "NotionUnavailableError";
  }
}
