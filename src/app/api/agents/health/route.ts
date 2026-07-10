import { NextResponse } from "next/server";
import { hasGemini, hasOpenCodeZen, hasAnyLLM } from "@/lib/agents/config";
import { crmClient } from "@/lib/agents/crm-client";

// GET /api/agents/health
// Estado del subsistema de agentes: LLM providers + CRM reachability.
// Sin auth (es health check, no expone secretos).

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {
    gemini: {
      ok: hasGemini(),
      detail: hasGemini() ? "configured" : "missing GEMINI_API_KEY",
    },
    opencodeZen: {
      ok: hasOpenCodeZen(),
      detail: hasOpenCodeZen() ? "configured" : "missing OPENCODE_ZEN_API_KEY",
    },
    crm: {
      ok: crmClient.isAvailable(),
      detail: crmClient.isAvailable() ? "configured" : "missing CRM_API_KEY",
    },
  };

  // LLM "ok" si al menos un provider está configurado. CRM "ok" si hay key.
  const llmOk = checks.gemini.ok || checks.opencodeZen.ok;
  const crmOk = checks.crm.ok;
  const allOff = !llmOk && !crmOk;
  const allOk = llmOk && crmOk;

  return NextResponse.json({
    status: allOff ? "degraded" : allOk ? "ok" : "limited",
    timestamp: new Date().toISOString(),
    llm: {
      gemini: hasGemini(),
      opencodeZen: hasOpenCodeZen(),
      any: hasAnyLLM(),
    },
    checks,
  });
}
