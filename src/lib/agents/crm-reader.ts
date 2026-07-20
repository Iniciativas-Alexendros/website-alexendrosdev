import "server-only";
import { crmClient, type CrmDeal, type CrmContact, type CrmInvoice } from "@/lib/agents/crm-client";

// ─── Cliente de solo lectura del CRM ───────────────────────────────────────
//
// Expone únicamente operaciones GET (idempotentes, sin efectos secundarios).
// Los agentes que solo necesitan leer datos (Diagnosticador, Auditor) deben
// importar desde aquí en lugar de `crm-client.ts` para evitar exponer writes.
//
// Degradación null-safe: todos los métodos devuelven `null` si no hay API key.
// El caller debe manejar `null` como \"CRM no disponible\".

export const crmReader = {
  isAvailable: (): boolean => crmClient.isAvailable(),

  getDeal(id: string, baseUrl?: string): Promise<CrmDeal | null> {
    return crmClient.getDeal(id, baseUrl);
  },

  listDeals(baseUrl?: string): Promise<CrmDeal[] | null> {
    return crmClient.listDeals(baseUrl);
  },

  getContact(id: string, baseUrl?: string): Promise<CrmContact | null> {
    return crmClient.getContact(id, baseUrl);
  },

  listInvoicesForDeal(dealId: string, baseUrl?: string): Promise<CrmInvoice[] | null> {
    return crmClient.listInvoicesForDeal(dealId, baseUrl);
  },
};

export type { CrmDeal, CrmContact, CrmInvoice };
