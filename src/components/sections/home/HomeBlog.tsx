import Link from "next/link";
import { getPublishedPosts } from "@/lib/content/posts";
import { Eyebrow } from "@/components/ui/SectionHead";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function HomeBlog() {
  const posts = getPublishedPosts().slice(1, 5);
  return (
    <section className="ak-section" id="blog">
      <div
        className="ak-section-head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 28,
        }}
      >
        <div>
          <Eyebrow>blog · MDX</Eyebrow>
          <h2 className="ak-h2">Últimos artículos</h2>
        </div>
        <Button variant="ghost" href="/blog">
          Ver todos <Icon name="arrow-right" size={15} style={{ marginLeft: 5 }} />
        </Button>
      </div>
      <div className="ak-bloglist">
        {posts.map((p) => (
          <Link key={p.id} className="ak-blrow" href={`/blog/${p.id}`} data-reveal>
            <span className="ak-blrow-date">{p.date.replace(" 2026", "")}</span>
            <span className="ak-blrow-title">{p.title}</span>
            <span className="ak-tag">{p.tag}</span>
            <span className="ak-blrow-rt">{p.read}</span>
            <Icon name="arrow-up-right" size={16} style={{ color: "hsl(var(--text-link))" }} />
          </Link>
        ))}
      </div>
    </section>
  );
}
