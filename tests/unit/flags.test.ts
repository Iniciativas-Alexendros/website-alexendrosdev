import { describe, it, expect } from "vitest";
import { isComingSoon } from "@/lib/flags";

describe("isComingSoon", () => {
  it("se activa por defecto en producción", () => {
    expect(isComingSoon({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("queda inactivo por defecto en preview y desarrollo", () => {
    expect(isComingSoon({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isComingSoon({})).toBe(false);
  });

  it("el override explícito COMING_SOON tiene prioridad", () => {
    expect(isComingSoon({ COMING_SOON: "1", VERCEL_ENV: "preview" })).toBe(true);
    expect(isComingSoon({ COMING_SOON: "0", VERCEL_ENV: "production" })).toBe(false);
  });
});
