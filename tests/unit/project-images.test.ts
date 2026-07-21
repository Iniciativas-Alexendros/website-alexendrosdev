import { describe, expect, it } from "vitest";
import { getProjectImageOrGradient, getSectionGradient } from "@/lib/project-images";

const REAL_PROJECT_IDS = [
  "alexendros-me",
  "nasve",
  "pipeline-crm",
  "stripe-catalog",
  "mcp-toolkit",
];

describe("getProjectImageOrGradient", () => {
  it.each(REAL_PROJECT_IDS)("devuelve type image con path real para %s", (id) => {
    const result = getProjectImageOrGradient(id);
    expect(result.type).toBe("image");
    if (result.type === "image") {
      expect(result.src).toBe(`/images/projects/${id}/hero.webp`);
      expect(result.src).toMatch(/^\/images\/projects\//);
    }
  });

  it("devuelve fallback genérico para proyecto inexistente", () => {
    const result = getProjectImageOrGradient("proyecto-que-no-existe");
    expect(result.type).toBe("gradient");
    if (result.type === "gradient") {
      expect(result.style).toContain("oklch");
      expect(result.style).toContain("--bg-sunken");
      expect(result.style).toContain("--bg-elevated");
    }
  });

  it("devuelve fallback genérico para string vacío", () => {
    const result = getProjectImageOrGradient("");
    expect(result.type).toBe("gradient");
    if (result.type === "gradient") {
      expect(result.style).toContain("--bg-sunken");
    }
  });

  it("todas las imágenes reales devuelven path absoluto empezando con /", () => {
    for (const id of REAL_PROJECT_IDS) {
      const result = getProjectImageOrGradient(id);
      expect(result.type).toBe("image");
      if (result.type === "image") {
        expect(result.src).toMatch(/^\//);
        expect(result.src).toMatch(/\.(png|webp|jpg|jpeg|avif)$/);
      }
    }
  });

  it("ningún proyecto conocido usa gradiente", () => {
    for (const id of REAL_PROJECT_IDS) {
      expect(getProjectImageOrGradient(id).type).toBe("image");
    }
  });
});

describe("getSectionGradient", () => {
  it("devuelve gradiente azul intenso para contexto", () => {
    const gradient = getSectionGradient("contexto");
    expect(gradient).toContain("oklch");
    expect(gradient).toContain("--primary-300");
    expect(gradient).toContain("--primary-600");
  });

  it("devuelve gradiente verde-teal para solucion", () => {
    const gradient = getSectionGradient("solucion");
    expect(gradient).toContain("oklch");
    expect(gradient).toContain("--success");
    expect(gradient).toContain("--primary-400");
  });

  it("devuelve gradiente ambar para resultado", () => {
    const gradient = getSectionGradient("resultado");
    expect(gradient).toContain("oklch");
    expect(gradient).toContain("--primary-400");
    expect(gradient).toContain("--warning");
  });

  it("devuelve fallback primario para sección desconocida", () => {
    const gradient = getSectionGradient("tecnologia");
    expect(gradient).toContain("oklch");
    expect(gradient).toContain("--primary-200");
    expect(gradient).toContain("--primary-500");
  });

  it("devuelve fallback para string vacío", () => {
    const gradient = getSectionGradient("");
    expect(gradient).toContain("oklch");
    expect(gradient).toContain("linear-gradient");
  });

  it("cada sección conocida produce un gradiente distinto", () => {
    const gradients = ["contexto", "solucion", "resultado"].map(getSectionGradient);
    expect(new Set(gradients).size).toBe(3);
  });

  it("todos los gradientes de sección son linear-gradient con oklch", () => {
    for (const id of ["contexto", "solucion", "resultado", "tecnologia", ""]) {
      const gradient = getSectionGradient(id);
      expect(gradient).toMatch(/^linear-gradient\(/);
      expect(gradient).toContain("oklch(");
    }
  });
});
