import type { MetadataRoute } from "next";
import { PROJECTS, SITE } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const staticRoutes = [
    "",
    "/sobre-mi",
    "/proyectos",
    "/stack",
    "/servicios",
    "/contacto",
    "/legal/privacidad",
    "/legal/aviso-legal",
    "/legal/condiciones",
    "/legal/cookies",
  ];

  const pages: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${base}${r}`,
    changeFrequency: "monthly",
    priority: r === "" ? 1 : r.startsWith("/legal/") ? 0.3 : 0.7,
  }));

  const projects: MetadataRoute.Sitemap = PROJECTS.map((p) => ({
    url: `${base}/proyectos/${p.id}`,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...pages, ...projects];
}
