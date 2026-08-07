import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-auth";
import { crmDealPatchSchema, flattenErrors } from "@/lib/validation";
import { isValidTransition, isTerminalStage } from "@/lib/crm/pipeline";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido." }, { status: 400 });
  }

  const parsed = crmDealPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  try {
    // Buscar deal actual
    const deal = await prisma.deal.findFirst({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: "Deal no encontrado." }, { status: 404 });
    }

    // Si cambia de stage, validar transición
    if (parsed.data.stageId) {
      const targetStage = await prisma.pipelineStage.findFirst({
        where: { id: parsed.data.stageId },
      });
      if (!targetStage) {
        return NextResponse.json(
          { error: "Stage no encontrado.", fields: { stageId: "Stage inválido." } },
          { status: 422 },
        );
      }

      // Obtener order del stage actual
      let currentOrder = 0;
      if (deal.stageId) {
        const currentStage = await prisma.pipelineStage.findFirst({
          where: { id: deal.stageId },
        });
        currentOrder = currentStage?.order ?? 0;
      }

      // Validar que el stage actual no sea terminal (excepto Cerrado ganado → Onboarding)
      if (isTerminalStage(currentOrder) && currentOrder !== 5) {
        return NextResponse.json(
          { error: "Stage terminal. No se puede modificar." },
          { status: 422 },
        );
      }

      if (!isValidTransition(currentOrder, targetStage.order)) {
        return NextResponse.json(
          {
            error: "Transición no permitida.",
            fields: {
              stageId: `No se puede pasar de stage ${currentOrder} a ${targetStage.order}.`,
            },
          },
          { status: 422 },
        );
      }

      // Registrar actividad de transición + actualizar deal de forma atómica
      const result = await prisma.$transaction([
        prisma.activity.create({
          data: {
            type: "NOTE",
            title: `Stage cambiado a "${targetStage.name}"`,
            dealId: id,
          },
        }),
        prisma.deal.update({
          where: { id },
          data: {
            stageId: parsed.data.stageId,
            probability: parsed.data.probability,
            notes: parsed.data.notes,
            closedAt: parsed.data.closedAt ? new Date(parsed.data.closedAt) : undefined,
          },
        }),
      ]);

      return NextResponse.json({ data: result[1] });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        stageId: parsed.data.stageId,
        probability: parsed.data.probability,
        notes: parsed.data.notes,
        closedAt: parsed.data.closedAt ? new Date(parsed.data.closedAt) : undefined,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[crm/deals] error al actualizar deal:", err);
    return NextResponse.json({ error: "No se pudo actualizar el deal." }, { status: 500 });
  }
}
