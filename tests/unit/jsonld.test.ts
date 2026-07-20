import { describe, expect, it } from "vitest";
import {
  makeBreadcrumbJsonLd,
  makeCreativeWorkJsonLd,
  makePersonJsonLd,
  makeProfessionalServiceJsonLd,
  makeWebSiteJsonLd,
} from "@/lib/seo/jsonld";
import { proyectoConRepo, proyectoSinRepo } from "../fixtures/content";

// schema-dts tipa cada propiedad como unión muy amplia; para las aserciones
// accedemos al objeto plano resultante como Record.
const plain = (x: object) => x as unknown as Record<string, unknown>;

describe("generadores JSON-LD", () => {
  it("WebSite declara contexto, tipo y URL del sitio", () => {
    const j = plain(makeWebSiteJsonLd());
    expect(j["@context"]).toBe("https://schema.org");
    expect(j["@type"]).toBe("WebSite");
    expect(String(j.url)).toMatch(/alexendros\.dev/);
  });

  it("Person enlaza redes en sameAs", () => {
    const j = plain(makePersonJsonLd());
    expect(j["@type"]).toBe("Person");
    expect(Array.isArray(j.sameAs)).toBe(true);
  });

  it("ProfessionalService es del tipo correcto", () => {
    const j = plain(makeProfessionalServiceJsonLd());
    expect(j["@type"]).toBe("ProfessionalService");
    expect(String(j.url)).toContain("/servicios");
  });

  it("SoftwareApplication añade codeRepository y usa liveUrl cuando existen", () => {
    const j = plain(makeCreativeWorkJsonLd(proyectoConRepo));
    expect(j.codeRepository).toBe(proyectoConRepo.repoUrl);
    expect(j.url).toBe(proyectoConRepo.liveUrl);
  });

  it("SoftwareApplication cae a la URL canónica sin repo ni liveUrl", () => {
    const j = plain(makeCreativeWorkJsonLd(proyectoSinRepo));
    expect(j.codeRepository).toBeUndefined();
    expect(String(j.url)).toContain(`/proyectos/${proyectoSinRepo.id}`);
  });

  it("BreadcrumbList numera las posiciones desde 1", () => {
    const j = plain(
      makeBreadcrumbJsonLd([
        { name: "Inicio", url: "https://alexendros.dev/" },
        { name: "Proyectos", url: "https://alexendros.dev/proyectos" },
      ]),
    );
    const items = j.itemListElement as Array<{ position: number; name: string }>;
    expect(items).toHaveLength(2);
    expect(items[0]!.position).toBe(1);
    expect(items[1]!.position).toBe(2);
  });
});
