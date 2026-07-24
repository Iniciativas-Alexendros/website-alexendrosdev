import { describe, it, expect } from "vitest";
import { BLOG_POSTS, type BlogPost } from "@/lib/content/blog";

describe("BLOG_POSTS (F18 seed data for /blog)", () => {
  it("cumplen el contrato mínimo: ≥1 entrada con shape estable", () => {
    expect(BLOG_POSTS.length).toBeGreaterThan(0);
    for (const post of BLOG_POSTS) {
      expect(post, `post inválido: ${JSON.stringify(post)}`).toMatchObject({
        slug: expect.any(String),
        title: expect.any(String),
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        category: expect.any(String),
      } satisfies Partial<Record<keyof BlogPost, unknown>>);
    }
  });

  it("slugs únicos — sin colisiones accidentales en la lista", () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("al menos 3 entradas — cumple el contrato e2e (count > 0) y dota de substance al listado", () => {
    expect(BLOG_POSTS.length).toBeGreaterThanOrEqual(3);
  });
});
