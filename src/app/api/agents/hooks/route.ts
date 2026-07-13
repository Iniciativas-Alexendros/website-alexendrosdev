import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm-auth";
import { z } from "zod";
import { processHookEvent, type StripeEvent } from "@/lib/agents/auditor";
import { hasGemini, hasOpenCodeZen, hasAnyLLM } from "@/lib/agents/config";

// POST /api/agents/hooks
// Recibe eventos de Stripe (enviados manualmente o desde el webhook de Stripe)
// y los clasifica con el agente Auditor. Auth: X-API-Key del CRM.

const stripeEventSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1).max(100),
  data: z
    .object({
      object: z
        .object({
          amount: z.number().optional(),
          currency: z.string().optional(),
          metadata: z.record(z.string(), z.string()).optional(),
          last_payment_error: z.object({ message: z.string() }).optional(),
          customer: z.string().optional(),
          subscription: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  created: z.number().optional(),
});

export async function POST(req: Request) {
  const authErr = requireCrmAuth(req);
  if (authErr) return authErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido." }, { status: 400 });
  }

  const parsed = stripeEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Evento de Stripe inválido.", fields: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const result = await processHookEvent(parsed.data as StripeEvent);

  // Anomalía: si supera el threshold, el agente debería alertar.
  // El envío de email vía Resend se hace en S4 (alertas). Aquí solo log.
  if (result.isAnomaly) {
    console.warn(
      `[auditor] Anomalía detectada: ${result.failureCount} fallos de checkout en <5min`,
    );
  }

  return NextResponse.json({
    ok: true,
    classification: result.classification,
    anomaly: result.isAnomaly,
    failureCount: result.failureCount,
    llm: {
      gemini: hasGemini(),
      opencodeZen: hasOpenCodeZen(),
      any: hasAnyLLM(),
    },
    mode: result.mode,
  });
}
