import { NextResponse } from "next/server";
import { checkoutSchema, flattenErrors } from "@/lib/validation";
import { getCatalogItem, getCatalogPriceId } from "@/lib/content/catalog";
import {
  stripe,
  BASE_URL,
  TRANSFER_IBAN,
  TRANSFER_BENEFICIARY,
  TRANSFER_BANK,
  hasTransferConfig,
  isLiveMode,
} from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { generateInvoiceNumberAsync } from "@/lib/crm/invoice-number";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`checkout:${ip}`, 5, 60_000)) {
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

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida.", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  // F12: preferir itemId sobre item legacy. Si ambos vienen, itemId prevalece.
  const itemId = parsed.data.itemId ?? parsed.data.item;
  if (!itemId) {
    return NextResponse.json({ error: "Item no disponible." }, { status: 422 });
  }

  // El precio se resuelve en el servidor desde el catálogo: el cliente nunca
  // envía importes.
  const item = getCatalogItem(itemId);
  if (!item) {
    return NextResponse.json({ error: "Item no disponible." }, { status: 422 });
  }

  // F13: rama explícita de transferencia bancaria. Si el cliente pide
  // `paymentMethod: "transfer"`, vamos directos al canal secundario sin
  // tocar Stripe.
  if (parsed.data.paymentMethod === "transfer") {
    return handleTransfer(item, parsed.data.email!, parsed.data.name!);
  }

  // F12: el mode efectivo se deriva del tipo del catálogo. Si el cliente pide
  // subscription para un item one_time, forzamos payment (UX friendly, no 422).
  const effectiveMode =
    item.type === "recurring" ? (parsed.data.mode ?? "subscription") : "payment";
  if (parsed.data.mode === "subscription" && item.type === "one_time") {
    console.warn(`[checkout] mode=subscription ignorado para item one_time: ${item.id}`);
  }

  // Degradación sin credenciales: sin STRIPE_SECRET_KEY no hay pasarela. Si
  // hay datos de transferencia configurados, los ofrecemos como fallback.
  if (!stripe) {
    if (hasTransferConfig()) {
      return NextResponse.json(
        {
          error: "Pagos con tarjeta no disponibles. Puedes pagar por transferencia.",
          method: "transfer",
          iban: TRANSFER_IBAN,
          beneficiary: TRANSFER_BENEFICIARY,
          bank: TRANSFER_BANK,
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        error: "Pagos no disponibles temporalmente. Escríbeme y lo gestionamos.",
      },
      { status: 503 },
    );
  }

  const origin = req.headers.get("origin") ?? BASE_URL;

  // F17.5b: preferir `price` (precio pre-creado en el Dashboard) cuando el
  // catálogo tiene el ID del modo activo. La clave activa decide el modo;
  // `getCatalogPriceId(item, isLiveMode ? "live" : "test")` devuelve `null`
  // si falta el ID de ese modo, en cuyo caso degradamos a `price_data` inline
  // con los importes server-trusted del catálogo. Esto cubre:
  //   - live mode completo: catálogo con test+live → usa `price_live_...`
  //   - test mode: catálogo con test+live → usa `price_test_...`
  //   - cualquier modo sin ID poblado → fallback a `price_data`
  const priceId = getCatalogPriceId(item, isLiveMode ? "live" : "test");
  const lineItem = priceId
    ? { quantity: 1, price: priceId }
    : effectiveMode === "subscription"
      ? {
          quantity: 1,
          price_data: {
            currency: item.currency,
            unit_amount: item.amount,
            recurring: { interval: item.interval ?? "month" },
            product_data: { name: item.name, description: item.desc },
          },
        }
      : {
          quantity: 1,
          price_data: {
            currency: item.currency,
            unit_amount: item.amount,
            product_data: { name: item.name, description: item.desc },
          },
        };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: effectiveMode,
      line_items: [lineItem],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/servicios?checkout=cancel`,
      metadata: { item: item.id },
    });

    if (!session.url) {
      return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] error al crear la sesión de Stripe:", err);
    // F13: fallback a Payment Link si la sesión falla.
    return await handlePaymentLinkFallback(item, effectiveMode);
  }
}

// ─── F13 — Handlers de canal secundario ────────────────────────────────────

type CatalogItem = ReturnType<typeof getCatalogItem>;

async function handleTransfer(
  item: NonNullable<CatalogItem>,
  email: string,
  name: string,
): Promise<NextResponse> {
  if (!hasTransferConfig()) {
    return NextResponse.json(
      {
        error: "Transferencia no configurada. Escríbeme a hola@alexendros.dev y lo gestionamos.",
      },
      { status: 503 },
    );
  }

  if (!prisma) {
    return NextResponse.json(
      {
        error: "No puedo registrar la factura proforma ahora. Escríbeme y la genero manualmente.",
      },
      { status: 503 },
    );
  }

  try {
    const number = await generateInvoiceNumberAsync();
    const amountDecimal = (item.amount / 100).toFixed(2);
    const invoice = await prisma.invoice.create({
      data: {
        number,
        status: "pending_transfer",
        currency: item.currency,
        subtotal: amountDecimal,
        taxRate: "0",
        taxAmount: "0",
        total: amountDecimal,
        notes: `Proforma para ${name} <${email}> — ${item.name}`,
        items: {
          create: [
            {
              description: item.name,
              quantity: 1,
              unitPrice: amountDecimal,
              totalPrice: amountDecimal,
            },
          ],
        },
      },
    });

    return NextResponse.json({
      method: "transfer",
      iban: TRANSFER_IBAN,
      beneficiary: TRANSFER_BENEFICIARY,
      bank: TRANSFER_BANK,
      reference: invoice.number,
      amount: amountDecimal,
      currency: item.currency,
      concept: invoice.number,
      invoiceId: invoice.id,
    });
  } catch (err) {
    console.error("[checkout] error al crear la factura proforma:", err);
    return NextResponse.json(
      { error: "No se pudo registrar la factura proforma." },
      { status: 502 },
    );
  }
}

async function handlePaymentLinkFallback(
  item: NonNullable<CatalogItem>,
  mode: "payment" | "subscription",
): Promise<NextResponse> {
  if (!stripe) {
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 502 });
  }
  try {
    const priceId = getCatalogPriceId(item, isLiveMode ? "live" : "test");
    const link = await stripe.paymentLinks.create({
      line_items: [
        priceId
          ? { quantity: 1, price: priceId }
          : mode === "subscription"
            ? {
                quantity: 1,
                price_data: {
                  currency: item.currency,
                  unit_amount: item.amount,
                  recurring: { interval: item.interval ?? "month" },
                  product_data: { name: item.name, description: item.desc },
                },
              }
            : {
                quantity: 1,
                price_data: {
                  currency: item.currency,
                  unit_amount: item.amount,
                  product_data: { name: item.name, description: item.desc },
                },
              },
      ],
      metadata: { item: item.id, fallback: "paymentLink" },
    });
    if (!link.url) {
      return NextResponse.json(
        {
          error: "No se pudo iniciar el pago.",
          fallbackAttempted: true,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ url: link.url, fallback: true });
  } catch (err) {
    console.error("[checkout] fallback a Payment Link también falló:", err);
    return NextResponse.json(
      {
        error: "No se pudo iniciar el pago.",
        fallbackAttempted: true,
      },
      { status: 502 },
    );
  }
}
