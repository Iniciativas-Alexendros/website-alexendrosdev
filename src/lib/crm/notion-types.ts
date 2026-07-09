import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

/** Resultado de una operación de sync con Notion. */
export interface NotionSyncResult {
  ok: boolean;
  notionPageId?: string;
  action: "created" | "updated" | "deleted" | "skipped";
  error?: string;
}

/** Página de Notion tipada (subset de PageObjectResponse). */
export type NotionPage = PageObjectResponse;

/** Payload del webhook de Notion. */
export interface NotionWebhookEvent {
  id: string;
  timestamp: string;
  workspace_id?: string;
  subscription_id?: string;
  integration_id?: string;
  type: string;
  attempt_number?: number;
  verification_token?: string;
  entity?: {
    id: string;
    type: "page" | "block" | "database";
  };
  data?: Record<string, unknown>;
}

/** IDs de databases de Notion configurados. */
export interface NotionDatabaseIds {
  contacts: string;
  deals: string;
}
