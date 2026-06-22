import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientIp, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite hasta el límite y bloquea la siguiente solicitud", () => {
    const key = "rl:limite";
    for (let i = 0; i < 5; i++) expect(rateLimit(key, 5, 60_000)).toBe(true);
    expect(rateLimit(key, 5, 60_000)).toBe(false);
  });

  it("reabre la ventana cuando expira windowMs", () => {
    const key = "rl:ventana";
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    expect(rateLimit(key, 5, 60_000)).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(rateLimit(key, 5, 60_000)).toBe(true);
  });

  it("cuenta cada clave de forma independiente", () => {
    expect(rateLimit("rl:a", 1, 60_000)).toBe(true);
    expect(rateLimit("rl:a", 1, 60_000)).toBe(false);
    expect(rateLimit("rl:b", 1, 60_000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefiere x-real-ip (lo fija el proxy, no el cliente)", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.7",
      "x-forwarded-for": "1.2.3.4, 198.51.100.7",
    });
    expect(clientIp(headers)).toBe("198.51.100.7");
  });

  it("toma la ÚLTIMA IP de x-forwarded-for (la añade el proxy de confianza, no spoofeable)", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" });
    expect(clientIp(headers)).toBe("70.41.3.18");
  });

  it("no se deja spoofear por un x-forwarded-for inventado por el cliente", () => {
    // El atacante mete una IP falsa al principio; el proxy añade la real al final.
    const headers = new Headers({ "x-forwarded-for": "9.9.9.9, 203.0.113.5" });
    expect(clientIp(headers)).toBe("203.0.113.5");
  });

  it("cae a 'anon' sin cabeceras de proxy", () => {
    expect(clientIp(new Headers())).toBe("anon");
  });
});
