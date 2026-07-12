import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

  const checks = {
    db,
    stripe: { ok: Boolean(process.env.STRIPE_SECRET_KEY) },
    resend: { ok: Boolean(process.env.RESEND_API_KEY) },
  };

  return NextResponse.json({
    status: "ok",
    degraded: !checks.db.ok || !checks.stripe.ok,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
    checks,
  });
}
