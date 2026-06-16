import { NextResponse } from "next/server";
import { contactSchema, flattenErrors } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM, CONTACT_TO } from "@/lib/email";
import { LeadNotification } from "@/emails/LeadNotification";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`contact:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Inténtalo en un minuto." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa los campos del formulario.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { name, email, type, message, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } =
    parsed.data;

  if (prisma) {
    try {
      await prisma.lead.create({
        data: {
          name,
          email,
          type,
          message,
          source: "web",
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
        },
      });
    } catch (err) {
      console.error("[contact] error al persistir lead:", err);
    }
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: CONTACT_TO,
        subject: `Nuevo contacto: ${name}`,
        replyTo: email,
        react: LeadNotification({ name, email, type, message }),
      });
    } catch (err) {
      console.error("[contact] error al enviar email:", err);
    }
  }

  if (!prisma && !resend) {
    console.warn(
      "[contact] sin DATABASE_URL ni RESEND_API_KEY: mensaje recibido pero no persistido ni enviado.",
    );
  }

  return NextResponse.json({ ok: true });
}
