import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Suscripción confirmada",
  robots: { index: false },
};

export default async function NewsletterConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const failed = error === "1";

  return (
    <div className="ak-container">
      <section className="ak-section" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="ak-form-card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="ak-success">
            <span className="ak-success-ic">
              <Icon name={failed ? "alert-circle" : "check"} size={28} />
            </span>
            <h1 style={{ margin: 0 }}>
              {failed ? "Enlace no válido" : "¡Suscripción confirmada!"}
            </h1>
            <p className="ak-principle-body" style={{ margin: 0, maxWidth: "44ch" }}>
              {failed
                ? "El enlace de confirmación no es válido o ha caducado. Vuelve a suscribirte para recibir uno nuevo."
                : "Ya estás en la lista. Recibirás mis notas sobre desarrollo, productos digitales e ingeniería, sin spam."}
            </p>
            <Button variant="secondary" href="/">
              Volver al inicio
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
