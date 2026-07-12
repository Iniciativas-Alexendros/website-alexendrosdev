import "server-only";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Comparación de la API key en tiempo constante. `timingSafeEqual` exige
 * buffers de igual longitud; si difieren en longitud devolvemos `false` sin
 * comparar para no filtrar información por la longitud de la clave.
 */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Middleware de autenticación para la API CRM.
 *
 * Valida el header `X-API-Key` contra la variable de entorno `CRM_API_KEY`
 * (comparación timing-safe). Rate-limit: 30 req/min por IP en el propio
 * intento de autenticación (frena la fuerza bruta de la clave) y, tras auth
 * OK, 60 req/min por API key en el uso de la API.
 *
 * @returns `NextResponse` con error si la autenticación falla, `undefined` si OK.
 */
export function requireCrmAuth(req: Request): NextResponse | undefined {
  const crmApiKey = process.env.CRM_API_KEY;

  // Sin CRM_API_KEY configurada: la API CRM no está disponible
  if (!crmApiKey) {
    return NextResponse.json({ error: "CRM no disponible." }, { status: 503 });
  }

  // Rate-limit por IP en el intento de autenticación: evita fuerza bruta de
  // la clave (sin esto un atacante podía martillear X-API-Key sin límite).
  const ip = clientIp(req.headers);
  if (!rateLimit(`crm-auth:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const apiKey = req.headers.get("x-api-key");

  // Sin API key: no autorizado
  if (!apiKey) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // API key inválida (comparación timing-safe)
  if (!safeEqual(apiKey, crmApiKey)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Rate-limit por API key: 60 req/min
  if (!rateLimit(`crm:${crmApiKey}`, 60, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  // Auth OK
  return undefined;
}
