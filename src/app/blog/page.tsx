import type { Metadata } from "next";
import { getPosts } from "@/lib/content/posts";
import { SectionHead } from "@/components/ui/SectionHead";
import { BlogSearch } from "@/components/blog/BlogSearch";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notas de ingeniería, precios reales de desarrollo a medida y cómo elegir la tecnología correcta para tu proyecto.",
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="ak-container">
      <section className="ak-section" style={{ paddingBottom: 0 }}>
        <h1 className="ak-page-title">Blog</h1>
        <SectionHead
          eyebrow="blog"
          title="Notas de ingeniería"
          sub="Lo que aprendo construyendo plataformas, webs y aplicaciones a medida."
        />
      </section>

      <section className="ak-section">
        <p className="ak-count" aria-live="polite">
          {posts.length} artículos
        </p>
        <BlogSearch posts={posts} />
      </section>
    </div>
  );
}
