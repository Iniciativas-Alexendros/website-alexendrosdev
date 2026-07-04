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
 */
export function PurchaseCard({ item }: { item: PurchasableItem }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // F12: detectar recurring por el intervalo. El campo `interval` no está en
  // PurchasableItem (legacy), pero el id del item lo indica.
  const isRecurring = item.id.startsWith("retainer-");

  async function buy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          ...(isRecurring && { mode: "subscription" }),
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (res.ok && body?.url) {
        window.location.href = body.url;
        return; // redirección en curso
      }
      setError(body?.error ?? "No se pudo iniciar el pago. Inténtalo de nuevo.");
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
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
      <Button
        variant="secondary"
        onClick={buy}
        disabled={loading}
        style={{ width: "100%", justifyContent: "center" }}
      >
        <Icon name="external-link" size={15} style={{ marginRight: 7 }} />
        {loading ? "Redirigiendo…" : isRecurring ? "Contratar" : "Pagar ahora"}
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
