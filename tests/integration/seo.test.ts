import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

describe("SEO — superficie de indexación", () => {
  it("sitemap incluye rutas estáticas y proyectos", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://alexendros.dev");
    expect(urls).toContain("https://alexendros.dev/servicios");
    expect(urls).toContain("https://alexendros.dev/proyectos/alexendros-me");
    expect(urls).toContain("https://alexendros.dev/legal/privacidad");
  });
});
