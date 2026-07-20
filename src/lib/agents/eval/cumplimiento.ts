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
// SIN invocar al CRM real. Todas las operaciones de escritura devuelven un
// mock no-null para que el caller no degrade. Las operaciones de lectura
// devuelven `null` o `[]` según el tipo.

export function captureCrmCalls(options?: { available?: boolean }): {
  calls: CrmCall[];
  wrappedClient: typeof crmClient;
} {
  const available = options?.available ?? true;
  const calls: CrmCall[] = [];

  const wrappedClient = {
    // Default true para que los tests no degraden; pasar {available: false}
    // para verificar comportamiento del agente sin CRM.
    isAvailable: () => available,

    getDeal(_id: string) {
      calls.push({ method: "GET", path: `/api/crm/deals/${_id}`, body: undefined });
      return Promise.resolve(null);
    },

    listDeals() {
      calls.push({ method: "GET", path: "/api/crm/deals", body: undefined });
      return Promise.resolve([]);
    },

    getContact(_id: string) {
      calls.push({ method: "GET", path: `/api/crm/contacts/${_id}`, body: undefined });
      return Promise.resolve(null);
    },

    listInvoicesForDeal(dealId: string) {
      calls.push({
        method: "GET",
        path: `/api/crm/invoices?dealId=${encodeURIComponent(dealId)}`,
        body: undefined,
      });
      return Promise.resolve([]);
    },

    updateDealStage(_id: string, stageId: string) {
      calls.push({ method: "PATCH", path: `/api/crm/deals/${_id}`, body: { stageId } });
      return Promise.resolve(null);
    },

    createTask(task: Parameters<typeof crmClient.createTask>[0]) {
      calls.push({ method: "POST", path: "/api/crm/tasks", body: task });
      const mock: CrmTask = {
        id: "mock-task-1",
        title:
          typeof task === "object" && task !== null
            ? ((task as { title?: string }).title ?? "")
            : "",
        priority:
          typeof task === "object" && task !== null
            ? ((task as { priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }).priority ?? "LOW")
            : "LOW",
        doneAt: null,
        contactId:
          typeof task === "object" && task !== null
            ? ((task as { contactId?: string }).contactId ?? null)
            : null,
        dealId:
          typeof task === "object" && task !== null
            ? ((task as { dealId?: string }).dealId ?? null)
            : null,
      };
      return Promise.resolve(mock);
    },

    createActivity(activity: Parameters<typeof crmClient.createActivity>[0]) {
      calls.push({ method: "POST", path: "/api/crm/activities", body: activity });
      return Promise.resolve({ id: "mock-activity-1" });
    },
  } as unknown as typeof crmClient;

  // Runtime assertion: verificar que todos los métodos de crmClient están mockeados
  const clientKeys = Object.keys(crmClient).filter((k) => k !== "isAvailable");
  const wrappedKeys = Object.keys(wrappedClient);
  for (const key of clientKeys) {
    if (!wrappedKeys.includes(key)) {
      console.warn(`[captureCrmCalls] Missing mock for crmClient.${key}`);
    }
  }

  return { calls, wrappedClient };
}

// Helper para verificar que el cliente tiene un deal/task/activity antes de usarlo
export type { CrmDeal, CrmTask };
