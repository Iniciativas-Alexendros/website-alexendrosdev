import type { Metadata } from "next";
import { BlogList } from "@/components/blog/BlogList";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notas sobre desarrollo a medida, sistemas de diseño y decisiones técnicas de Alexendros.",
};

// F18 — primera iteración pública. El listado se hidrata desde seeds en
// `src/lib/content/blog.ts`; cuando se monte MDX o un CMS, sólo cambia
// el origen de datos, el `<BlogList>` permanece. Estilo: solo clases
// canónicas ya definidas en `src/styles/site.css` (ak-section, ak-section-head,
// ak-blog-top, ak-bloglist). Cero inline styles.
export default function BlogIndexPage() {
  return (
    <div className="ak-container">
      <section className="ak-section">
        <header className="ak-section-head ak-stack-2">
          <p className="ak-eyebrow">Notas</p>
          <h1 className="ak-h1">Blog</h1>
          <p className="ak-section-sub">
            Decisiones técnicas y notas cortas sobre desarrollo a medida, sistemas de diseño y todo
            lo que aparece entre el brief y el primer deploy.
          </p>
        </header>

        <BlogList />
      </section>
    </div>
  );
}
