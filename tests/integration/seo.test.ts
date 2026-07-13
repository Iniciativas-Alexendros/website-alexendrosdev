import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { GET as feedGET } from "@/app/feed.xml/route";

describe("SEO — superficie de indexación", () => {
  it("sitemap incluye rutas estáticas, proyectos y posts del blog", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://alexendros.dev");
    expect(urls).toContain("https://alexendros.dev/servicios");
    expect(urls).toContain("https://alexendros.dev/proyectos/alexendros-me");
    // Posts publicados aparecen; borradores no.
    expect(urls).toContain("https://alexendros.dev/blog/cuanto-cuesta-web-medida-2026");
    expect(urls.some((u) => u.includes("/blog/devin-desktop-mcp-inconsistencias"))).toBe(false);
  });

  it("feed.xml emite RSS válido con los posts publicados", async () => {
    const res = await feedGET();
    expect(res.headers.get("Content-Type")).toContain("application/rss+xml");
    const xml = await res.text();
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<title>Alejandro Domingo Agustí</title>");
    expect(xml).toContain("/blog/cuanto-cuesta-web-medida-2026");
    // El borrador no debe aparecer en el feed.
    expect(xml).not.toContain("devin-desktop-mcp-inconsistencias");
  });
});
