import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// El webhook necesita el runtime Node (verificación de firma con crypto) y el
// cuerpo crudo sin parsear.
export const runtime = "nodejs";

export async function POST(req: Request) {
  // Degradación sin credenciales: sin cliente Stripe o sin secreto de firma no
  // se puede verificar nada; se acusa recibo sin procesar.
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    console.warn("[stripe-webhook] sin STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET: evento ignorado.");
    return NextResponse.json({ received: true });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Falta la firma." }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] firma inválida:", err);
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (prisma) {
      try {
        await prisma.order.upsert({
          where: { stripeSessionId: session.id },
          update: { status: session.payment_status ?? "paid" },
          create: {
            stripeSessionId: session.id,
            item: session.metadata?.item ?? "desconocido",
            amount: session.amount_total ?? 0,
            currency: session.currency ?? "eur",
            email: session.customer_details?.email ?? null,
            status: session.payment_status ?? "paid",
          },
        });
      } catch (err) {
        // No tragamos el fallo: el pago YA se cobró. Devolvemos 500 para que
        // Stripe reintente con su backoff; el upsert por stripeSessionId es
        // idempotente, así que el reintento no duplica el pedido. Devolver 200
        // aquí perdería el pedido en silencio (Stripe lo daría por procesado).
        console.error("[stripe-webhook] error al persistir el pedido:", err);
        return NextResponse.json({ error: "No se pudo registrar el pedido." }, { status: 500 });
      }
    } else {
      // Degradación intencional (sin DATABASE_URL): no hay dónde persistir, así
      // que acusamos recibo. Esto NO es un fallo de runtime.
      console.warn("[stripe-webhook] sin DATABASE_URL: pago recibido pero no persistido.");
    }
  }

  return NextResponse.json({ received: true });
}
