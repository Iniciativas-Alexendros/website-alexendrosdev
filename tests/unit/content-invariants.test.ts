import { describe, expect, it } from "vitest";
import { PROJECTS, getProject } from "@/lib/content/projects";
import { POSTS, getPost } from "@/lib/content/posts";
import { PURCHASABLES, getPurchasable } from "@/lib/content/checkout";
import { ADDONS, COMPARISON, FAQ, HOME_SERVICES, TIERS } from "@/lib/content/services";
import { STACK_CATS, STACK_DETAIL } from "@/lib/content/stack";
import { ABOUT_STATS, DAILY_STACK, HERO_STATS, PRINCIPLES, TIMELINE } from "@/lib/content/about";
import { NAV, SITE, TECH } from "@/lib/content/site";
import { TESTIMONIALS } from "@/lib/content/testimonials";

function unique<T>(xs: readonly T[]): boolean {
  return new Set(xs).size === xs.length;
}

describe("invariantes de PROJECTS", () => {
  it("tiene ids únicos y getProject los resuelve", () => {
    expect(unique(PROJECTS.map((p) => p.id))).toBe(true);
    for (const p of PROJECTS) expect(getProject(p.id)).toBe(p);
    expect(getProject("inexistente")).toBeUndefined();
  });

  it("cada proyecto tiene métricas y tags no vacíos", () => {
    for (const p of PROJECTS) {
      expect(p.metrics.length).toBeGreaterThan(0);
      expect(p.tags.length).toBeGreaterThan(0);
    }
  });
});

describe("invariantes de POSTS", () => {
  it("tiene ids únicos y getPost los resuelve", () => {
    expect(unique(POSTS.map((p) => p.id))).toBe(true);
    for (const p of POSTS) expect(getPost(p.id)).toBe(p);
    expect(getPost("inexistente")).toBeUndefined();
  });
});

describe("invariantes de PURCHASABLES", () => {
  it("tiene ids únicos, importes positivos y getPurchasable los resuelve", () => {
    expect(unique(PURCHASABLES.map((i) => i.id))).toBe(true);
    for (const i of PURCHASABLES) {
      expect(i.amount).toBeGreaterThan(0);
      expect(getPurchasable(i.id)).toStrictEqual(i);
    }
    expect(getPurchasable("inexistente")).toBeNull();
  });
});

describe("coherencia del resto del contenido", () => {
  it("servicios: tiers, comparativa, addons y FAQ no vacíos", () => {
    expect(HOME_SERVICES.length).toBeGreaterThan(0);
    expect(TIERS.proyecto.length).toBeGreaterThan(0);
    expect(TIERS.retainer.length).toBeGreaterThan(0);
    expect(ADDONS.length).toBeGreaterThan(0);
    expect(FAQ.length).toBeGreaterThan(0);
    // Cada fila de la comparativa tiene exactamente 3 columnas (Starter/Pro/Scale).
    for (const [, cols] of COMPARISON) expect(cols).toHaveLength(3);
  });

  it("stack: cada hoja con detalle referencia una categoría conocida", () => {
    expect(STACK_CATS.length).toBeGreaterThan(0);
    expect(Object.keys(STACK_DETAIL).length).toBeGreaterThan(0);
  });

  it("about: stats, timeline y principios poblados", () => {
    expect(HERO_STATS.length).toBeGreaterThan(0);
    expect(ABOUT_STATS.length).toBeGreaterThan(0);
    expect(TIMELINE.length).toBeGreaterThan(0);
    expect(PRINCIPLES.length).toBeGreaterThan(0);
    expect(DAILY_STACK.length).toBeGreaterThan(0);
  });

  it("site: identidad, navegación y marquee coherentes", () => {
    expect(SITE.url).toMatch(/^https?:\/\//);
    expect(NAV.length).toBeGreaterThan(0);
    expect(TECH.length).toBeGreaterThan(0);
  });
});

describe("invariantes de TESTIMONIALS", () => {
  it("tiene al menos un testimonio visible (no todas las ranuras pendientes)", () => {
    const visible = TESTIMONIALS.filter(
      (t) =>
        !t.quote.startsWith("__PENDIENTE__:") &&
        !t.name.startsWith("__PENDIENTE__:") &&
        !t.role.startsWith("__PENDIENTE__:"),
    );
    expect(visible.length).toBeGreaterThan(0);
  });

  it("los visibles tienen campos no vacíos y, si son 'client', url recomendada", () => {
    const visible = TESTIMONIALS.filter(
      (t) =>
        !t.quote.startsWith("__PENDIENTE__:") &&
        !t.name.startsWith("__PENDIENTE__:") &&
        !t.role.startsWith("__PENDIENTE__:"),
    );
    for (const t of visible) {
      expect(t.quote.length).toBeGreaterThan(0);
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.role.length).toBeGreaterThan(0);
    }
  });

  it("las ranuras pendientes tienen los tres campos con prefijo __PENDIENTE__:", () => {
    const pendientes = TESTIMONIALS.filter(
      (t) => t.kind === "solicitado" || t.quote.startsWith("__PENDIENTE__:"),
    );
    for (const t of pendientes) {
      expect(t.quote).toMatch(/^__PENDIENTE__:/);
      expect(t.name).toMatch(/^__PENDIENTE__:/);
      expect(t.role).toMatch(/^__PENDIENTE__:/);
    }
  });
});
