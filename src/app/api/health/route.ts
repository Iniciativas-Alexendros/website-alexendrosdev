import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { snapshot } from "@/lib/monitor";

export const runtime = "nodejs";

// Healthcheck con verificación null-safe de dependencias críticas.
// El contrato público se mantiene: `status: "ok"` y HTTP 200 indican que la
// aplicación responde; el campo `checks` detalla el estado de cada
// dependencia sin exponer secretos ni mensajes de error, y `degraded`
// resume si alguna dependencia crítica (DB, pasarela de pago) no está lista.
export async function GET() {
  const db: { ok: boolean; ms?: number } = { ok: false };

  if (process.env.DATABASE_URL && prisma) {
    const t = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      db.ok = true;
      db.ms = Date.now() - t;
    } catch {
      db.ok = false;
    }
  }

  const mon = snapshot();

  // Derivar salud del webhook de Stripe desde métricas
  const webhookEvents = mon.metrics["stripe.webhook.received"];
  const webhookErrors = mon.metrics["stripe.webhook.error"];
  const webhookOk = webhookEvents
    ? (webhookErrors?.recent1h ?? 0) < 3 || (webhookErrors?.total ?? 0) < webhookEvents.total * 0.5
    : null; // null = sin datos (no se han recibido eventos aún, ok)

  // Salud del checkout
  const checkoutStarted = mon.metrics["checkout.started"];
  const checkoutErrors = mon.metrics["checkout.error"];
  const checkoutOk = checkoutStarted
    ? (checkoutErrors?.recent1h ?? 0) < 5 ||
      (checkoutErrors?.total ?? 0) < checkoutStarted.total * 0.3
    : null;

  // Estado de los agentes
  const agentsConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.OPENCODE_ZEN_API_KEY);
  const agentsOk = agentsConfigured ? Boolean(process.env.CRM_API_KEY) : null; // null = no configurado, no aplica

  const checks = {
    db,
    stripe: { ok: Boolean(process.env.STRIPE_SECRET_KEY) },
    resend: { ok: Boolean(process.env.RESEND_API_KEY) },
    webhook: {
      ok: webhookOk,
      detail: webhookEvents
        ? `${webhookEvents.total} eventos recibidos, ${webhookErrors?.total ?? 0} errores`
        : "sin eventos registrados",
    },
    checkout: {
      ok: checkoutOk,
      detail: checkoutStarted
        ? `${checkoutStarted.total} intentos, ${checkoutErrors?.total ?? 0} fallos`
        : "sin actividad",
    },
    agents: {
      ok: agentsOk,
      detail: agentsConfigured
        ? [
            process.env.GEMINI_API_KEY && "gemini",
            process.env.OPENCODE_ZEN_API_KEY && "opencode-zen",
          ]
            .filter(Boolean)
            .join("+")
        : "no configurados",
    },
  };

  return NextResponse.json({
    status: "ok",
    degraded: !checks.db.ok || !checks.stripe.ok,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
    uptime: `${mon.uptime}s`,
    startedAt: mon.startedAt,
    checks,
    metrics: {
      webhookFailures1h: webhookErrors?.recent1h ?? 0,
      checkoutFailures1h: checkoutErrors?.recent1h ?? 0,
      totalEvents1h: webhookEvents?.recent1h ?? 0,
      totalEvents: webhookEvents?.total ?? 0,
    },
  });
}
