import { describe, expect, it } from "vitest";
import {
  CATALOG,
  getCatalogItem,
  getCatalogItemsByType,
  getCatalogItemsByCategory,
  getCatalogPriceId,
} from "@/lib/content/catalog";
import { PURCHASABLES, getPurchasable } from "@/lib/content/checkout";
import { TIERS } from "@/lib/content/services";

/** Formato esperado de un `price_*` de Stripe: `price_` + alfanumérico ≥ 14 chars. */
const STRIPE_PRICE_RE = /^price_[A-Za-z0-9]{10,}$/;

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

  // F17.5b: integridad de los `stripePriceIds` por modo.
  describe("stripePriceIds (F17.5b)", () => {
    it("todo item activo tiene al menos un stripePriceId (test o live)", () => {
      for (const item of CATALOG) {
        if (!item.active) continue;
        const ids = item.stripePriceIds ?? {};
        expect(ids.test ?? ids.live, `${item.id} no tiene ningún stripePriceId`).toBeTruthy();
      }
    });

    it("todo item activo y comprable (PURCHASABLES) tiene AMBOS IDs (test y live)", () => {
      for (const p of PURCHASABLES) {
        const item = getCatalogItem(p.id);
        expect(item, `${p.id} no está en CATALOG`).toBeTruthy();
        expect(item!.stripePriceIds?.test, `${p.id} falta stripePriceIds.test`).toMatch(
          STRIPE_PRICE_RE,
        );
        expect(item!.stripePriceIds?.live, `${p.id} falta stripePriceIds.live`).toMatch(
          STRIPE_PRICE_RE,
        );
      }
    });

    it("todos los IDs siguen el formato `price_...` de Stripe", () => {
      for (const item of CATALOG) {
        const ids = item.stripePriceIds;
        if (!ids) continue;
        if (ids.test) expect(ids.test, `${item.id}.test`).toMatch(STRIPE_PRICE_RE);
        if (ids.live) expect(ids.live, `${item.id}.live`).toMatch(STRIPE_PRICE_RE);
      }
    });

    it("los IDs de test y live son distintos para el mismo item", () => {
      for (const item of CATALOG) {
        const ids = item.stripePriceIds;
        if (ids?.test && ids?.live) {
          expect(ids.test, `${item.id}: test y live son iguales (${ids.test})`).not.toBe(ids.live);
        }
      }
    });

    it("ningún ID de test se reusa como ID de live en otro item", () => {
      const testIds = new Set<string>();
      const liveIds = new Map<string, string>();
      for (const item of CATALOG) {
        const ids = item.stripePriceIds;
        if (ids?.test) testIds.add(ids.test);
        if (ids?.live) liveIds.set(ids.live, item.id);
      }
      for (const tid of testIds) {
        expect(
          liveIds.get(tid),
          `ID ${tid} aparece como test y como live de ${liveIds.get(tid)}`,
        ).toBeUndefined();
      }
    });

    it("getCatalogPriceId devuelve el ID del modo solicitado", () => {
      const item = getCatalogItem("sesion-consultoria")!;
      expect(getCatalogPriceId(item, "test")).toBe("price_1TrTacK8xOmiNNUKNemQs0G6");
      expect(getCatalogPriceId(item, "live")).toMatch(STRIPE_PRICE_RE);
      expect(getCatalogPriceId(item, "test")).not.toBe(getCatalogPriceId(item, "live"));
    });

    it("getCatalogPriceId devuelve null si falta el ID del modo", () => {
      const item = CATALOG[0]!;
      const sinIds = { ...item, stripePriceIds: undefined };
      expect(getCatalogPriceId(sinIds, "test")).toBeNull();
      expect(getCatalogPriceId(sinIds, "live")).toBeNull();
      const soloTest = { ...item, stripePriceIds: { test: "price_test_abc" } };
      expect(getCatalogPriceId(soloTest, "test")).toBe("price_test_abc");
      expect(getCatalogPriceId(soloTest, "live")).toBeNull();
    });
  });
});
