import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPost, getPosts } from "@/lib/content/posts";
import { JsonLd } from "@/components/JsonLd";
import { makeBlogPostingJsonLd } from "@/lib/seo/jsonld";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post no encontrado" };
  return {
    title: post.title,
    description: post.metaDescription ?? post.desc ?? post.title,
    alternates: { canonical: `/blog/${post.id}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription ?? post.desc ?? post.title,
      type: "article",
      publishedTime: post.date,
      tags: [post.tag],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="ak-container">
      <JsonLd data={makeBlogPostingJsonLd(post)} />
      <header className="ak-post-head">
        <Link className="ak-post-back" href="/blog">
          ← Blog
        </Link>
        <div className="ak-post-meta">
          <span className="ak-post-tag">{post.tag}</span>
          <time className="ak-post-date" dateTime={post.date}>
            {post.date}
          </time>
          {post.read && <span className="ak-post-read">{post.read}</span>}
        </div>
        <h1 className="ak-post-h1">{post.title}</h1>
        {post.desc && <p className="ak-post-lead">{post.desc}</p>}
      </header>
      <div className="ak-prose ak-post-body">
        <MDXRemote source={post.body} components={{ h1: "h2", h2: "h3", h3: "h4" }} />
      </div>
    </article>
  );
}
