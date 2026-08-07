import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-auth";
import { crmInvoiceSchema, flattenErrors } from "@/lib/validation";
import { computeInvoiceTotals } from "@/lib/crm/pipeline";
import { generateInvoiceNumberAsync } from "@/lib/crm/invoice-number";

export async function GET(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  const url = new URL(req.url);
  const dealId = url.searchParams.get("dealId");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (dealId) where.dealId = dealId;
  if (status) where.status = status;

  try {
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return NextResponse.json({ data: invoices });
  } catch (err) {
    console.error("[crm/invoices] error al obtener facturas:", err);
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

  const parsed = crmInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  const taxRate = parsed.data.taxRate ?? 0;
  const totals = computeInvoiceTotals(parsed.data.items, taxRate);
  const number = await generateInvoiceNumberAsync();

  try {
    const invoice = await prisma.invoice.create({
      data: {
        number,
        status: "draft",
        subtotal: String(totals.subtotal),
        taxRate: String(taxRate),
        taxAmount: String(totals.taxAmount),
        total: String(totals.total),
        currency: "eur",
        notes: parsed.data.notes,
        contactId: parsed.data.contactId,
        dealId: parsed.data.dealId,
        items: {
          create: parsed.data.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.unitPrice * it.quantity,
            productId: it.productId,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (err) {
    console.error("[crm/invoices] error al crear factura:", err);
    return NextResponse.json({ error: "No se pudo crear la factura." }, { status: 500 });
  }
}
