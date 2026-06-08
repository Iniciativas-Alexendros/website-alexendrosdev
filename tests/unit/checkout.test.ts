import { describe, expect, it } from "vitest";
import { PURCHASABLES, getPurchasable, formatPrice } from "@/lib/content/checkout";

describe("catálogo de items comprables", () => {
  it("tiene ids únicos", () => {
    const ids = PURCHASABLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos los importes son enteros positivos (céntimos)", () => {
    for (const p of PURCHASABLES) {
      expect(Number.isInteger(p.amount)).toBe(true);
      expect(p.amount).toBeGreaterThan(0);
    }
  });

  it("resuelve por id y devuelve null para ids desconocidos", () => {
    expect(getPurchasable("auditoria-seguridad")?.name).toBe("Auditoría de seguridad");
    expect(getPurchasable("no-existe")).toBeNull();
  });
});

describe("formatPrice", () => {
  // Robusto ante la variante de ICU (el separador de millares depende de los
  // datos de locale disponibles): se comparan solo los dígitos y el símbolo.
  it("formatea céntimos como euros sin decimales", () => {
    const a = formatPrice(150_000);
    expect(a.replace(/\D/g, "")).toBe("1500");
    expect(a).toContain("€");
    expect(formatPrice(18_000).replace(/\D/g, "")).toBe("180");
  });
});
