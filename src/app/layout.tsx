import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { RevealController } from "@/components/providers/RevealController";

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

const SITE_URL = "https://alexendros.pro";

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
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
        <RevealController />
      </body>
    </html>
  );
}
