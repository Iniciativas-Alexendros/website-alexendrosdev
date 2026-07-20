import "server-only";

// Cliente HTTP interno para el CRM API. Reutiliza la API key del entorno
// (mismo secret que `requireCrmAuth` valida en el servidor). Envía el header
// `X-API-Key` automáticamente. Null-safe: si no hay `CRM_API_KEY`, todos los
// métodos devuelven `null` (el caller debe manejar la degradación).

// La API key se lee en cada llamada (no en module init) para que los tests
// puedan togglear el env var sin recargar el módulo.
function getApiKey(): string {
  return process.env.CRM_API_KEY ?? "";
}

function isAvailable(): boolean {
  return Boolean(getApiKey());
}

export interface CrmRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  // Override del base URL (para tests)
  baseUrl?: string;
  // Timeout en ms (default 15s)
  timeoutMs?: number;
}

function getBaseUrl(override?: string): string {
  if (override) return override;
  // En Vercel, las Route Handlers se invocan relativas a sí mismas.
  // En server-side fetch, la URL absoluta es necesaria. Usamos el origin
  // del entorno si está disponible, si no el default.
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export async function crmRequest<T = unknown>(
  path: string,
  options: CrmRequestOptions = {},
): Promise<T | null> {
  if (!isAvailable()) return null;
  const url = `${getBaseUrl(options.baseUrl)}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
  try {
    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": getApiKey(),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      // Devuelve `null` para que el caller degrade — no lanzamos porque los
      // agentes deben ser resilientes. El status va en un header de debug.
      return null;
    }
    if (res.status === 204) return null as T;
    return (await res.json()) as T;
  } catch (err) {
    console.warn("[crmRequest] Error calling CRM API:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Métodos de dominio ─────────────────────────────────────────────────────

export interface CrmDeal {
  id: string;
  title: string;
  value: number;
  currency: string;
  probability: number;
  stageId: string | null;
  contactId: string | null;
  // Timestamp ISO del último cambio. El endpoint /api/crm/deals/[id] lo
  // devuelve. Si falta, el agente trata el deal como "stale desconocido".
  updatedAt?: string;
}

export interface CrmContact {
  id: string;
  type: string;
  status: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
}

export interface CrmInvoice {
  id: string;
  number: string;
  status: string;
  total: number;
  currency: string;
  dealId: string | null;
  contactId: string | null;
}

export interface CrmTask {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  doneAt: string | null;
  contactId: string | null;
  dealId: string | null;
}

export const crmClient = {
  isAvailable,

  getDeal(id: string, baseUrl?: string): Promise<CrmDeal | null> {
    return crmRequest<CrmDeal>(`/api/crm/deals/${id}`, { baseUrl });
  },

  listDeals(baseUrl?: string): Promise<CrmDeal[] | null> {
    return crmRequest<CrmDeal[]>(`/api/crm/deals`, { baseUrl });
  },

  getContact(id: string, baseUrl?: string): Promise<CrmContact | null> {
    return crmRequest<CrmContact>(`/api/crm/contacts/${id}`, { baseUrl });
  },

  listInvoicesForDeal(dealId: string, baseUrl?: string): Promise<CrmInvoice[] | null> {
    return crmRequest<CrmInvoice[]>(`/api/crm/invoices?dealId=${encodeURIComponent(dealId)}`, {
      baseUrl,
    });
  },

  updateDealStage(id: string, stageId: string, baseUrl?: string): Promise<CrmDeal | null> {
    return crmRequest<CrmDeal>(`/api/crm/deals/${id}`, {
      method: "PATCH",
      body: { stageId },
      baseUrl,
    });
  },

  createTask(
    task: {
      title: string;
      description?: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      dealId?: string;
      contactId?: string;
    },
    baseUrl?: string,
  ): Promise<CrmTask | null> {
    return crmRequest<CrmTask>(`/api/crm/tasks`, {
      method: "POST",
      body: task,
      baseUrl,
    });
  },

  createActivity(
    activity: {
      type: "EMAIL" | "CALL" | "MEETING" | "NOTE" | "TASK" | "OTHER";
      title: string;
      description?: string;
      occurredAt: string;
      contactId?: string;
      dealId?: string;
    },
    baseUrl?: string,
  ): Promise<unknown> {
    return crmRequest(`/api/crm/activities`, {
      method: "POST",
      body: activity,
      baseUrl,
    });
  },
};
