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

  // Contamos canales configurados y cuántos fallan por excepción (no por
  // ausencia de credenciales). Si TODOS los canales configurados fallan, el
  // mensaje se ha perdido: hay que devolver un error honesto, no un ok:true.
  let configured = 0;
  let failed = 0;

  if (prisma) {
    configured++;
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
      failed++;
      console.error("[contact] error al persistir lead:", err);
    }
  }

  if (resend) {
    configured++;
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: CONTACT_TO,
        subject: `Nuevo contacto: ${name}`,
        replyTo: email,
        react: LeadNotification({ name, email, type, message }),
      });
    } catch (err) {
      failed++;
      console.error("[contact] error al enviar email:", err);
    }
  }

  // Degradación intencional: sin ningún canal configurado (dev sin credenciales)
  // se acusa recibo. NO es un fallo de runtime.
  if (configured === 0) {
    console.warn(
      "[contact] sin DATABASE_URL ni RESEND_API_KEY: mensaje recibido pero no persistido ni enviado.",
    );
    return NextResponse.json({ ok: true });
  }

  // Todos los canales configurados lanzaron: el mensaje se perdió. Error honesto
  // para que la UI ofrezca un canal de contacto alternativo.
  if (failed === configured) {
    return NextResponse.json(
      { error: "No pudimos registrar tu mensaje. Escríbeme directamente por email." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
