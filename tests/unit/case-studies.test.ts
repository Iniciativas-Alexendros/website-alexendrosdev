import { describe, expect, it } from "vitest";
import { getCaseStudy } from "@/lib/content/case-studies";
import { getProject } from "@/lib/content/projects";
import { proyectoSinRepo } from "../fixtures/content";

describe("getCaseStudy", () => {
  it("devuelve el estudio curado de nasve (reframe demo / plantilla)", () => {
    const cs = getCaseStudy(getProject("nasve")!);
    // El estudio se reformuló como proyecto propio (demo / plantilla),
    // sin enmarcarlo como un cliente "Nasve" en producción.
    expect(cs.client).toContain("demo / plantilla");
    expect(cs.summary).toContain("Demo / plantilla");
    expect(cs.sections.length).toBeGreaterThanOrEqual(3);
    expect(cs.sections.map((s) => s.id)).toContain("contexto");
  });

  it("el estudio de trenchpass incluye un bloque de código", () => {
    const cs = getCaseStudy(getProject("trenchpass")!);
    const hasCode = cs.sections.some((s) => s.blocks.some((b) => b.type === "code"));
    expect(hasCode).toBe(true);
  });

  it("genera una plantilla genérica para un proyecto sin estudio curado", () => {
    const cs = getCaseStudy(proyectoSinRepo);
    expect(cs.summary).toBe(proyectoSinRepo.desc);
    expect(cs.client).toContain("open source");
    expect(cs.sections.map((s) => s.id)).toEqual(["contexto", "resultado"]);
  });
});
