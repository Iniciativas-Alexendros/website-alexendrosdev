import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm-auth";
import { runAudit } from "@/lib/agents/auditor";

// POST /api/agents/audit
// Trigger manual de auditoría completa: anomalías de checkout + deals
// estancados. Auth: X-API-Key del CRM.

export async function POST(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  const report = await runAudit();

  return NextResponse.json(report);
}
