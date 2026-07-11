import { NextResponse } from "next/server";
import { runAudit } from "@/lib/agents/auditor";

// POST /api/agents/audit
// Trigger manual de auditoría completa: anomalías de checkout + deals
// estancados. Auth: X-API-Key del CRM.

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.CRM_API_KEY) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const report = await runAudit();

  return NextResponse.json(report);
}
