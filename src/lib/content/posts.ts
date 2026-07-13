/**
 * Carga de posts del blog desde `content/blog/*.mdx`.
 *
 * Criterio de publicación: un archivo se considera post publicado SOLO si tiene
 * frontmatter válido (id/title/date/tag). Los borradores sin frontmatter
 * (marcados como borrador/esqueleto en el calendario editorial) se omiten: el
 * blog no enlaza ni indexa contenido a medias.
 *
 * RSC-safe: se ejecuta en build/servidor. Usa `fs` + `gray-matter`.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Post } from "./types";

export type { Post };

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface LoadedPost extends Post {
  /** Cuerpo MDX ya sin el frontmatter. */
  body: string;
}

function isPost(data: unknown): data is Post {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.title === "string" &&
    typeof d.date === "string" &&
    typeof d.tag === "string"
  );
}

async function readPosts(): Promise<LoadedPost[]> {
  let files: string[];
  try {
    files = await fs.readdir(BLOG_DIR);
  } catch {
    return [];
  }

  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx"))
      .map(async (f) => {
        const raw = await fs.readFile(path.join(BLOG_DIR, f), "utf8");
        const { data, content } = matter(raw);
        if (!isPost(data)) return null;
        const post: LoadedPost = {
          id: data.id,
          title: data.title,
          tag: data.tag,
          date: data.date,
          read: typeof data.read === "string" ? data.read : "",
          featured: data.featured === true,
          desc: typeof data.desc === "string" ? data.desc : undefined,
          metaDescription:
            typeof data.metaDescription === "string"
              ? data.metaDescription
              : undefined,
          body: content.trim(),
        };
        return post;
      }),
  );

  return posts
    .filter((p): p is LoadedPost => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Posts publicados, ordenados por fecha descendente. */
export async function getPosts(): Promise<LoadedPost[]> {
  return readPosts();
}

/** Post por id, o `undefined` si no existe o es borrador. */
export async function getPost(id: string): Promise<LoadedPost | undefined> {
  const posts = await readPosts();
  return posts.find((p) => p.id === id);
}
