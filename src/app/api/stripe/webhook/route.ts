import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { metric } from "@/lib/monitor";

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
    metric("stripe.webhook.error", "missing_signature");
    return NextResponse.json({ error: "Falta la firma." }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] firma inválida:", err);
    metric("stripe.webhook.error", "invalid_signature");
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  if (!prisma) {
    console.warn(
      `[stripe-webhook] sin DATABASE_URL: evento ${event.type} recibido pero no procesado.`,
    );
    metric("stripe.webhook.skipped", event.type);
    return NextResponse.json({ received: true });
  }

  metric("stripe.webhook.received", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        // Evento desconocido: acusar sin procesar
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] error al procesar ${event.type}:`, err);
    metric("stripe.webhook.error", `processing:${event.type}`);
    return NextResponse.json({ error: "No se pudo procesar el evento." }, { status: 500 });
  }

  metric("stripe.webhook.processed", event.type);
  return NextResponse.json({ received: true });
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Upsert Order (idempotente)
  await prisma!.order.upsert({
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

  // F14: auto-cierre de deal si metadata incluye dealId
  const dealId = session.metadata?.dealId;
  if (dealId) {
    // Buscar stage "Cerrado ganado" (order 5)
    const cerradoGanado = await prisma!.pipelineStage.findFirst({
      where: { order: 5 },
    });
    if (cerradoGanado) {
      await prisma!.deal.update({
        where: { id: dealId },
        data: {
          stageId: cerradoGanado.id,
          probability: 100,
          closedAt: new Date(),
        },
      });
      await prisma!.activity.create({
        data: {
          type: "NOTE",
          title: "Pago recibido. Deal cerrado ganado automáticamente.",
          dealId,
        },
      });
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const stripeInvoiceId = invoice.id;
  if (!stripeInvoiceId) return;

  // Buscar deal por subscription si existe
  let dealId: string | undefined;
  const subscriptionId = (
    invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }
  ).subscription;
  if (subscriptionId) {
    const sub = await prisma!.subscription.findUnique({
      where: {
        stripeSubscriptionId:
          typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id,
      },
    });
    if (sub?.contactId) {
      const deal = await prisma!.deal.findFirst({
        where: { contactId: sub.contactId },
        orderBy: { createdAt: "desc" },
      });
      if (deal) dealId = deal.id;
    }
  }

  // Upsert Invoice CRM
  await prisma!.invoice.upsert({
    where: { stripeInvoiceId },
    update: {
      status: "paid",
      paidAt: new Date(),
    },
    create: {
      number: `STRIPE-${stripeInvoiceId}`,
      stripeInvoiceId,
      status: "paid",
      paidAt: new Date(),
      subtotal: String((invoice.amount_paid ?? 0) / 100),
      taxRate: "0",
      taxAmount: "0",
      total: String((invoice.amount_paid ?? 0) / 100),
      currency: invoice.currency ?? "eur",
      dealId: dealId ?? undefined,
    },
  });

  // Activity NOTE
  await prisma!.activity.create({
    data: {
      type: "NOTE",
      title: `Factura Stripe pagada: ${invoice.currency?.toUpperCase() ?? "EUR"} ${((invoice.amount_paid ?? 0) / 100).toFixed(2)}`,
      dealId: dealId ?? undefined,
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const contactId = subscription.metadata?.contactId;
  // Stripe API devuelve current_period_start/end como snake_case en el JSON,
  // pero el SDK TypeScript no los tipa directamente. Accedemos via casting.
  const sub = subscription as unknown as {
    current_period_start: number;
    current_period_end: number;
    canceled_at: number | null;
  };

  await prisma!.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status: subscription.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      contactId: contactId ?? undefined,
    },
    create: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: String(subscription.customer),
      status: subscription.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      contactId: contactId ?? undefined,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subData = subscription as unknown as { canceled_at: number | null };

  await prisma!.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "canceled",
      canceledAt: subData.canceled_at ? new Date(subData.canceled_at * 1000) : new Date(),
    },
  });

  // Task HIGH: follow-up por cancelación
  const sub = await prisma!.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  await prisma!.task.create({
    data: {
      title: "Contactar por cancelación de suscripción",
      priority: "HIGH",
      contactId: sub?.contactId ?? undefined,
    },
  });
}
