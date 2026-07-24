/**
 * Posts del blog (F18 — contenido editorial). Modelo mínimo en TypeScript:
 * los seeds viven aquí como datos estáticos hasta que se monte una fuente
 * dinámica (MDX, CMS, Notion). El shape es estable para no romper el
 * `<BlogList>` cuando llegue la migración.
 *
 * Contrato e2e (TE-3.1, TE-3.2):
 *   - /blog → al menos 1 `.ak-blog-row` (count > 0)
 *   - /blog → `.ak-bloglist` visible (snapshot light + dark)
 */
export interface BlogPost {
  /** slug estable usado en /blog/<slug> (futuro) */
  slug: string;
  /** título mostrado en .ak-blog-title */
  title: string;
  /** fecha ISO; se renderiza como texto legible en .ak-blog-meta */
  date: string;
  /** categoría corta que se muestra como tag adicional en meta */
  category: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "por-que-tu-web-tarda-en-cargar",
    title: "¿Por qué tu web tarda tanto en cargar? — TL;DR técnico para no-devs",
    date: "2026-07-20",
    category: "Rendimiento",
  },
  {
    slug: "design-tokens-la-pieza-que-falta",
    title: "Design tokens: la pieza que falta en tu sistema visual",
    date: "2026-07-12",
    category: "Sistemas",
  },
  {
    slug: "stripe-checkout-vs-transferencia",
    title: "Stripe Checkout vs transferencia: cuándo uno y cuándo la otra",
    date: "2026-07-04",
    category: "Pagos",
  },
];
