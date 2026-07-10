import { NextResponse } from "next/server";
import { runReparador } from "@/lib/agents/reparador";
import { agentRepairRequestSchema, type AgentRepairRequest } from "@/lib/agents/schemas";
import { hasGemini, hasOpenCodeZen, hasAnyLLM } from "@/lib/agents/config";

// POST /api/agents/repair
// Ejecuta la reparación propuesta por el Diagnosticador. Auth: X-API-Key CRM.

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.CRM_API_KEY) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

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
  const { result, action, mode } = await runReparador(parsed.data as AgentRepairRequest, {
    dryRun,
  });

  return NextResponse.json({
    result,
    action,
    mode,
    dryRun,
    llm: {
      gemini: hasGemini(),
      opencodeZen: hasOpenCodeZen(),
      any: hasAnyLLM(),
    },
  });
}
