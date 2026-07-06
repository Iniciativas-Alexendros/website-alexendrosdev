import { describe, expect, it } from "vitest";
import {
  CATALOG,
  getCatalogItem,
  getCatalogItemsByType,
  getCatalogItemsByCategory,
} from "@/lib/content/catalog";
import { PURCHASABLES, getPurchasable } from "@/lib/content/checkout";
import { TIERS } from "@/lib/content/services";

describe("catálogo unificado (F11)", () => {
  it("CATALOG contiene items one_time y recurring", () => {
    const oneTime = CATALOG.filter((i) => i.type === "one_time");
    const recurring = CATALOG.filter((i) => i.type === "recurring");
    expect(oneTime.length).toBeGreaterThanOrEqual(6);
    expect(recurring.length).toBe(3);
  });

  it("items recurring tienen interval definido", () => {
    const recurring = CATALOG.filter((i) => i.type === "recurring");
    for (const item of recurring) {
      expect(item.interval).toBeDefined();
      expect(["month", "year"]).toContain(item.interval);
    }
  });

  it("getCatalogItem resuelve por id y devuelve null para inexistentes", () => {
    expect(getCatalogItem("sesion-consultoria")?.amount).toBe(6_000);
    expect(getCatalogItem("no-existe")).toBeNull();
  });

  it("getCatalogItemsByType filtra correctamente", () => {
    expect(getCatalogItemsByType("recurring").length).toBe(3);
    expect(getCatalogItemsByType("one_time").length).toBeGreaterThanOrEqual(6);
  });

  it("getCatalogItemsByCategory filtra correctamente", () => {
    expect(getCatalogItemsByCategory("addon").length).toBeGreaterThanOrEqual(2);
    expect(getCatalogItemsByCategory("retainer").length).toBe(3);
    expect(getCatalogItemsByCategory("consultoria").length).toBeGreaterThanOrEqual(1);
  });

  it("CATALOG no tiene precios negativos ni cero", () => {
    for (const item of CATALOG) {
      expect(item.amount).toBeGreaterThan(0);
    }
  });

  it("CATALOG no tiene ids duplicados", () => {
    const ids = CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("PURCHASABLES legacy = addon + consultoria (compatibilidad hacia atrás)", () => {
    expect(PURCHASABLES.length).toBe(3);
    const ids = PURCHASABLES.map((p) => p.id);
    expect(ids).toContain("puesta-a-punto-web");
    expect(ids).toContain("sesion-consultoria");
    expect(ids).toContain("revision-seguridad");
  });

  it("TIERS.retainer tiene 3 tiers derivados del catálogo", () => {
    expect(TIERS.retainer.length).toBe(3);
  });

  it("getPurchasable (legacy) sigue funcionando", () => {
    expect(getPurchasable("sesion-consultoria")?.amount).toBe(6_000);
    expect(getPurchasable("no-existe")).toBeNull();
  });
});
