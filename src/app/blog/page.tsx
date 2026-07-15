import type { Metadata } from "next";
import { getPosts } from "@/lib/content/posts";
import { BlogView } from "@/components/sections/blog/BlogView";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notas de ingeniería, precios reales de desarrollo a medida y cómo elegir la tecnología correcta para tu proyecto.",
};

export default async function BlogPage() {
  const posts = await getPosts();

  return <BlogView posts={posts} />;
}
