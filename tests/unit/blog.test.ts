import { describe, expect, it } from "vitest";
import { getPostSource } from "@/lib/blog";
import { POSTS, getPublishedPosts, isPostPublished, parsePostDate } from "@/lib/content/posts";

describe("getPostSource", () => {
  it("devuelve el cuerpo MDX de un post existente", () => {
    const src = getPostSource(POSTS[0]!.id);
    expect(src).toBeTypeOf("string");
    expect((src ?? "").length).toBeGreaterThan(0);
  });

  it("devuelve null cuando el archivo MDX no existe", () => {
    expect(getPostSource("slug-que-no-existe-xyz")).toBeNull();
  });
});

describe("calendario editorial (posts.ts)", () => {
  const past = { id: "x", title: "t", tag: "t", date: "1 Ene 2026", read: "1 min" };
  const future = { id: "y", title: "t", tag: "t", date: "31 Dic 2099", read: "1 min" };

  it("parsea fechas en formato editorial español", () => {
    const d = parsePostDate("30 Jul 2026");
    expect(d).toBeInstanceOf(Date);
    expect(d?.getUTCFullYear()).toBe(2026);
    expect(d?.getUTCMonth()).toBe(6);
    expect(d?.getUTCDate()).toBe(30);
  });

  it("devuelve null ante fechas no parseables", () => {
    expect(parsePostDate("ayer")).toBeNull();
  });

  it("publica posts con fecha pasada o del día", () => {
    expect(isPostPublished(past)).toBe(true);
    const today = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const todayNorm = today.charAt(0).toUpperCase() + today.slice(1);
    expect(isPostPublished({ ...past, date: todayNorm })).toBe(true);
  });

  it("oculta posts con fecha futura", () => {
    expect(isPostPublished(future)).toBe(false);
    expect(getPublishedPosts().some((p) => p.id === future.id)).toBe(false);
  });

  it("getPublishedPosts respeta el instante de referencia", () => {
    const posts = [past, future];
    const ref = new Date(Date.UTC(2100, 0, 1));
    expect(posts.filter((p) => isPostPublished(p, ref))).toHaveLength(2);
  });
});
