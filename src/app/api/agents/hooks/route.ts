import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm-auth";
import { z } from "zod";
import { processHookEvent, type StripeEvent } from "@/lib/agents/auditor";
import { hasGemini, hasOpenCodeZen, hasAnyLLM } from "@/lib/agents/config";

// POST /api/agents/hooks
// Recibe eventos de Stripe (enviados manualmente o desde el webhook de Stripe)
// y los clasifica con el agente Auditor. Auth: X-API-Key del CRM.

// Vercel serverless functions are killed mid-flight at 15s (Hobby) / 60s (Pro).
// Cap the total time the LLM-invoking call can take so we return a graceful 504
// instead of a truncated response.
const AGENT_TIMEOUT_MS = 25_000;

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

  try {
    const result = await Promise.race([
      processHookEvent(parsed.data as StripeEvent),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), AGENT_TIMEOUT_MS),
      ),
    ]);

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
  } catch (error) {
    if (error instanceof Error && error.message === "TIMEOUT") {
      return NextResponse.json(
        { error: "Tiempo de espera agotado. Intenta reenviar el evento." },
        { status: 504 },
      );
    }
    throw error;
  }
}
