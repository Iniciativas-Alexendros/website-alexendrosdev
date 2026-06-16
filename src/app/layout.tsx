import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { RevealController } from "@/components/providers/RevealController";
import { isComingSoon } from "@/lib/flags";
import { JsonLd } from "@/components/JsonLd";
import { makeWebSiteJsonLd, makePersonJsonLd } from "@/lib/seo/jsonld";
import { Analytics } from "@vercel/analytics/next";

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
    default: "Alejandro Domingo Agustí · Desarrollo de plataformas, webs y apps",
    template: "%s · Alexendros",
  },
  description:
    "Desarrollo plataformas, webs y aplicaciones a medida en Valencia. Tecnología moderna, código que es tuyo y precios pensados para empresas nuevas y pequeñas.",
  authors: [{ name: "Alejandro Domingo Agustí" }],
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Alejandro Domingo Agustí · Desarrollo de plataformas, webs y apps",
    description:
      "Diseño y desarrollo el producto digital que tu negocio necesita: webs, aplicaciones y plataformas a medida, con tecnología moderna y código que es tuyo.",
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
  // En modo "próximamente" (opt-in con COMING_SOON=1) ocultamos la cabecera y el
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
        <JsonLd data={makeWebSiteJsonLd()} />
        <JsonLd data={makePersonJsonLd()} />
        <div className="ak-app">
          {!holding && <Header />}
          <main>{children}</main>
          {!holding && <Footer />}
        </div>
        <RevealController />
        <Analytics />
      </body>
    </html>
  );
}
