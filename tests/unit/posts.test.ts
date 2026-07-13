import { describe, expect, it } from "vitest";
import { getPosts, getPost } from "@/lib/content/posts";

describe("loader de posts del blog", () => {
  it("publica solo posts con frontmatter válido (omite borradores sin frontmatter)", async () => {
    const posts = await getPosts();
    const ids = posts.map((p) => p.id);
    // Los 2 marcados "✅ publicado" en el calendario editorial.
    expect(ids).toContain("cuanto-cuesta-web-medida-2026");
    expect(ids).toContain("wordpress-vs-desarrollo-medida-2026");
    // Los .mdx sin frontmatter (borrador/esqueleto) NO se indexan.
    expect(ids).not.toContain("devin-desktop-mcp-inconsistencias");
    expect(ids).not.toContain("plantillas-claude-init");
    expect(ids).not.toContain("trenchpass-mcp-gateway");
    expect(ids).not.toContain("xek-verificacion-componible");
    expect(ids).not.toContain("editorial-calendar");
  });

  it("ordena por fecha descendente", async () => {
    const posts = await getPosts();
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1]!.date >= posts[i]!.date).toBe(true);
    }
  });

  it("getPost devuelve el post o undefined si es borrador", async () => {
    const published = await getPost("cuanto-cuesta-web-medida-2026");
    expect(published?.title).toContain("Cuánto cuesta");
    const draft = await getPost("devin-desktop-mcp-inconsistencias");
    expect(draft).toBeUndefined();
    const missing = await getPost("no-existe");
    expect(missing).toBeUndefined();
  });

  it("expone body MDX sin el frontmatter", async () => {
    const post = await getPost("cuanto-cuesta-web-medida-2026");
    expect(post?.body).toBeTruthy();
    expect(post?.body.startsWith("---")).toBe(false);
  });
});
