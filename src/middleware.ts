import { NextRequest, NextResponse } from "next/server";
import { isComingSoon } from "@/lib/flags";

// Rutas permitidas en modo "próximamente" (opt-in con COMING_SOON=1).
const COMING_SOON_ALLOW = ["/proximamente"];

export function middleware(request: NextRequest) {
  // Modo "próximamente": reescribe todo a /proximamente, salvo las rutas
  // permitidas. Se ejecuta antes del CSP porque un rewrite no necesita
  // cabeceras de seguridad en la página real.
  if (isComingSoon()) {
    const { pathname } = request.nextUrl;
    if (COMING_SOON_ALLOW.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/proximamente";
    return NextResponse.rewrite(url);
  }

  // CSP dinámico por request. Se genera un nonce por petición y se pasa a
  // Server Components vía x-nonce para que los scripts inline (tema, JSON-LD)
  // lo incluyan como atributo.
  //
  // ⚠️ script-src mantiene 'unsafe-inline': Next.js inyecta sus propios
  // scripts inline (RSC flight data, bootstrap) que no pueden llevar nonce
  // porque el framework no expone un mecanismo para inyectarlo. La infra-
  // estructura de nonces queda preparada para cuando Next.js lo soporte.
  // En CSP Level 3, 'unsafe-inline' se ignora si hay un nonce presente en
  // la directiva, así que no podemos incluir ambos simultáneamente.
  const nonce = crypto.randomUUID();
  const isDev = process.env.NODE_ENV !== "production";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

// Excluye /api/*, assets de Next (_next/*), y cualquier fichero estático
// (con punto: favicon.ico, robots.txt, sitemap.xml, imágenes…).
// El CSP solo aplica a páginas HTML; las APIs y assets no lo necesitan.
export const config = {
  matcher: ["/((?!api/|_next/|.*\\.).*)"],
};
