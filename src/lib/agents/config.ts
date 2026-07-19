import "server-only";

// Configuración de los agentes IA. Todas las env vars son null-safe: la app
// arranca y los agentes degradan a heurísticas deterministas si no hay keys.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const OPENCODE_ZEN_API_KEY = process.env.OPENCODE_ZEN_API_KEY ?? "";
const OPENCODE_ZEN_BASE_URL = process.env.OPENCODE_ZEN_BASE_URL ?? "https://opencode.ai/zen/v1";
const OPENCODE_ZEN_MODELS = (
  process.env.OPENCODE_ZEN_MODELS ?? "deepseek-v4-flash-free,mimo-v2.5-free,north-mini-code-free"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const AGENT_AUDIT_INTERVAL = Number(process.env.AGENT_AUDIT_INTERVAL ?? 900_000); // 15 min

export const agentsConfig = {
  geminiApiKey: GEMINI_API_KEY,
  opencodeZenApiKey: OPENCODE_ZEN_API_KEY,
  opencodeZenBaseUrl: OPENCODE_ZEN_BASE_URL,
  opencodeZenModels: OPENCODE_ZEN_MODELS,
  auditIntervalMs: AGENT_AUDIT_INTERVAL,
  // Modelo primario (Gemini). Si falla, se itera la cascada de Zen.
  primaryModel: "gemini-3.5-flash" as const,
  // Timeout por modelo individual (ms). La cascada completa puede durar más.
  perModelTimeoutMs: 30_000,
  // Reintentos por modelo ante fallo transitorio (rate-limit, timeout, 5xx).
  perModelMaxRetries: 2,
} as const;

// ─── Allowlist de endpoints CRM para el agente Reparador ──────────────────
//
// Fuente única de verdad. schemas.ts, reparador.ts y prompts.ts derivan de aquí.
// Formato: "METHOD resource" ("POST tasks", "PATCH deals/{id}").
// {id} se expande a [\w-]+ en los patrones regex.

export const ALLOWED_REPAIR_ENDPOINTS = [
  "POST tasks",
  "POST activities",
  "PATCH deals/{id}",
] as const;

export type AllowedRepairEndpoint = (typeof ALLOWED_REPAIR_ENDPOINTS)[number];

/**
 * Patrones regex derivados de ALLOWED_REPAIR_ENDPOINTS.
 * Se construyen una sola vez en módulo load.
 */
export const ALLOWED_ENDPOINT_PATTERNS: readonly RegExp[] = ALLOWED_REPAIR_ENDPOINTS.map((ep) => {
  const [method, resource] = ep.split(" ", 2);
  const resourcePattern = resource!.replace(/\{id\}/g, "[\\w-]+");
  return new RegExp(`^${method} /api/crm/${resourcePattern}$`);
});

/**
 * Verifica si un endpoint completo (ej. "PATCH /api/crm/deals/abc-123")
 * está en la lista de endpoints permitidos.
 */
export function isAllowedRepairEndpoint(endpoint: string): boolean {
  return ALLOWED_ENDPOINT_PATTERNS.some((p) => p.test(endpoint));
}

/**
 * Describe los endpoints permitidos en formato legible para prompts.
 * Devuelve líneas como "- POST /api/crm/tasks — crear tareas de seguimiento".
 */
export function describeAllowedEndpoints(): string {
  const descriptions: Record<string, string> = {
    "POST tasks": "crear tareas de seguimiento",
    "POST activities": "registrar actividades",
    "PATCH deals/{id}": "actualizar deals (stage, notes, probability)",
  };
  return ALLOWED_REPAIR_ENDPOINTS.map((ep) => {
    const [method, resource] = ep.split(" ", 2);
    return `- ${method} /api/crm/${resource} — ${descriptions[ep] ?? ""}`;
  }).join("\n");
}

export function hasGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function hasOpenCodeZen(): boolean {
  return Boolean(process.env.OPENCODE_ZEN_API_KEY);
}

export function hasAnyLLM(): boolean {
  return hasGemini() || hasOpenCodeZen();
}
