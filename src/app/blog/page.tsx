import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/content/posts";
import { SectionHead } from "@/components/ui/SectionHead";

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
        <SectionHead
          eyebrow="blog"
          title="Notas de ingeniería"
          sub="Lo que aprendo construyendo plataformas, webs y aplicaciones a medida."
        />
      </section>

      <section className="ak-section">
        <ul className="ak-post-grid">
          {posts.map((p) => (
            <li key={p.id}>
              <Link className="ak-post-card" href={`/blog/${p.id}`}>
                <div className="ak-post-meta">
                  <span className="ak-post-tag">{p.tag}</span>
                  <time className="ak-post-date" dateTime={p.date}>
                    {p.date}
                  </time>
                </div>
                <h2 className="ak-post-title">{p.title}</h2>
                {p.desc && <p className="ak-post-desc">{p.desc}</p>}
                {p.read && <span className="ak-post-read">{p.read} de lectura</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
