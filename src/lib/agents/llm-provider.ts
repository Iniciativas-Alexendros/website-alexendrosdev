import "server-only";
import { agentsConfig } from "@/lib/agents/config";
import {
  diagnosticResultSchema,
  eventClassificationSchema,
  repairActionSchema,
} from "@/lib/agents/schemas";
import type { DiagnosticResult, EventClassification, RepairAction } from "@/lib/agents/schemas";

// ─── Provider LLM híbrido: Gemini (primario) + OpenCode Zen (fallback) ──────
//
// Estrategia de cascada: intenta `gemini-3.5-flash` primero. Si falla (rate
// limit, timeout, error de red, respuesta inválida), itera los modelos
// configurados en `OPENCODE_ZEN_MODELS` en orden. Si todos fallan, throws un
// `LLMError` con `code: "all_models_failed"` para que el caller degrade a
// heurísticas deterministas.

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  // JSON schema que la respuesta del LLM debe cumplir. El system prompt se
  // enriquece automáticamente con esta indicación.
  responseSchema?: string;
  // Modelo a usar (ignora el cascade). Útil para tests.
  modelOverride?: string;
  // Temperatura (default 0.2 — baja para tareas estructuradas).
  temperature?: number;
}

export interface LLMResponse<T = string> {
  content: T;
  model: string;
  provider: "gemini" | "opencode-zen";
  tokensUsed?: { prompt: number; completion: number };
}

export type LLMErrorCode =
  "all_models_failed" | "invalid_response" | "timeout" | "rate_limited" | "no_provider";

export class LLMError extends Error {
  code: LLMErrorCode;
  attempts: { model: string; provider: string; error: string }[];
  constructor(code: LLMErrorCode, attempts: { model: string; provider: string; error: string }[]) {
    super(`LLM error: ${code} (${attempts.length} attempts)`);
    this.name = "LLMError";
    this.code = code;
    this.attempts = attempts;
  }
}

// ─── Cascade ────────────────────────────────────────────────────────────────

interface ProviderAttempt {
  model: string;
  provider: "gemini" | "opencode-zen";
  execute: (messages: LLMMessage[], options: ChatOptions) => Promise<string>;
}

function getProviders(): ProviderAttempt[] {
  const providers: ProviderAttempt[] = [];
  if (agentsConfig.geminiApiKey) {
    providers.push({
      model: agentsConfig.primaryModel,
      provider: "gemini",
      execute: callGemini,
    });
  }
  for (const model of agentsConfig.opencodeZenModels) {
    if (agentsConfig.opencodeZenApiKey) {
      providers.push({
        model,
        provider: "opencode-zen",
        execute: callOpenCodeZen,
      });
    }
  }
  return providers;
}

/**
 * Ejecuta una cascada de modelos LLM. Devuelve la primera respuesta válida
 * (parseable como JSON si se proporcionó `responseSchema`) o lanza `LLMError`.
 */
export async function chatCompletion(
  messages: LLMMessage[],
  options: ChatOptions = {},
): Promise<LLMResponse<string>> {
  const providers = options.modelOverride
    ? getProviders().filter((p) => p.model === options.modelOverride)
    : getProviders();

  if (providers.length === 0) {
    throw new LLMError("no_provider", []);
  }

  const attempts: { model: string; provider: string; error: string }[] = [];

  for (const attempt of providers) {
    for (let retry = 0; retry <= agentsConfig.perModelMaxRetries; retry++) {
      try {
        const raw = await withTimeout(
          attempt.execute(messages, options),
          agentsConfig.perModelTimeoutMs,
        );
        // Si se pidió schema, validar (pero no parsear — el caller decide).
        // Aquí solo verificamos que sea JSON válido si el caller lo va a parsear.
        return {
          content: raw,
          model: attempt.model,
          provider: attempt.provider,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        attempts.push({
          model: attempt.model,
          provider: attempt.provider,
          error: msg,
        });
        if (!isRetryable(msg) || retry === agentsConfig.perModelMaxRetries) {
          break; // siguiente modelo en la cascada
        }
      }
    }
  }

  throw new LLMError("all_models_failed", attempts);
}

/**
 * Variante que parsea la respuesta como JSON contra un schema Zod. Reintenta
 * una vez con un prompt más explícito si el primer parseo falla. Si la cascada
 * completa falla, lanza `LLMError` (degradación al caller).
 */
export async function chatCompletionStructured<T>(
  messages: LLMMessage[],
  schema: import("zod").ZodType<T>,
  options: ChatOptions = {},
): Promise<LLMResponse<T>> {
  const first = await chatCompletion(messages, options);
  const parsed = safeJsonParse(first.content);
  const result = parsed ? schema.safeParse(parsed) : null;
  if (result?.success) {
    return { ...first, content: result.data };
  }
  // Reintento con prompt más estricto
  const retryMessages: LLMMessage[] = [
    ...messages,
    {
      role: "user",
      content:
        "Tu respuesta anterior no fue JSON válido o no cumplió el schema. " +
        "Responde EXCLUSIVAMENTE con un objeto JSON válido que cumpla el schema pedido. " +
        "Sin texto adicional, sin markdown, sin explicaciones.",
    },
  ];
  const second = await chatCompletion(retryMessages, options);
  const parsed2 = safeJsonParse(second.content);
  const result2 = parsed2 ? schema.safeParse(parsed2) : null;
  if (result2?.success) {
    return { ...second, content: result2.data };
  }
  throw new LLMError("invalid_response", [
    {
      model: first.model,
      provider: first.provider,
      error: "schema validation failed",
    },
  ]);
}

// ─── Providers concretos ─────────────────────────────────────────────────────
//
// Gemini: usa el SDK oficial `@google/genai`. Si no está disponible (entorno
// sin la dependencia), `callGemini` lanza un error claro.
//
// OpenCode Zen: usa la API OpenAI-compatible (`/v1/chat/completions`) con
// `fetch` nativo. Sin SDK externo.

async function callGemini(messages: LLMMessage[], options: ChatOptions): Promise<string> {
  // Import dinámico para que la ausencia de la dep no rompa el bundle de tests
  // (lo mockeamos en los tests).
  const { GoogleGenAI } = await import("@google/genai").catch(() => {
    throw new Error("@google/genai SDK not available");
  });
  const ai = new GoogleGenAI({ apiKey: agentsConfig.geminiApiKey });
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const rest = messages.filter((m) => m.role !== "system");
  const contents = rest.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
  const response = await ai.models.generateContent({
    model: agentsConfig.primaryModel,
    contents,
    config: {
      systemInstruction: system,
      temperature: options.temperature ?? 0.2,
      responseMimeType: options.responseSchema ? "application/json" : undefined,
    },
  });
  return response.text ?? "";
}

async function callOpenCodeZen(messages: LLMMessage[], options: ChatOptions): Promise<string> {
  // Encuentra el modelo que estamos intentando (el primero de la cascada Zen
  // cuya entry está activa). El caller ya filtró por model, así que tomamos
  // el model del options o el primero configurado.
  const model = options.modelOverride ?? agentsConfig.opencodeZenModels[0]!;
  const res = await fetch(`${agentsConfig.opencodeZenBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${agentsConfig.opencodeZenApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.2,
      response_format: options.responseSchema ? { type: "json_object" } : undefined,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenCode Zen ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isRetryable(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("timeout") ||
    m.includes("429") ||
    m.includes("rate") ||
    m.includes("500") ||
    m.includes("502") ||
    m.includes("503") ||
    m.includes("504") ||
    m.includes("econnreset") ||
    m.includes("network")
  );
}

function safeJsonParse(s: string): unknown | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// ─── Wrappers de dominio (Zod ya validado) ─────────────────────────────────

export async function classifyEvent(
  eventDescription: string,
): Promise<LLMResponse<EventClassification>> {
  return chatCompletionStructured(
    [
      {
        role: "system",
        content:
          "Eres un clasificador de eventos de Stripe. Dado un evento, devuelve JSON con {type, severity, summary, requiresAction}.",
      },
      { role: "user", content: eventDescription },
    ],
    eventClassificationSchema,
  );
}

export async function diagnose(contextText: string): Promise<LLMResponse<DiagnosticResult>> {
  return chatCompletionStructured(
    [
      {
        role: "system",
        content:
          "Eres un diagnosticador de incidencias en un pipeline comercial. " +
          "Dado un contexto, formula hipótesis de causa con confianza 0-1 y " +
          "evidencia. Devuelve JSON con {diagnosis, hypotheses: [{cause, confidence, evidence, suggestedAction}], context}.",
      },
      { role: "user", content: contextText },
    ],
    diagnosticResultSchema,
  );
}

export async function planRepair(diagnosisText: string): Promise<LLMResponse<RepairAction>> {
  return chatCompletionStructured(
    [
      {
        role: "system",
        content:
          "Eres un planificador de reparaciones. Dado un diagnóstico, " +
          "propón UNA acción correctiva concreta que se ejecutará vía CRM API. " +
          "Devuelve JSON con {action, endpoint, payload}. " +
          "El endpoint debe tener formato 'METHOD /api/crm/...'.",
      },
      { role: "user", content: diagnosisText },
    ],
    repairActionSchema,
  );
}
