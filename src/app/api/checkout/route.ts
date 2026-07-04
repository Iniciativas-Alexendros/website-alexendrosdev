import { NextResponse } from "next/server";
import { checkoutSchema, flattenErrors } from "@/lib/validation";
import { getCatalogItem } from "@/lib/content/catalog";
import { stripe, BASE_URL } from "@/lib/stripe";
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

  // F12: el mode efectivo se deriva del tipo del catálogo. Si el cliente pide
  // subscription para un item one_time, forzamos payment (UX friendly, no 422).
  const effectiveMode =
    item.type === "recurring" ? (parsed.data.mode ?? "subscription") : "payment";
  if (parsed.data.mode === "subscription" && item.type === "one_time") {
    console.warn(`[checkout] mode=subscription ignorado para item one_time: ${item.id}`);
  }

  // Degradación sin credenciales: sin STRIPE_SECRET_KEY no hay pasarela. Se
  // responde 503 para que el cliente ofrezca el canal de contacto como fallback.
  if (!stripe) {
    return NextResponse.json(
      {
        error: "Pagos no disponibles temporalmente. Escríbeme y lo gestionamos.",
      },
      { status: 503 },
    );
  }

  const origin = req.headers.get("origin") ?? BASE_URL;

  try {
    // F12: construir line_items según el modo efectivo.
    const lineItem =
      effectiveMode === "subscription"
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
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 502 });
  }
}
