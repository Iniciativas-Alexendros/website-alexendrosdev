import "server-only";
import { crmClient, type CrmDeal, type CrmTask } from "@/lib/agents/crm-client";
import { isAllowedRepairEndpoint, ENDPOINT_DESCRIPTIONS } from "@/lib/agents/config";

// ─── Cliente de escritura del CRM con allowlist ────────────────────────────
//
// Expone únicamente operaciones de escritura (POST, PATCH) y cada una valida
// que el endpoint esté en ALLOWED_REPAIR_ENDPOINTS antes de delegar al cliente
// HTTP real. Si el endpoint no está permitido, lanza un error (el caller debe
// capturarlo y degradar).
//
// Uso: solo el Reparador debe importar desde aquí. Diagnosticador y Auditor
// deben usar `crm-reader.ts` (solo lectura).

function describeAllowedWrites(): string {
  return Object.entries(ENDPOINT_DESCRIPTIONS)
    .map(([endpoint, desc]) => `${endpoint} — ${desc}`)
    .join("; ");
}

function assertWriteAllowed(endpoint: string): void {
  if (!isAllowedRepairEndpoint(endpoint)) {
    throw new Error(
      `Operación de escritura no permitida: ${endpoint}. ` +
        `Endpoints permitidos: ${describeAllowedWrites()}`,
    );
  }
}

export const crmWriter = {
  createTask(
    task: Parameters<typeof crmClient.createTask>[0],
    baseUrl?: string,
  ): Promise<CrmTask | null> {
    assertWriteAllowed("POST /api/crm/tasks");
    return crmClient.createTask(task, baseUrl);
  },

  createActivity(
    activity: Parameters<typeof crmClient.createActivity>[0],
    baseUrl?: string,
  ): Promise<unknown> {
    assertWriteAllowed("POST /api/crm/activities");
    return crmClient.createActivity(activity, baseUrl);
  },

  updateDealStage(id: string, stageId: string, baseUrl?: string): Promise<CrmDeal | null> {
    assertWriteAllowed(`PATCH /api/crm/deals/${id}`);
    return crmClient.updateDealStage(id, stageId, baseUrl);
  },
};

export type { CrmDeal, CrmTask };
