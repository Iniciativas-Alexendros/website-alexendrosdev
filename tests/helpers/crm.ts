/** Helpers compartidos para tests CRM. Cada test file define su propio
 *  `vi.hoisted` + `vi.mock` (Vitest las ho al principio del archivo). */
import type { Mock } from "vitest";

// ─── IDs fijos (UUIDs v4 válidos) ──────────────────────────────────────────

export const CONTACT_ID = "bb116d1d-6d86-4bdb-b163-2f738e058399";
export const DEAL_ID = "9b856f74-a796-435a-94fc-7ac2c2d76a64";
export const INVOICE_ID = "7578caee-e40c-4d33-8eef-068bad2f168b";
export const STAGE_NUEVO_ID = "fa3905c2-78c1-49dc-a6c5-3f4cc86858fe";
export const STAGE_CONTACTADO_ID = "34b60493-6e56-4910-af5f-456c35a98178";
export const STAGE_DISCOVERY_ID = "a0000002-0000-4000-8000-000000000002";
export const STAGE_PROPUESTA_ID = "a0000003-0000-4000-8000-000000000003";
export const STAGE_NEGOCIACION_ID = "a0000004-0000-4000-8000-000000000004";
export const STAGE_CERRADO_PERDIDO_ID = "a0000009-0000-4000-8000-000000000009";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface CrmMocks {
  contactFindMany: Mock;
  contactCreate: Mock;
  dealFindMany: Mock;
  dealCreate: Mock;
  dealUpdate: Mock;
  dealFindFirst: Mock;
  pipelineStageFindMany: Mock;
  pipelineStageFindFirst: Mock;
  productFindMany: Mock;
  productCreate: Mock;
  invoiceFindMany: Mock;
  invoiceCreate: Mock;
  invoiceUpdate: Mock;
  invoiceFindUnique: Mock;
  activityFindMany: Mock;
  activityCreate: Mock;
  taskFindMany: Mock;
  taskCreate: Mock;
}

type PrismaModel = Record<string, Mock>;
type PrismaClient = Record<string, PrismaModel>;

// ─── Helpers ────────────────────────────────────────────────────────────────

export function buildPrisma(mocks: CrmMocks): PrismaClient {
  return {
    contact: { findMany: mocks.contactFindMany, create: mocks.contactCreate },
    deal: {
      findMany: mocks.dealFindMany,
      create: mocks.dealCreate,
      update: mocks.dealUpdate,
      findFirst: mocks.dealFindFirst,
    },
    pipelineStage: {
      findMany: mocks.pipelineStageFindMany,
      findFirst: mocks.pipelineStageFindFirst,
    },
    product: { findMany: mocks.productFindMany, create: mocks.productCreate },
    invoice: {
      findMany: mocks.invoiceFindMany,
      create: mocks.invoiceCreate,
      update: mocks.invoiceUpdate,
      findUnique: mocks.invoiceFindUnique,
    },
    activity: { findMany: mocks.activityFindMany, create: mocks.activityCreate },
    task: { findMany: mocks.taskFindMany, create: mocks.taskCreate },
  };
}

/** Crea un Request POST/PATCH con body JSON y cabecera de auth. */
export function jsonReq(body: unknown, method = "POST") {
  return new Request("http://localhost/api/crm/test", {
    method,
    headers: { "content-type": "application/json", "x-api-key": "test-crm-key" },
    body: JSON.stringify(body),
  });
}

/** Crea un Request GET con cabecera de auth. */
export function getReq(url: string) {
  return new Request(url, {
    method: "GET",
    headers: { "x-api-key": "test-crm-key" },
  });
}

/** Crea un Request GET sin cabecera de auth. */
export function getReqNoAuth(url: string) {
  return new Request(url, { method: "GET" });
}
