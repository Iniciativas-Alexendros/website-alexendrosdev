import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm-auth";
import { runReparador } from "@/lib/agents/reparador";
import { agentRepairRequestSchema, type AgentRepairRequest } from "@/lib/agents/schemas";
import { hasGemini, hasOpenCodeZen, hasAnyLLM } from "@/lib/agents/config";

// POST /api/agents/repair
// Ejecuta la reparación propuesta por el Diagnosticador. Auth: X-API-Key CRM.

// Vercel serverless functions are killed mid-flight at 15s (Hobby) / 60s (Pro).
// Cap the total time the LLM-invoking call can take so we return a graceful 504
// instead of a truncated response.
const AGENT_TIMEOUT_MS = 25_000;

export async function POST(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido." }, { status: 400 });
  }

  const parsed = agentRepairRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const dryRun = req.headers.get("x-dry-run") === "true";
  // Por defecto simulación en prod: solo un flag explícito x-apply muta el CRM.
  const effectiveDryRun = dryRun || !req.headers.get("x-apply");

  try {
    const { result, action, mode } = await Promise.race([
      runReparador(parsed.data as AgentRepairRequest, { dryRun: effectiveDryRun }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), AGENT_TIMEOUT_MS),
      ),
    ]);

    return NextResponse.json({
      result,
      action,
      mode,
      dryRun: effectiveDryRun,
      llm: {
        gemini: hasGemini(),
        opencodeZen: hasOpenCodeZen(),
        any: hasAnyLLM(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "TIMEOUT") {
      return NextResponse.json(
        { error: "Tiempo de espera agotado. Introduce una incidencia más concreta." },
        { status: 504 },
      );
    }
    throw error;
  }
}
