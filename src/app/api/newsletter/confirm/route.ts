import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/email";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

export const runtime = "nodejs";

// Confirmación del double opt-in: valida el token (existente y no caducado),
// marca la suscripción como confirmada y la consume (token de un solo uso).
// Redirige siempre a una página neutral; los detalles van por query `?error`.
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const ok = new URL("/newsletter/confirmado", origin);
  const fail = new URL("/newsletter/confirmado?error=1", origin);

  const token = req.nextUrl.searchParams.get("token");
  if (!token || !prisma) return NextResponse.redirect(fail);

  let sub;
  try {
    sub = await prisma.subscriber.findUnique({ where: { token } });
  } catch (err) {
    console.error("[newsletter/confirm] error al consultar el token:", err);
    return NextResponse.redirect(fail);
  }

  // Token inexistente o caducado → fallo (no se filtra cuál de los dos).
  if (!sub || !sub.tokenExpiresAt || sub.tokenExpiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(fail);
  }

  try {
    await prisma.subscriber.update({
      where: { id: sub.id },
      data: { confirmed: true, confirmedAt: new Date(), token: null, tokenExpiresAt: null },
    });
  } catch (err) {
    console.error("[newsletter/confirm] error al confirmar la suscripción:", err);
    return NextResponse.redirect(fail);
  }

  // La bienvenida es best-effort: no debe tumbar una confirmación ya consumada.
  if (resend) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: sub.email,
        subject: "Gracias por suscribirte",
        react: WelcomeEmail(),
      });
    } catch (err) {
      console.error("[newsletter/confirm] error al enviar la bienvenida:", err);
    }
  }

  return NextResponse.redirect(ok);
}
