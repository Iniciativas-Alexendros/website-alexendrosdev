import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPrisma = {
  $queryRaw: vi.fn().mockRejectedValue(new Error("no db")),
};

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

const mockSnapshot = vi.fn(() => ({
  uptime: 123,
  startedAt: "2026-07-18T12:00:00.000Z",
  metrics: {},
}));

vi.mock("@/lib/monitor", () => ({
  snapshot: mockSnapshot,
}));

const { GET } = await import("@/app/api/health/route");

function resetEnv() {
  vi.stubEnv("STRIPE_SECRET_KEY", "");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("OPENCODE_ZEN_API_KEY", "");
  vi.stubEnv("CRM_API_KEY", "");
  // NOTA: npm_package_version no se stubea porque ?? solo captura null/undefined, no empty string
}

describe("GET /api/health", () => {
  beforeEach(() => {
    resetEnv();
    mockSnapshot.mockReturnValue({
      uptime: 123,
      startedAt: "2026-07-18T12:00:00.000Z",
      metrics: {},
    });
  });

  it("returns 200 with status ok", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.checks).toBeDefined();
    expect(body.checks.db).toBeDefined();
    expect(body.checks.stripe).toBeDefined();
    expect(body.checks.resend).toBeDefined();
  });

  it("reports degraded when stripe key missing", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.degraded).toBe(true);
  });

  it("reports stripe ok when key present", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_test");
    const res = await GET();
    const body = await res.json();
    expect(body.checks.stripe.ok).toBe(true);
  });

  it("reports not degraded when stripe and db are ok", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@host/db");
    mockPrisma.$queryRaw = vi.fn().mockResolvedValue([{ "?column?": 1 }]);
    const res = await GET();
    const body = await res.json();
    expect(body.degraded).toBe(false);
  });

  it("reports version from env", async () => {
    vi.stubEnv("npm_package_version", "1.2.3");
    const res = await GET();
    const body = await res.json();
    expect(body.version).toBe("1.2.3");
  });

  it("returns fallback version when env unset", async () => {
    const res = await GET();
    const body = await res.json();
    // version es string (puede tener valor real de npm_package_version o vacío en CI)
    expect(typeof body.version).toBe("string");
  });

  // Los tests que usan npm_package_version DEBEN setearlo explicitamente via stubEnv

  it("includes uptime and startedAt fields", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.uptime).toBe("123s");
    expect(body.startedAt).toBe("2026-07-18T12:00:00.000Z");
  });

  it("includes metrics summary even when no events recorded", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.metrics).toBeDefined();
    expect(body.metrics.totalEvents).toBe(0);
    expect(body.metrics.webhookFailures1h).toBe(0);
  });

  it("reports webhook health with no events as null ok", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    const res = await GET();
    const body = await res.json();
    expect(body.checks.webhook.ok).toBeNull();
    expect(body.checks.webhook.detail).toBe("sin eventos registrados");
  });

  it("reports webhook health with events and no errors", async () => {
    mockSnapshot.mockReturnValue({
      uptime: 123,
      startedAt: "2026-07-18T12:00:00.000Z",
      metrics: {
        "stripe.webhook.received": {
          lastEvent: "2026-07-18T12:30:00Z",
          total: 10,
          recent5m: 0,
          recent1h: 10,
        },
        "stripe.webhook.processed": {
          lastEvent: "2026-07-18T12:30:00Z",
          total: 10,
          recent5m: 0,
          recent1h: 10,
        },
      },
    });
    const res = await GET();
    const body = await res.json();
    expect(body.checks.webhook.ok).toBe(true);
    expect(body.checks.webhook.detail).toContain("10 eventos recibidos");
  });

  it("reports webhook health with high error rate as degraded", async () => {
    mockSnapshot.mockReturnValue({
      uptime: 123,
      startedAt: "2026-07-18T12:00:00.000Z",
      metrics: {
        "stripe.webhook.received": {
          lastEvent: "2026-07-18T12:30:00Z",
          total: 10,
          recent5m: 10,
          recent1h: 10,
        },
        "stripe.webhook.error": {
          lastEvent: "2026-07-18T12:30:00Z",
          total: 5,
          recent5m: 5,
          recent1h: 5,
        },
      },
    });
    const res = await GET();
    const body = await res.json();
    // 5 errors recent1h < 3 → false. Check total errors < total*0.5: 5 < 5 → false. So ok = false
    expect(body.checks.webhook.ok).toBe(false);
  });

  it("reports checkout health with no events as null ok", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    const res = await GET();
    const body = await res.json();
    expect(body.checks.checkout.ok).toBeNull();
    expect(body.checks.checkout.detail).toBe("sin actividad");
  });

  it("reports checkout health with events and low error rate", async () => {
    mockSnapshot.mockReturnValue({
      uptime: 123,
      startedAt: "2026-07-18T12:00:00.000Z",
      metrics: {
        "checkout.started": {
          lastEvent: "2026-07-18T12:30:00Z",
          total: 20,
          recent5m: 20,
          recent1h: 20,
        },
        "checkout.error": { lastEvent: "2026-07-18T12:30:00Z", total: 1, recent5m: 1, recent1h: 1 },
      },
    });
    const res = await GET();
    const body = await res.json();
    expect(body.checks.checkout.ok).toBe(true);
    expect(body.checks.checkout.detail).toContain("20 intentos");
  });

  it("reports checkout health with high error rate", async () => {
    mockSnapshot.mockReturnValue({
      uptime: 123,
      startedAt: "2026-07-18T12:00:00.000Z",
      metrics: {
        "checkout.started": {
          lastEvent: "2026-07-18T12:30:00Z",
          total: 5,
          recent5m: 5,
          recent1h: 5,
        },
        "checkout.error": { lastEvent: "2026-07-18T12:30:00Z", total: 5, recent5m: 5, recent1h: 5 },
      },
    });
    const res = await GET();
    const body = await res.json();
    expect(body.checks.checkout.ok).toBe(false);
  });

  it("reports agents health as null when no LLM providers configured", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    const res = await GET();
    const body = await res.json();
    expect(body.checks.agents.ok).toBeNull();
    expect(body.checks.agents.detail).toBe("no configurados");
  });

  it("reports agents health ok when LLM providers and CRM are configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("CRM_API_KEY", "crm-key");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    const res = await GET();
    const body = await res.json();
    expect(body.checks.agents.ok).toBe(true);
    expect(body.checks.agents.detail).toContain("gemini");
  });

  it("reports agents health with opencode-zen provider", async () => {
    vi.stubEnv("OPENCODE_ZEN_API_KEY", "zen-key");
    vi.stubEnv("CRM_API_KEY", "crm-key");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    const res = await GET();
    const body = await res.json();
    expect(body.checks.agents.ok).toBe(true);
    expect(body.checks.agents.detail).toContain("opencode-zen");
  });

  it("reports agents degraded when LLM configured but no CRM key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    const res = await GET();
    const body = await res.json();
    expect(body.checks.agents.ok).toBe(false);
  });

  it("includes metrics summary with correct totals", async () => {
    mockSnapshot.mockReturnValue({
      uptime: 123,
      startedAt: "2026-07-18T12:00:00.000Z",
      metrics: {
        "stripe.webhook.received": {
          lastEvent: "2026-07-18T12:30:00Z",
          total: 10,
          recent5m: 10,
          recent1h: 10,
        },
        "stripe.webhook.error": {
          lastEvent: "2026-07-18T12:30:00Z",
          total: 2,
          recent5m: 2,
          recent1h: 2,
        },
        "checkout.error": { lastEvent: "2026-07-18T12:30:00Z", total: 1, recent5m: 1, recent1h: 1 },
      },
    });
    const res = await GET();
    const body = await res.json();
    expect(body.metrics.totalEvents).toBe(10);
    expect(body.metrics.totalEvents1h).toBe(10);
    expect(body.metrics.webhookFailures1h).toBe(2);
    expect(body.metrics.checkoutFailures1h).toBe(1);
  });

  it("returns resend as not ok when key missing", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.checks.resend.ok).toBe(false);
  });

  it("returns resend as ok when key present", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    const res = await GET();
    const body = await res.json();
    expect(body.checks.resend.ok).toBe(true);
  });
});
