import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm-auth";
import { runDiagnosticador } from "@/lib/agents/diagnosticador";
import { agentDiagnoseRequestSchema, type AgentDiagnoseRequest } from "@/lib/agents/schemas";
import { hasGemini, hasOpenCodeZen, hasAnyLLM } from "@/lib/agents/config";

// POST /api/agents/diagnose
// Recibe una incidencia y formula hipótesis de causa. Auth: X-API-Key CRM.

export async function POST(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido." }, { status: 400 });
  }

  const parsed = agentDiagnoseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { result, mode } = await runDiagnosticador(parsed.data as AgentDiagnoseRequest);

  return NextResponse.json({
    result,
    mode,
    llm: {
      gemini: hasGemini(),
      opencodeZen: hasOpenCodeZen(),
      any: hasAnyLLM(),
    },
  });
}
