import type { NextConfig } from "next";

// Cabeceras de seguridad estáticas aplicadas a todas las rutas.
// Content-Security-Policy se sirve dinámicamente desde src/middleware.ts con
// nonces por request.
// - `frame-ancestors 'none'`: el sitio nunca se sirve en un <iframe>.
// - `X-Frame-Options: DENY`: defensa en navegadores heredados.
// - `style-src 'unsafe-inline'` en CSP sigue siendo necesario porque
//   Next.js/Tailwind inyectan <style> en build y next/font usa estilos inline.

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
  // Content-Security-Policy se sirve dinámicamente desde src/proxy.ts con
  // 'unsafe-inline' en script-src porque Next.js inyecta sus propios scripts
  // inline (RSC flight data) que no pueden llevar nonce. La infraestructura de
  // nonces (x-nonce header → Server Components → atributo nonce en <script>)
  // queda preparada para cuando el framework lo soporte.
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Capturas reales de proyectos con URLs externas conocidas.
      { protocol: "https", hostname: "alexendros.me" },
      { protocol: "https", hostname: "ecommerce-graficasnasve.vercel.app" },
      { protocol: "https", hostname: "crm.alexendros.dev" },
    ],
  },
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
