import { NextResponse } from "next/server";
import { contactSchema, flattenErrors } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM, CONTACT_TO } from "@/lib/email";
import { LeadNotification } from "@/emails/LeadNotification";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { publishOutboxEventInTransaction } from "@/lib/services/outbox";

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

  // Persistir lead y encolar notificación por email en outbox (transaccional).
  // El worker de outbox envía el email de forma asíncrona con retry/backoff.
  if (prisma) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.lead.create({
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

        if (resend) {
          await publishOutboxEventInTransaction(tx, "send_email", "Lead", email, {
            template: "lead_notification",
            subject: `Nuevo contacto: ${name}`,
            to: CONTACT_TO,
            replyTo: email,
            name,
            email,
            type,
            message,
          });
        }
      });
    } catch (err) {
      console.error("[contact] error al persistir lead o encolar notificación:", err);
      return NextResponse.json(
        { error: "No pudimos registrar tu mensaje. Escríbeme directamente por email." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  // Degradación sin prisma: si hay resend, enviar directamente (sin outbox).
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
      return NextResponse.json(
        { error: "No pudimos registrar tu mensaje. Escríbeme directamente por email." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  console.warn(
    "[contact] sin DATABASE_URL ni RESEND_API_KEY: mensaje recibido pero no persistido ni enviado.",
  );
  return NextResponse.json({ ok: true });
}
