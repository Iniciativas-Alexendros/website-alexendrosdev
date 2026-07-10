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

export function hasGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function hasOpenCodeZen(): boolean {
  return Boolean(process.env.OPENCODE_ZEN_API_KEY);
}

export function hasAnyLLM(): boolean {
  return hasGemini() || hasOpenCodeZen();
}
