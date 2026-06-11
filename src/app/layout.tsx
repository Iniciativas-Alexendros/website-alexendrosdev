import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { RevealController } from "@/components/providers/RevealController";
import { isComingSoon } from "@/lib/flags";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL = "https://alexendros.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Alejandro Domingo Agustí · Software & Platform Engineer",
    template: "%s · Alexendros",
  },
  description:
    "Software & Platform Engineer en Valencia. Seguridad, tooling e infraestructura auditable en Rust, Python y TypeScript. Disponible para proyectos freelance.",
  authors: [{ name: "Alejandro Domingo Agustí" }],
  openGraph: {
    title: "Alejandro Domingo Agustí · Software & Platform Engineer",
    description:
      "Seguridad, tooling e infraestructura auditable en Rust, Python y TypeScript. Gateways de credenciales, verificación check-only y fullstack.",
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
  },
};

// Script bloqueante: aplica el tema antes del primer paint para evitar el
// flash de tema incorrecto. Lee localStorage 'ao-theme' (igual que el toggle).
const themeScript = `(function(){try{var t=localStorage.getItem('ao-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // En modo "próximamente" (producción por defecto) ocultamos la cabecera y el
  // pie: la landing de holding es full-screen, sin navegación al sitio completo.
  const holding = isComingSoon();

  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="ak-app">
          {!holding && <Header />}
          <main>{children}</main>
          {!holding && <Footer />}
        </div>
        <RevealController />
      </body>
    </html>
  );
}
