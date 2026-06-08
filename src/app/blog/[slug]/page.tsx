import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import { POSTS, SITE, getPost } from "@/lib/content";
import { extractToc, getPostSource } from "@/lib/blog";
import { Icon } from "@/components/ui/Icon";
import { SectionHead } from "@/components/ui/SectionHead";
import { PostToc } from "@/components/sections/blog/PostToc";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  const description = p.desc ?? `${p.title} — nota de ingeniería.`;
  return {
    title: p.title,
    description,
    openGraph: { title: p.title, description, type: "article" },
  };
}

function shortDate(d: string) {
  return d.replace(/ 20\d\d$/, "");
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();

  const source = getPostSource(slug);
  const toc = source ? extractToc(source) : [];
  const related = POSTS.filter((x) => x.id !== p.id).slice(0, 3);

  return (
    <div className="ak-container">
      <Link className="ak-back" href="/blog">
        <Icon name="arrow-left" size={15} />
        Blog
      </Link>
      <section className="ak-detail-hero">
        <div className="ak-detail-meta">
          <span className="ak-tag">{p.tag}</span>
          <span>{p.date}</span>
          <span>·</span>
          <span>{p.read}</span>
        </div>
        <h1 className="ak-detail-title">{p.title}</h1>
        <div className="ak-byline">
          <span className="ak-avatar" />
          <span>
            <div className="ak-byline-name">{SITE.name}</div>
            <div className="ak-byline-sub">{SITE.role}</div>
          </span>
        </div>
      </section>

      <div className="ak-ph ak-ph-grad ak-hero-shot" data-reveal>
        <span className="ak-ph-label">cover del artículo</span>
      </div>

      <section className="ak-section" style={{ paddingTop: 36 }}>
        <div className="ak-post-grid2">
          <PostToc items={toc} />
          <article className="ak-prose">
            {source ? (
              <MDXRemote
                source={source}
                options={{ mdxOptions: { rehypePlugins: [rehypeSlug] } }}
              />
            ) : (
              <>
                <p>
                  {p.desc ?? "Entradilla del artículo: una o dos frases que resumen el contenido."}
                </p>
                <p>
                  Contenido marcador para «{p.title}». Este artículo se redactará en MDX en
                  <code> content/blog/{p.id}.mdx</code>.
                </p>
              </>
            )}
          </article>
        </div>
      </section>

      <section className="ak-section" style={{ paddingTop: 0 }}>
        <SectionHead eyebrow="seguir leyendo" title="Artículos relacionados" />
        <div className="ak-postgrid">
          {related.map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`} className="ak-postcard">
              <div className="ak-postcard-media ak-ph ak-ph-grad" style={{ borderRadius: 0 }}>
                <span className="ak-ph-label">cover</span>
              </div>
              <div className="ak-postcard-body">
                <div className="ak-postcard-meta">
                  <span className="ak-postcard-date">{shortDate(post.date)}</span>
                  <span className="ak-tag">{post.tag}</span>
                </div>
                <h3 className="ak-postcard-title">{post.title}</h3>
                <div className="ak-postcard-foot">
                  <span className="ak-postcard-rt">{post.read}</span>
                  <Icon
                    name="arrow-up-right"
                    size={16}
                    style={{ color: "hsl(var(--text-link))" }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
