"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Status = "idle" | "loading" | "ok" | "error";

// GDPR / LSSI: nota corta sobre el tratamiento de email + enlace a política de
// privacidad. Se muestra junto al formulario en todas las variantes para que el
// consentimiento quede contextualizado (Art. 13 RGPD).
function LegalNote() {
  return (
    <p className="ak-form-legal">
      Al suscribirte aceptas recibir emails transaccionales y contenido. Sólo uso tu email para eso;
      en cada envío hay un enlace de baja.{" "}
      <Link href="/legal/privacidad">Política de privacidad</Link>.
    </p>
  );
}

export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "cta" | "coming" }) {
  const emailId = useId();
  const messageId = `${emailId}-message`;
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
        track("newsletter_submitted");
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
      <div>
        <form className="ak-cta-form" onSubmit={onSubmit}>
          <input
            id={`${emailId}-cta`}
            type="email"
            required
            inputMode="email"
            name="email"
            placeholder="tu@email.com"
            aria-label="Email"
            autoComplete="email"
            spellCheck={false}
            aria-describedby={status === "error" || status === "ok" ? messageId : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button variant="primary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Enviando…" : variant === "coming" ? "Avísame" : "Hablemos"}
            <Icon name="arrow-right" size={16} style={{ marginLeft: 6 }} />
          </Button>
        </form>
        {status === "ok" || status === "error" ? (
          <p
            id={messageId}
            className="ak-form-msg"
            role="status"
            aria-live={status === "error" ? "assertive" : "polite"}
            data-state={status}
          >
            {msg}
          </p>
        ) : null}
        <LegalNote />
      </div>
    );
  }

  return (
    <div>
      <form className="ak-footer-news" onSubmit={onSubmit} aria-label="Suscripción a la newsletter">
        <input
          id={`${emailId}-footer`}
          type="email"
          required
          inputMode="email"
          name="email"
          placeholder="tu@email.com"
          aria-label="Email"
          autoComplete="email"
          spellCheck={false}
          aria-describedby={status === "error" || status === "ok" ? messageId : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          aria-label="Suscribirse"
          type="submit"
          disabled={status === "loading"}
          className="ak-newsletter-submit"
        >
          <Icon name="arrow-right" size={16} />
        </button>
        {status === "ok" || status === "error" ? (
          <p
            id={messageId}
            className="ak-form-msg"
            role="status"
            aria-live={status === "error" ? "assertive" : "polite"}
            data-state={status}
          >
            {msg}
          </p>
        ) : null}
      </form>
      <LegalNote />
    </div>
  );
}
