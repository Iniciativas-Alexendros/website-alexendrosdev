"use client";

import { useState } from "react";
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
          {isRecurring && <small style={{ marginLeft: 4 }}>/mes</small>}
        </div>
        <p className="ak-principle-body" style={{ margin: "0 0 16px", flex: 1 }}>
          Realiza la transferencia con los datos siguientes. Te aviso en cuanto la reciba.
        </p>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "6px 12px",
            fontSize: 13,
            margin: "0 0 16px",
          }}
        >
          <dt style={{ opacity: 0.7 }}>Importe</dt>
          <dd style={{ margin: 0 }}>
            <strong>
              {transferInfo.amount} {transferInfo.currency.toUpperCase()}
            </strong>
          </dd>
          <dt style={{ opacity: 0.7 }}>Beneficiario</dt>
          <dd style={{ margin: 0 }}>{transferInfo.beneficiary}</dd>
          {transferInfo.bank && (
            <>
              <dt style={{ opacity: 0.7 }}>Banco</dt>
              <dd style={{ margin: 0 }}>{transferInfo.bank}</dd>
            </>
          )}
          <dt style={{ opacity: 0.7 }}>IBAN</dt>
          <dd style={{ margin: 0, fontFamily: "monospace" }}>{transferInfo.iban}</dd>
          <dt style={{ opacity: 0.7 }}>Concepto</dt>
          <dd style={{ margin: 0, fontFamily: "monospace" }}>{transferInfo.reference}</dd>
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
        {isRecurring && <small style={{ marginLeft: 4 }}>/mes</small>}
      </div>
      <p className="ak-principle-body" style={{ margin: "0 0 16px", flex: 1 }}>
        {item.desc}
      </p>

      <div
        role="radiogroup"
        aria-label="Método de pago"
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 12,
          padding: 4,
          borderRadius: 8,
          background: "var(--ak-surface-2, rgba(0,0,0,0.04))",
        }}
      >
        <button
          type="button"
          role="radio"
          aria-checked={method === "stripe"}
          onClick={() => setMethod("stripe")}
          style={{
            flex: 1,
            padding: "6px 10px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            background: method === "stripe" ? "var(--ak-bg, #fff)" : "transparent",
            fontWeight: method === "stripe" ? 600 : 400,
          }}
        >
          Tarjeta
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={method === "transfer"}
          onClick={() => setMethod("transfer")}
          style={{
            flex: 1,
            padding: "6px 10px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            background: method === "transfer" ? "var(--ak-bg, #fff)" : "transparent",
            fontWeight: method === "transfer" ? 600 : 400,
          }}
        >
          Transferencia
        </button>
      </div>

      {method === "transfer" && (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            required
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--ak-border, rgba(0,0,0,0.15))",
              background: "var(--ak-bg, #fff)",
              color: "inherit",
            }}
          />
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Nombre"
            required
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--ak-border, rgba(0,0,0,0.15))",
              background: "var(--ak-bg, #fff)",
              color: "inherit",
            }}
          />
        </div>
      )}

      <Button
        variant="secondary"
        onClick={buy}
        disabled={loading || (method === "transfer" && (!email || !name))}
        style={{ width: "100%", justifyContent: "center" }}
      >
        <Icon name="external-link" size={15} style={{ marginRight: 7 }} />
        {loading
          ? "Procesando…"
          : method === "transfer"
            ? "Solicitar datos de transferencia"
            : isRecurring
              ? "Contratar"
              : "Pagar ahora"}
      </Button>
      {error && (
        <span className="ak-err-msg" style={{ marginTop: 10 }}>
          <Icon name="alert-circle" size={13} />
          {error}
        </span>
      )}
    </div>
  );
}
