import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-auth";
import { crmDealSchema, flattenErrors } from "@/lib/validation";
import { syncDealToNotion } from "@/lib/crm/notion-sync";

export async function GET(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  const url = new URL(req.url);
  const stageId = url.searchParams.get("stageId");
  const contactId = url.searchParams.get("contactId");

  const where: Record<string, unknown> = {};
  if (stageId) where.stageId = stageId;
  if (contactId) where.contactId = contactId;

  const deals = await prisma.deal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { stage: true, contact: true },
  });

  return NextResponse.json({ data: deals });
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

  const parsed = crmDealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  // Asignar stage "Nuevo" (order 0) automáticamente
  const initialStage = await prisma.pipelineStage.findFirst({
    where: { order: 0 },
  });

  try {
    const deal = await prisma.deal.create({
      data: {
        title: parsed.data.title,
        contactId: parsed.data.contactId,
        stageId: initialStage?.id ?? null,
        value: parsed.data.value ?? 0,
        currency: parsed.data.currency ?? "eur",
        probability: parsed.data.probability ?? 0,
        notes: parsed.data.notes,
        items: parsed.data.items
          ? {
              create: parsed.data.items.map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice ?? 0,
                totalPrice: (it.unitPrice ?? 0) * it.quantity,
                notes: it.notes,
              })),
            }
          : undefined,
      },
      include: { stage: true, contact: true },
    });

    // Best-effort: sincronizar a Notion en background
    syncDealToNotion(deal as Parameters<typeof syncDealToNotion>[0]).catch((e) =>
      console.warn("[crm/deals] sync Notion falló:", e),
    );

    return NextResponse.json({ data: deal }, { status: 201 });
  } catch (err) {
    console.error("[crm/deals] error al crear deal:", err);
    return NextResponse.json(
      { error: "No se pudo crear el deal. Verifica que el contacto existe." },
      { status: 422 },
    );
  }
}
