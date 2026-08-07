import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-auth";
import { crmInvoicePatchSchema, flattenErrors } from "@/lib/validation";

const VALID_INVOICE_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["paid", "cancelled"],
  pending_transfer: ["paid", "cancelled"],
};

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

  const parsed = crmInvoicePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada." }, { status: 404 });
    }

    // Validar transición de status
    const allowed = VALID_INVOICE_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json(
        {
          error: "Transición de estado no permitida.",
          fields: { status: `No se puede pasar de "${invoice.status}" a "${parsed.data.status}".` },
        },
        { status: 422 },
      );
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: parsed.data.status,
        paidAt: parsed.data.paidAt
          ? new Date(parsed.data.paidAt)
          : parsed.data.status === "paid"
            ? new Date()
            : undefined,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[crm/invoices] error al actualizar factura:", err);
    return NextResponse.json({ error: "No se pudo actualizar la factura." }, { status: 500 });
  }
}
