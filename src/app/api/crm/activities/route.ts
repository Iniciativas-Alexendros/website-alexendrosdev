import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-auth";
import { crmActivitySchema, flattenErrors } from "@/lib/validation";

export async function GET(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  const url = new URL(req.url);
  const dealId = url.searchParams.get("dealId");

  const where: Record<string, unknown> = {};
  if (dealId) where.dealId = dealId;

  try {
    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: activities });
  } catch (err) {
    console.error("[crm/activities] error al obtener actividades:", err);
    return NextResponse.json({ error: "No se pudo obtener la información." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido." }, { status: 400 });
  }

  const parsed = crmActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  try {
    const activity = await prisma.activity.create({
      data: {
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description,
        occurredAt: new Date(parsed.data.occurredAt),
        contactId: parsed.data.contactId,
        dealId: parsed.data.dealId,
      },
    });

    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (err) {
    // P2025 / P2003: la relación referenciada (contactId / dealId) no existe.
    const code = (err as { code?: string })?.code;
    if (code === "P2025" || code === "P2003") {
      console.error("[crm/activities] FK error al crear activity:", err);
      return NextResponse.json(
        { error: "El contacto o deal referenciado no existe." },
        { status: 422 },
      );
    }
    console.error("[crm/activities] error al crear activity:", err);
    return NextResponse.json({ error: "No se pudo crear la actividad." }, { status: 500 });
  }
}
