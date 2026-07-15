import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { isComingSoon } from "@/lib/flags";
import { JsonLd } from "@/components/JsonLd";
import { makeWebSiteJsonLd, makePersonJsonLd } from "@/lib/seo/jsonld";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL = "https://alexendros.dev";

const SITE_TITLE = "Alejandro Domingo Agustí · Desarrollo a medida en Valencia";
const SITE_DESCRIPTION =
  "Desarrollo plataformas, webs y aplicaciones a medida en Valencia. Tecnología moderna, código que es tuyo y precios pensados para empresas nuevas y pequeñas.";
const OG_IMAGE = "/opengraph-image";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Alexendros",
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: "Alejandro Domingo Agustí" }],
  alternates: {
    canonical: "./",
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "Blog — Alexendros" }],
    },
  },
  openGraph: {
    title: SITE_TITLE,
    description:
      "Diseño y desarrollo el producto digital que tu negocio necesita: webs, aplicaciones y plataformas a medida, con tecnología moderna y código que es tuyo.",
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE,
        alt: "Alexendros — Desarrollo de plataformas, webs y apps",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
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
      className={`${geist.variable} ${geistMono.variable} ${jetbrainsMono.variable}`}
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
