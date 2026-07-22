import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-auth";
import { crmContactSchema, flattenErrors } from "@/lib/validation";

export async function GET(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  if (!prisma) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: contacts });
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

  const parsed = crmContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company: parsed.data.company,
        position: parsed.data.position,
        notes: parsed.data.notes,
        type: parsed.data.type ?? "INDIVIDUAL",
      },
    });

    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (err) {
    console.error("[crm/contacts] error al crear contacto:", err);
    return NextResponse.json({ error: "No se pudo crear el contacto." }, { status: 500 });
  }
}
