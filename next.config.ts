import type { NextConfig } from "next";

// Cabeceras de seguridad aplicadas a todas las rutas. Complementan el HSTS que ya
// inyecta Vercel.
// - `frame-ancestors 'none'`: el sitio nunca se sirve en un <iframe>.
// - `X-Frame-Options: DENY`: defensa en navegadores heredados.
// - `style-src 'self' 'unsafe-inline'`: Next/Tailwind inyectan <style> en build y
//   next/font sirve fuentes self-hosted; no hay forma práctica de hashearlos.
// - `script-src 'self' 'unsafe-inline'`: Next.js inyecta scripts inline de
//   bootstrap/flight y el script de tema (layout.tsx) es inline. Hasear todos
//   esos hashes es frágil (rompe la hidratación); para una web estática
//   auto-alojada esto es la política correcta y funcional.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
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
