import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-auth";
import { crmProductSchema, flattenErrors } from "@/lib/validation";

export async function GET(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: products });
  } catch (err) {
    console.error("[crm/products] error al obtener productos:", err);
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

  const parsed = crmProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      unitPrice: parsed.data.unitPrice,
      currency: parsed.data.currency ?? "eur",
      active: parsed.data.active ?? true,
    },
  });

  return NextResponse.json({ data: product }, { status: 201 });
}
