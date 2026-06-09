import type { Metadata } from "next";
import { BlogView } from "@/components/sections/blog/BlogView";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notas de ingeniería sobre seguridad, tooling, MCP y desarrollo fullstack.",
};

export default function BlogPage() {
  return <BlogView />;
}
