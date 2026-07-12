import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Alexendros — Desarrollo de plataformas, webs y apps";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "96px",
        backgroundImage: "linear-gradient(135deg, #0a0a0a 0%, #111827 55%, #1f2937 100%)",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 28,
          letterSpacing: 4,
          textTransform: "uppercase",
          opacity: 0.7,
          marginBottom: 24,
        }}
      >
        Alexendros
      </div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -2,
          maxWidth: 1000,
        }}
      >
        Desarrollo de plataformas, webs y apps
      </div>
      <div
        style={{
          fontSize: 40,
          fontWeight: 500,
          lineHeight: 1.2,
          marginTop: 32,
          maxWidth: 1000,
          color: "#e5e7eb",
        }}
      >
        A medida · Valencia · España
      </div>
      <div
        style={{
          fontSize: 28,
          marginTop: 48,
          color: "#9ca3af",
        }}
      >
        Valencia · España
      </div>
    </div>,
    {
      ...size,
    },
  );
}
