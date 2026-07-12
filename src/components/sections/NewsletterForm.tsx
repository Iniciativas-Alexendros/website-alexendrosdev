"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Status = "idle" | "loading" | "ok" | "error";

// GDPR / LSSI: nota corta sobre el tratamiento de email + enlace a política de
// privacidad. Se muestra junto al formulario en todas las variantes para que el
// consentimiento quede contextualizado (Art. 13 RGPD).
function LegalNote() {
  return (
    <p
      className="ak-form-legal"
      style={{
        fontSize: "11px",
        color: "var(--ak-mute, #6b7785)",
        marginTop: 8,
        marginBottom: 0,
        lineHeight: 1.5,
      }}
    >
      Al suscribirte aceptas recibir emails transaccionales y contenido. Sólo uso tu email para eso;
      en cada envío hay un enlace de baja.{" "}
      <Link href="/legal/privacidad" style={{ textDecoration: "underline" }}>
        Política de privacidad
      </Link>
      .
    </p>
  );
}

export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "cta" | "coming" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("ok");
        setMsg("¡Gracias! Revisa tu correo.");
        setEmail("");
      } else {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setStatus("error");
        setMsg(data?.error ?? "No se pudo completar la suscripción.");
      }
    } catch {
      setStatus("error");
      setMsg("Error de red. Inténtalo de nuevo.");
    }
  }

  if (variant === "cta" || variant === "coming") {
    return (
      <form className="ak-cta-form" onSubmit={onSubmit}>
        <input
          type="email"
          required
          placeholder="tu@email.com"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button variant="primary" type="submit">
          {status === "loading" ? "Enviando…" : variant === "coming" ? "Avísame" : "Hablemos"}
          <Icon name="arrow-right" size={16} style={{ marginLeft: 6 }} />
        </Button>
        {status === "ok" || status === "error" ? (
          <p className="ak-form-msg" role="status" data-state={status}>
            {msg}
          </p>
        ) : null}
        <LegalNote />
      </form>
    );
  }

  return (
    <div>
      <form className="ak-footer-news" onSubmit={onSubmit}>
        <input
          type="email"
          required
          placeholder="tu@email.com"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button aria-label="Suscribirse" type="submit" disabled={status === "loading"}>
          <Icon name="arrow-right" size={16} />
        </button>
        {status === "ok" || status === "error" ? (
          <p className="ak-form-msg" role="status" data-state={status}>
            {msg}
          </p>
        ) : null}
      </form>
      <LegalNote />
    </div>
  );
}
