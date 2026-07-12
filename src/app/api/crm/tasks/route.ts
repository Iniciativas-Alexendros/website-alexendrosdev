import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-auth";
import { crmTaskSchema, flattenErrors } from "@/lib/validation";

export async function GET(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  const url = new URL(req.url);
  const dealId = url.searchParams.get("dealId");
  const contactId = url.searchParams.get("contactId");

  const where: Record<string, unknown> = {};
  if (dealId) where.dealId = dealId;
  if (contactId) where.contactId = contactId;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: tasks });
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

  const parsed = crmTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority ?? "MEDIUM",
        contactId: parsed.data.contactId,
        dealId: parsed.data.dealId,
      },
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (err) {
    console.error("[crm/tasks] error al crear task:", err);
    return NextResponse.json({ error: "No se pudo crear la task." }, { status: 422 });
  }
}
