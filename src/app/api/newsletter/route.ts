import { NextResponse } from "next/server";
import { newsletterSchema, flattenErrors } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/email";
import { ConfirmSubscription } from "@/emails/ConfirmSubscription";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { newConfirmationToken } from "@/lib/newsletter";

export const runtime = "nodejs";

// Respuesta genérica de éxito. Es deliberadamente la misma tanto si el email es
// nuevo como si ya estaba suscrito: no revelar la existencia evita la
// enumeración de la lista de suscriptores.
const genericOk = () =>
  NextResponse.json({ ok: true, message: "Revisa tu correo para confirmar la suscripción." });

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

  // El double opt-in exige persistir un token: sin BD no se puede iniciar el
  // flujo. Degradación intencional (dev sin credenciales): acuse genérico.
  if (!prisma) {
    console.warn("[newsletter] sin DATABASE_URL: no se puede iniciar el double opt-in.");
    return genericOk();
  }

  // Si ya está confirmado, no reenviamos nada (ni revelamos que existe).
  let existing;
  try {
    existing = await prisma.subscriber.findUnique({ where: { email } });
  } catch (err) {
    console.error("[newsletter] error al consultar suscriptor:", err);
    return NextResponse.json(
      { error: "No pudimos completar la suscripción. Inténtalo más tarde." },
      { status: 502 },
    );
  }
  if (existing?.confirmed) return genericOk();

  // Alta/refresco en estado pendiente con un token de confirmación nuevo.
  const { token, tokenExpiresAt } = newConfirmationToken();
  try {
    await prisma.subscriber.upsert({
      where: { email },
      update: { token, tokenExpiresAt, confirmed: false },
      create: { email, token, tokenExpiresAt },
    });
  } catch (err) {
    console.error("[newsletter] error al persistir suscriptor pendiente:", err);
    return NextResponse.json(
      { error: "No pudimos completar la suscripción. Inténtalo más tarde." },
      { status: 502 },
    );
  }

  // Enviar el email de confirmación. Sin él, el usuario no puede confirmar, así
  // que si Resend está configurado y falla, devolvemos error honesto.
  if (resend) {
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const confirmUrl = `${origin}/api/newsletter/confirm?token=${token}`;
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Confirma tu suscripción",
        react: ConfirmSubscription({ confirmUrl }),
      });
    } catch (err) {
      console.error("[newsletter] error al enviar email de confirmación:", err);
      return NextResponse.json(
        { error: "No pudimos enviar el correo de confirmación. Inténtalo más tarde." },
        { status: 502 },
      );
    }
  } else {
    console.warn(
      "[newsletter] sin RESEND_API_KEY: suscriptor pendiente sin email de confirmación.",
    );
  }

  return genericOk();
}
