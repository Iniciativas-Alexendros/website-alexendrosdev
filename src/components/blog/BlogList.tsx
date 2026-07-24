import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { BLOG_POSTS, type BlogPost } from "@/lib/content/blog";

/**
 * Lista de entradas del blog. Server Component — los seeds viven en
 * `src/lib/content/blog.ts` (cambiar a fetch dinámico cuando integre
 * CMS/MDX). Renderiza las clases `.ak-bloglist` y `.ak-blog-row` que
 * ya están definidas en `src/styles/site.css`.
 *
 * Por qué Server y no Client:
 *   - No necesita estado ni eventos.
 *   - SEO: el HTML ya llega con cada post al usuario/crawler.
 */
export function BlogList() {
  return (
    <ul className="ak-bloglist" aria-label="Lista de entradas del blog">
      {BLOG_POSTS.map((post) => (
        <li key={post.slug}>
          <BlogRow post={post} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Localiza una fecha ISO "YYYY-MM-DD" a formato corto español.
 * "2026-07-20" → "20 jul 2026". Determinista cross-platform (CI + navegador)
 * porque Intl.DateTimeFormat con timeZone UTC evita drift por zona.
 */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  // Construir fecha en UTC midnight para evitar interpretación local.
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function BlogRow({ post }: { post: BlogPost }) {
  // aria-label se omite: el children incluye el título visible que ya
  // actúa como accessible name (WAI-ARIA recomienda preferir contenido
  // de texto sobre aria-label cuando el texto es semántico).
  const titleId = `post-${post.slug}-title`;
  return (
    <Link href={`/blog/${post.slug}`} className="ak-blog-row">
      <span className="ak-blog-meta" aria-label="Fecha de publicación">
        {formatDate(post.date)}
      </span>
      <span className="ak-blog-title" id={titleId}>
        {post.title}
      </span>
      <span className="ak-blog-meta" aria-label="Categoría">
        {post.category}
      </span>
      <Icon name="arrow-right" size={14} aria-hidden="true" />
    </Link>
  );
}
