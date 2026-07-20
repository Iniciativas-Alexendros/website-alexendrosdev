import "server-only";
import { agentsConfig, describeAllowedEndpoints } from "@/lib/agents/config";

// Contexto CRM que se inyecta en los system prompts de los agentes. Se cachea
// en memoria porque no cambia entre requests (los stages y productos son
// estáticos del catálogo).

interface CrmContext {
  pipelineStages: string;
  productSummary: string;
  systemSummary: string;
}

let cached: CrmContext | null = null;

async function buildContext(): Promise<CrmContext> {
  // Import dinámico para evitar ciclos. El catálogo y pipeline son hojas.
  const { CATALOG } = await import("@/lib/content/catalog");
  const { getAllStages } = await import("@/lib/crm/pipeline");

  const productSummary = CATALOG.map(
    (it) => `- ${it.id}: ${it.name} (${it.type}, ${it.currency} ${(it.amount / 100).toFixed(2)})`,
  ).join("\n");

  const pipelineStages = getAllStages()
    .map(
      (s: { order: number; name: string; terminal: boolean }) =>
        `${s.order}: ${s.name}${s.terminal ? " (terminal)" : ""}`,
    )
    .join("\n");

  return {
    pipelineStages,
    productSummary,
    systemSummary:
      "Sistema: Next.js 16 en Vercel · Prisma 7 con Supabase self-hosted en Coolify " +
      "· Stripe Checkout live · Resend (pendiente) · CRM REST en /api/crm/* con " +
      "auth X-API-Key · Pipeline de 10 stages lineales con 3 terminales.",
  };
}

export async function getCrmContext(): Promise<CrmContext> {
  if (!cached) cached = await buildContext();
  return cached;
}

/**
 * Construye el system prompt del agente Auditor.
 */
export async function buildAuditorSystemPrompt(): Promise<string> {
  const ctx = await getCrmContext();
  return [
    "Eres el agente AUDITOR de un pipeline comercial.",
    "Tu trabajo: clasificar eventos de Stripe y detectar anomalías.",
    "",
    "## Contexto del sistema",
    ctx.systemSummary,
    "",
    "## Stages del pipeline",
    ctx.pipelineStages,
    "",
    "## Catálogo de productos",
    ctx.productSummary,
    "",
    "## Reglas",
    "- Clasifica el evento en uno de: payment_success, payment_failed, subscription_created, subscription_updated, subscription_cancelled, unknown.",
    "- Severity: info (éxito o evento normal), warning (puede requerir atención), critical (fallo que requiere acción inmediata).",
    "- requiresAction=true si la severidad es critical o si es un fallo de pago que necesita investigación.",
    "- Devuelve SOLO el JSON con el schema pedido. Sin texto adicional.",
    "",
    `Entorno: ${agentsConfig.primaryModel} primario, fallbacks activos.`,
  ].join("\n");
}

/**
 * Construye el system prompt del agente Diagnosticador.
 */
export async function buildDiagnosticadorSystemPrompt(): Promise<string> {
  const ctx = await getCrmContext();
  return [
    "Eres el agente DIAGNOSTICADOR de un pipeline comercial.",
    "Tu trabajo: analizar una incidencia reportada y formular hipótesis de causa con confianza 0-1.",
    "",
    "## Contexto del sistema",
    ctx.systemSummary,
    "",
    "## Stages del pipeline",
    ctx.pipelineStages,
    "",
    "## Causas comunes que puedes diagnosticar",
    "- DB caída (Prisma no responde a queries)",
    "- Stripe API down (errores 5xx en checkout o webhook)",
    "- Rate-limit excedido (429)",
    "- Error de red (timeout, connection refused)",
    "- Datos inconsistentes (deal sin stage, invoice sin items, contact sin email)",
    "- Checkout fallido recurrente (múltiples attempts del mismo cliente)",
    "",
    "## Reglas",
    "- Devuelve 1-3 hipótesis ordenadas por confianza descendente.",
    "- La confianza debe ser realista (0.0-1.0). No inventes certezas.",
    "- Evidence: hechos del contexto que apoyan la hipótesis (no opiniones).",
    "- suggestedAction: acción concreta que el Reparador pueda ejecutar.",
    "- Devuelve SOLO el JSON con el schema pedido.",
    "",
    `Entorno: ${agentsConfig.primaryModel} primario, fallbacks activos.`,
  ].join("\n");
}

/**
 * Construye el system prompt del agente Reparador.
 */
export async function buildReparadorSystemPrompt(): Promise<string> {
  const ctx = await getCrmContext();
  return [
    "Eres el agente REPARADOR de un pipeline comercial.",
    "Tu trabajo: dado un diagnóstico, proponer UNA acción correctiva concreta.",
    "TÚ PROPONES, EL CÓDIGO EJECUTA. Nunca invoques APIs por tu cuenta.",
    "",
    "## Endpoints CRM disponibles",
    describeAllowedEndpoints(),
    "",
    "## Reglas del payload",
    "- activity: { type, title, description?, occurredAt, contactId?, dealId? }",
    "- task: { title, description?, priority (LOW|MEDIUM|HIGH|URGENT), contactId?, dealId? }",
    "- deal patch: { stageId?, notes?, ... }",
    "",
    "## Stages del pipeline",
    ctx.pipelineStages,
    "",
    "## Reglas",
    "- Devuelve exactamente UN action JSON con {action, endpoint, payload}.",
    "- action: nombre humano (ej. 'create_followup_task', 'advance_deal_stage').",
    "- endpoint: 'METHOD /api/crm/...' con el método HTTP en mayúsculas.",
    "- payload: objeto JSON con los campos exactos que el endpoint espera.",
    "- Si la reparación no es posible o no es segura, devuelve action='noop' con endpoint omitido.",
    "- Devuelve SOLO el JSON con el schema pedido.",
    "",
    `Entorno: ${agentsConfig.primaryModel} primario, fallbacks activos.`,
  ].join("\n");
}
