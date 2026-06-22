import { NextResponse } from "next/server";
import { newsletterSchema, flattenErrors } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/email";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`newsletter:${ip}`, 5, 60_000)) {
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

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email no válido.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { email } = parsed.data;

  // Mismo criterio que /api/contact: si todos los canales configurados fallan
  // por excepción, la suscripción se perdió y devolvemos error honesto.
  let configured = 0;
  let failed = 0;

  if (prisma) {
    configured++;
    try {
      await prisma.subscriber.upsert({
        where: { email },
        update: {},
        create: { email },
      });
    } catch (err) {
      failed++;
      console.error("[newsletter] error al persistir suscriptor:", err);
    }
  }

  if (resend) {
    configured++;
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Gracias por suscribirte",
        react: WelcomeEmail(),
      });
    } catch (err) {
      failed++;
      console.error("[newsletter] error al enviar email de bienvenida:", err);
    }
  }

  // Degradación intencional sin credenciales.
  if (configured === 0) {
    console.warn(
      "[newsletter] sin DATABASE_URL ni RESEND_API_KEY: suscripción recibida pero no persistida.",
    );
    return NextResponse.json({ ok: true });
  }

  if (failed === configured) {
    return NextResponse.json(
      { error: "No pudimos completar la suscripción. Inténtalo más tarde." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
