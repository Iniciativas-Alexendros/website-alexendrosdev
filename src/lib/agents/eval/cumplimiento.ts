import { crmClient, type CrmDeal, type CrmTask } from "@/lib/agents/crm-client";

// ─── Hardening · Cumplimiento ───────────────────────────────────────────────
//
// Verifica que los agentes (Auditor, Diagnosticador, Reparador) respeten el
// contrato del CRM API: métodos HTTP, paths, headers, y formatos de payload.
//
// Mecanismo: dado un agente + escenario, capturamos las llamadas a `crmClient`
// y validamos que cada llamada cumple el contrato del endpoint. Esto evita
// hacer requests reales al CRM en CI.

export interface CrmCall {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body: unknown;
}

export interface CrmContract {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  pathPattern: RegExp;
  requiredFields?: string[];
  forbiddenFields?: string[];
}

export interface ComplianceResult {
  callIndex: number;
  method: string;
  path: string;
  passed: boolean;
  violations: string[];
}

export function validateCrmCall(call: CrmCall, contract: CrmContract): string[] {
  const violations: string[] = [];

  // Verificar método
  if (call.method !== contract.method) {
    violations.push(`Method mismatch: expected ${contract.method}, got ${call.method}`);
  }

  // Verificar path
  if (!contract.pathPattern.test(call.path)) {
    violations.push(
      `Path mismatch: expected pattern ${contract.pathPattern.source}, got ${call.path}`,
    );
  }

  // Verificar required fields
  if (contract.requiredFields && typeof call.body === "object" && call.body !== null) {
    const body = call.body as Record<string, unknown>;
    for (const field of contract.requiredFields) {
      if (!(field in body)) {
        violations.push(`Missing required field: ${field}`);
      }
    }
  }

  // Verificar forbidden fields
  if (contract.forbiddenFields && typeof call.body === "object" && call.body !== null) {
    const body = call.body as Record<string, unknown>;
    for (const field of contract.forbiddenFields) {
      if (field in body) {
        violations.push(`Forbidden field present: ${field}`);
      }
    }
  }

  return violations;
}

export function evaluateCrmCompliance(calls: CrmCall[], contract: CrmContract): ComplianceResult[] {
  return calls.map((call, idx) => {
    const violations = validateCrmCall(call, contract);
    return {
      callIndex: idx,
      method: call.method,
      path: call.path,
      passed: violations.length === 0,
      violations,
    };
  });
}

// ─── Capturador de llamadas (para tests) ────────────────────────────────────
//
// Helper para tests: wrappea `crmClient` y captura las llamadas en un array
// en lugar de hacer requests reales.

export function captureCrmCalls(): {
  calls: CrmCall[];
  wrappedClient: typeof crmClient;
} {
  const calls: CrmCall[] = [];

  const wrappedClient = {
    ...crmClient,
    async getDeal(id: string) {
      const result = await crmClient.getDeal(id);
      calls.push({
        method: "GET",
        path: `/api/crm/deals/${id}`,
        body: undefined,
      });
      return result;
    },
    async listDeals() {
      const result = await crmClient.listDeals();
      calls.push({ method: "GET", path: "/api/crm/deals", body: undefined });
      return result;
    },
    async getContact(id: string) {
      const result = await crmClient.getContact(id);
      calls.push({
        method: "GET",
        path: `/api/crm/contacts/${id}`,
        body: undefined,
      });
      return result;
    },
    async updateDealStage(id: string, stageId: string) {
      const result = await crmClient.updateDealStage(id, stageId);
      calls.push({
        method: "PATCH",
        path: `/api/crm/deals/${id}`,
        body: { stageId },
      });
      return result;
    },
    async createTask(task: Parameters<typeof crmClient.createTask>[0]) {
      const result = await crmClient.createTask(task);
      calls.push({ method: "POST", path: "/api/crm/tasks", body: task });
      return result;
    },
    async createActivity(activity: Parameters<typeof crmClient.createActivity>[0]) {
      const result = await crmClient.createActivity(activity);
      calls.push({
        method: "POST",
        path: "/api/crm/activities",
        body: activity,
      });
      return result;
    },
  } as typeof crmClient;

  return { calls, wrappedClient };
}

// Helper para verificar que el cliente tiene un deal/task/activity antes de usarlo
export type { CrmDeal, CrmTask };
