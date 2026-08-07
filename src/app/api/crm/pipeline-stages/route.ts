import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-auth";

export async function GET(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  try {
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ data: stages });
  } catch (err) {
    console.error("[crm/pipeline-stages] error al obtener stages:", err);
    return NextResponse.json({ error: "No se pudo obtener la información." }, { status: 500 });
  }
}
