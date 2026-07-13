import { Eyebrow } from "@/components/ui/SectionHead";
import { NewsletterForm } from "@/components/sections/NewsletterForm";

export function HomeCTA() {
  return (
    <div className="ak-container">
      <section className="ak-cta">
        <div className="ak-cta-lead">
          <Eyebrow>siguiente paso</Eyebrow>
          <h2 className="ak-display">¿Construimos algo juntos?</h2>
          <p className="ak-cta-sub">
            Disponible para proyectos freelance y roles senior — respondo en menos de 24h.
          </p>
          <NewsletterForm variant="cta" />
        </div>
      </section>
    </div>
  );
}
