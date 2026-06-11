"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Status = "idle" | "loading" | "ok" | "error";

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
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
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
      </form>
    );
  }

  return (
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
  );
}
