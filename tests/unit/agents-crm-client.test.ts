import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const fetchMock = vi.fn();
  return {
    state: {
      crmKey: "" as string,
    },
    fetchMock,
  };
});

vi.mock("@/lib/agents/config", () => ({
  agentsConfig: {},
}));

vi.stubGlobal("fetch", mocks.fetchMock);

// Forzar CRM_API_KEY via env en cada test
const originalEnv = process.env.CRM_API_KEY;

beforeEach(() => {
  mocks.fetchMock.mockReset();
  mocks.state.crmKey = "";
  process.env.CRM_API_KEY = originalEnv;
});

describe("crm-client: disponibilidad", () => {
  it("T5.13: isAvailable=false cuando CRM_API_KEY no está configurada", async () => {
    process.env.CRM_API_KEY = "";
    const { crmClient } = await import("@/lib/agents/crm-client");
    expect(crmClient.isAvailable()).toBe(false);
  });

  it("T5.14: isAvailable=true cuando CRM_API_KEY está configurada", async () => {
    process.env.CRM_API_KEY = "test-key";
    const { crmClient } = await import("@/lib/agents/crm-client");
    expect(crmClient.isAvailable()).toBe(true);
  });
});

describe("crm-client: crmRequest", () => {
  it("T5.15: envía header X-API-Key con la clave configurada", async () => {
    process.env.CRM_API_KEY = "test-key";
    mocks.fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "deal-1" }), { status: 200 }),
    );
    const { crmClient } = await import("@/lib/agents/crm-client");
    const result = await crmClient.getDeal("deal-1", "http://api.test");
    expect(result?.id).toBe("deal-1");
    expect(mocks.fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/crm/deals/deal-1",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-API-Key": "test-key",
        }) as Record<string, string>,
      }),
    );
  });

  it("T5.16: devuelve null en HTTP 4xx/5xx sin lanzar", async () => {
    process.env.CRM_API_KEY = "test-key";
    mocks.fetchMock.mockResolvedValueOnce(new Response("not found", { status: 404 }));
    const { crmClient } = await import("@/lib/agents/crm-client");
    const result = await crmClient.getDeal("missing", "http://api.test");
    expect(result).toBeNull();
  });

  it("T5.17: devuelve null en error de red (fetch rejects)", async () => {
    process.env.CRM_API_KEY = "test-key";
    mocks.fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const { crmClient } = await import("@/lib/agents/crm-client");
    const result = await crmClient.getDeal("deal-1", "http://api.test");
    expect(result).toBeNull();
  });

  it("T5.18: timeoutMs corta la request y devuelve null", async () => {
    process.env.CRM_API_KEY = "test-key";
    // fetch que nunca resuelve — abortamos a los 50ms
    mocks.fetchMock.mockImplementationOnce(
      (_url: string, opts: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          opts.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const { crmRequest } = await import("@/lib/agents/crm-client");
    const start = Date.now();
    const result = await crmRequest("/api/crm/deals/deal-1", {
      timeoutMs: 50,
      baseUrl: "http://api.test",
    });
    const elapsed = Date.now() - start;
    expect(result).toBeNull();
    expect(elapsed).toBeLessThan(500);
  }, 3000);

  it("T5.19: POST con body serializa a JSON y envía Content-Type", async () => {
    process.env.CRM_API_KEY = "test-key";
    mocks.fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "task-1" }), { status: 200 }),
    );
    const { crmClient } = await import("@/lib/agents/crm-client");
    await crmClient.createTask(
      { title: "Tarea de prueba", priority: "HIGH", dealId: "deal-1" },
      "http://api.test",
    );
    const call = mocks.fetchMock.mock.calls[0]!;
    expect(call[0]).toBe("http://api.test/api/crm/tasks");
    const opts = call[1] as {
      method: string;
      body: string;
      headers: Record<string, string>;
    };
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual({
      title: "Tarea de prueba",
      priority: "HIGH",
      dealId: "deal-1",
    });
  });
});

// ─── Seguridad: integridad de capas — crmReader no expone métodos write ──────

describe("crmReader: sin métodos write en runtime", () => {
  const WRITE_METHODS = ["createTask", "createActivity", "updateDealStage"];
  const READ_METHODS = ["isAvailable", "getDeal", "listDeals", "getContact", "listInvoicesForDeal"];

  it("S7: no expone ningún método write (createTask, createActivity, updateDealStage)", async () => {
    const { crmReader } = await import("@/lib/agents/crm-reader");
    const keys = Object.keys(crmReader).sort();

    // Verificar que ningún nombre de write method está presente
    for (const writeMethod of WRITE_METHODS) {
      expect(keys).not.toContain(writeMethod);
    }
  });

  it("S8: solo expone métodos de lectura + isAvailable", async () => {
    const { crmReader } = await import("@/lib/agents/crm-reader");
    const keys = Object.keys(crmReader).sort();

    expect(keys).toEqual([...READ_METHODS].sort());
  });

  it("S9: cada propiedad expuesta es una función (no null/undefined)", async () => {
    const { crmReader } = await import("@/lib/agents/crm-reader");
    const keys = Object.keys(crmReader);

    for (const key of keys) {
      const value = (crmReader as Record<string, unknown>)[key];
      expect(typeof value).toBe("function");
    }
  });

  it("S10: la importación directa de crmClient SÍ expone write methods (verificación del test)", async () => {
    const { crmClient } = await import("@/lib/agents/crm-client");
    const keys = Object.keys(crmClient);

    for (const writeMethod of WRITE_METHODS) {
      expect(keys).toContain(writeMethod);
    }
  });
});
