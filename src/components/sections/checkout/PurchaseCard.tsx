"use client";

import { useState } from "react";
import { track } from "@vercel/analytics/react";
import { formatPrice } from "@/lib/content";
import type { PurchasableItem } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * Isla cliente reutilizable para iniciar el pago de un item comprable.
 * Solo envía el `id` a /api/checkout (el precio es fuente de verdad del
 * servidor) y redirige a Stripe; degrada con un mensaje si recibe 503.
 *
 * F12: detecta si el item es recurring (mensual) y ajusta el texto del botón
 * y el modo enviado al servidor.
 *
 * F13: toggle Tarjeta/Transferencia. Si el usuario elige transferencia, se
 * piden email + nombre y se muestran las instrucciones de pago (IBAN,
 * beneficiario, referencia) en lugar de redirigir a Stripe.
 */
export function PurchaseCard({ item }: { item: PurchasableItem }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<"stripe" | "transfer">("stripe");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [transferInfo, setTransferInfo] = useState<null | {
    iban: string;
    beneficiary: string;
    bank?: string;
    reference: string;
    amount: string;
    currency: string;
    concept: string;
  }>(null);

  const isRecurring = item.id.startsWith("retainer-");

  async function buy() {
    setLoading(true);
    setError(null);
    track("checkout_started", { item_id: item.id });
    try {
      const body: Record<string, unknown> = { itemId: item.id };
      if (isRecurring && method === "stripe") body.mode = "subscription";
      if (method === "transfer") {
        body.paymentMethod = "transfer";
        body.email = email;
        body.name = name;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        method?: string;
        iban?: string;
        beneficiary?: string;
        bank?: string;
        reference?: string;
        amount?: string;
        currency?: string;
        concept?: string;
        error?: string;
      } | null;

      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      if (res.ok && data?.method === "transfer" && data.iban) {
        setTransferInfo({
          iban: data.iban,
          beneficiary: data.beneficiary ?? "",
          bank: data.bank,
          reference: data.reference ?? "",
          amount: data.amount ?? "",
          currency: data.currency ?? "eur",
          concept: data.concept ?? "",
        });
        return;
      }
      setError(data?.error ?? "No se pudo iniciar el pago. Inténtalo de nuevo.");
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (transferInfo) {
    return (
      <div className="ak-tier" data-testid="transfer-instructions">
        <div className="ak-tier-name">{item.name}</div>
        <div className="ak-tier-price">
          {formatPrice(item.amount, item.currency)}
          {isRecurring && <small className="ak-pc-recurring">/mes</small>}
        </div>
        <p className="ak-principle-body" style={{ margin: "0 0 var(--space-4)", flex: 1 }}>
          Realiza la transferencia con los datos siguientes. Te aviso en cuanto la reciba.
        </p>
        <dl className="ak-pc-transfer-dl">
          <dt>Importe</dt>
          <dd>
            <strong>
              {transferInfo.amount} {transferInfo.currency.toUpperCase()}
            </strong>
          </dd>
          <dt>Beneficiario</dt>
          <dd>{transferInfo.beneficiary}</dd>
          {transferInfo.bank && (
            <>
              <dt>Banco</dt>
              <dd>{transferInfo.bank}</dd>
            </>
          )}
          <dt>IBAN</dt>
          <dd>
            <code>{transferInfo.iban}</code>
          </dd>
          <dt>Concepto</dt>
          <dd>
            <code>{transferInfo.reference}</code>
          </dd>
        </dl>
        <Button
          variant="secondary"
          onClick={() => setTransferInfo(null)}
          style={{ width: "100%", justifyContent: "center" }}
        >
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="ak-tier">
      <div className="ak-tier-name">{item.name}</div>
      <div className="ak-tier-price">
        {formatPrice(item.amount, item.currency)}
        {isRecurring && <small className="ak-pc-recurring">/mes</small>}
      </div>
      <p className="ak-principle-body" style={{ margin: "0 0 var(--space-4)", flex: 1 }}>
        {item.desc}
      </p>

      <div
        role="radiogroup"
        aria-label="Método de pago"
        onKeyDown={(e) => {
          const opts = ["stripe", "transfer"] as const;
          const idx = opts.indexOf(method);
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            setMethod(opts[(idx + 1) % opts.length]);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            setMethod(opts[(idx - 1 + opts.length) % opts.length]);
          }
        }}
        className="ak-pc-radio-group"
      >
        <button
          type="button"
          role="radio"
          aria-checked={method === "stripe"}
          tabIndex={method === "stripe" ? 0 : -1}
          onClick={() => setMethod("stripe")}
          className="ak-pc-radio-btn"
        >
          Tarjeta
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={method === "transfer"}
          tabIndex={method === "transfer" ? 0 : -1}
          onClick={() => setMethod("transfer")}
          className="ak-pc-radio-btn"
        >
          Transferencia
        </button>
      </div>

      {method === "transfer" && (
        <div className="ak-pc-transfer-fields">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            required
            className="ak-input"
          />
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Nombre"
            required
            className="ak-input"
          />
        </div>
      )}

      <Button
        variant="secondary"
        onClick={buy}
        disabled={loading || (method === "transfer" && (!email || !name))}
        style={{ width: "100%", justifyContent: "center" }}
      >
        <Icon name="external-link" size={15} style={{ marginRight: "var(--space-2)" }} />
        {loading
          ? "Procesando…"
          : method === "transfer"
            ? "Solicitar datos de transferencia"
            : isRecurring
              ? "Contratar"
              : "Pagar ahora"}
      </Button>
      {error && (
        <span className="ak-err-msg" style={{ marginTop: "var(--space-3)" }}>
          <Icon name="alert-circle" size={13} />
          {error}
        </span>
      )}
    </div>
  );
}
