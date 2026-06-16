import type { NextConfig } from "next";

// Cabeceras de seguridad aplicadas a todas las rutas. Complementan el HSTS que ya
// inyecta Vercel. La CSP es deliberadamente permisiva con estilos/fuentes (Next +
// Tailwind inyectan <style> inline y next/font sirve fuentes self-hosted) y con el
// script inline de tema en app/layout.tsx; endurecerla a nonces es trabajo posterior.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' requerido por el theme script inline (layout.tsx) y estilos
      // inyectados por Next/Tailwind. Stripe.js se sirve desde js.stripe.com.
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // API de contacto/checkout propia + Stripe.
      "connect-src 'self' https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
