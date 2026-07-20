import { describe, expect, it } from "vitest";
import { repairActionSchema } from "@/lib/agents/schemas";
import {
  ALLOWED_REPAIR_ENDPOINTS,
  ALLOWED_ENDPOINT_PATTERNS,
  isAllowedRepairEndpoint,
  describeAllowedEndpoints,
} from "@/lib/agents/config";

// ─── ALLOWED_REPAIR_ENDPOINTS ────────────────────────────────────────────────

describe("ALLOWED_REPAIR_ENDPOINTS (fuente única de verdad)", () => {
  it("tiene exactamente 3 endpoints", () => {
    expect(ALLOWED_REPAIR_ENDPOINTS).toHaveLength(3);
  });

  it("incluye los endpoints permitidos", () => {
    expect(ALLOWED_REPAIR_ENDPOINTS).toEqual(["POST tasks", "POST activities", "PATCH deals/{id}"]);
  });
});

// ─── ALLOWED_ENDPOINT_PATTERNS ────────────────────────────────────────────────

describe("ALLOWED_ENDPOINT_PATTERNS (regex derivados)", () => {
  it("tiene exactamente 3 patrones", () => {
    expect(ALLOWED_ENDPOINT_PATTERNS).toHaveLength(3);
  });

  it("cada patrón es una instancia de RegExp", () => {
    for (const p of ALLOWED_ENDPOINT_PATTERNS) {
      expect(p).toBeInstanceOf(RegExp);
    }
  });
});

// ─── isAllowedRepairEndpoint: permitidos ──────────────────────────────────────

describe("isAllowedRepairEndpoint — endpoints permitidos", () => {
  it("POST /api/crm/tasks es permitido", () => {
    expect(isAllowedRepairEndpoint("POST /api/crm/tasks")).toBe(true);
  });

  it("POST /api/crm/activities es permitido", () => {
    expect(isAllowedRepairEndpoint("POST /api/crm/activities")).toBe(true);
  });

  it("PATCH /api/crm/deals/{id} con ID alfanumérico simple es permitido", () => {
    expect(isAllowedRepairEndpoint("PATCH /api/crm/deals/abc-123")).toBe(true);
  });

  it("PATCH /api/crm/deals/{id} con UUID es permitido", () => {
    expect(
      isAllowedRepairEndpoint("PATCH /api/crm/deals/550e8400-e29b-41d4-a716-446655440000"),
    ).toBe(true);
  });

  it("PATCH /api/crm/deals/{id} con underscore es permitido", () => {
    expect(isAllowedRepairEndpoint("PATCH /api/crm/deals/deal_XYZ_456")).toBe(true);
  });

  it("PATCH /api/crm/deals/{id} con ID corto es permitido", () => {
    expect(isAllowedRepairEndpoint("PATCH /api/crm/deals/d1")).toBe(true);
  });

  it("PATCH /api/crm/deals/{id} con ID numérico es permitido", () => {
    expect(isAllowedRepairEndpoint("PATCH /api/crm/deals/42")).toBe(true);
  });
});

// ─── isAllowedRepairEndpoint: no permitidos ───────────────────────────────────

describe("isAllowedRepairEndpoint — endpoints no permitidos", () => {
  it("DELETE no está permitido", () => {
    expect(isAllowedRepairEndpoint("DELETE /api/crm/tasks")).toBe(false);
  });

  it("GET no está permitido", () => {
    expect(isAllowedRepairEndpoint("GET /api/crm/tasks")).toBe(false);
  });

  it("POST /api/crm/contacts no está permitido", () => {
    expect(isAllowedRepairEndpoint("POST /api/crm/contacts")).toBe(false);
  });

  it("POST /api/crm/deals no está permitido (solo PATCH)", () => {
    expect(isAllowedRepairEndpoint("POST /api/crm/deals")).toBe(false);
  });

  it("PATCH /api/crm/tasks/{id} no está permitido (solo POST tasks)", () => {
    expect(isAllowedRepairEndpoint("PATCH /api/crm/tasks/123")).toBe(false);
  });

  it("PATCH /api/crm/deals/ sin ID no está permitido", () => {
    expect(isAllowedRepairEndpoint("PATCH /api/crm/deals/")).toBe(false);
  });

  it("POST /api/crm/activities/extra no está permitido (ruta extra)", () => {
    expect(isAllowedRepairEndpoint("POST /api/crm/activities/extra")).toBe(false);
  });

  it("método HTTP no estándar no está permitido", () => {
    expect(isAllowedRepairEndpoint("PUT /api/crm/tasks")).toBe(false);
  });
});

// ─── isAllowedRepairEndpoint: formato inválido ────────────────────────────────

describe("isAllowedRepairEndpoint — formato inválido", () => {
  it("cadena vacía no es permitida", () => {
    expect(isAllowedRepairEndpoint("")).toBe(false);
  });

  it("solo método sin ruta no es permitido", () => {
    expect(isAllowedRepairEndpoint("POST")).toBe(false);
  });

  it("solo ruta sin método no es permitido", () => {
    expect(isAllowedRepairEndpoint("/api/crm/tasks")).toBe(false);
  });

  it("URL sin /api/crm/ no es permitido", () => {
    expect(isAllowedRepairEndpoint("POST /api/other/tasks")).toBe(false);
  });

  it("método en minúsculas no es permitido", () => {
    expect(isAllowedRepairEndpoint("post /api/crm/tasks")).toBe(false);
  });

  it("endpoint con prefijo extra no es permitido", () => {
    expect(isAllowedRepairEndpoint("POST /api/crm/tasks/123/extra")).toBe(false);
  });

  it("whitespace alrededor no es permitido", () => {
    expect(isAllowedRepairEndpoint("  POST /api/crm/tasks")).toBe(false);
  });
});

// ─── describeAllowedEndpoints ─────────────────────────────────────────────────

describe("describeAllowedEndpoints (formato para prompts)", () => {
  it("devuelve un string multilínea", () => {
    const output = describeAllowedEndpoints();
    expect(typeof output).toBe("string");
    expect(output).toContain("\n");
  });

  it("incluye cada endpoint con su descripción", () => {
    const output = describeAllowedEndpoints();
    expect(output).toContain("- POST /api/crm/tasks");
    expect(output).toContain("- POST /api/crm/activities");
    expect(output).toContain("- PATCH /api/crm/deals/{id}");
  });

  it("incluye descripciones legibles para cada endpoint", () => {
    const output = describeAllowedEndpoints();
    expect(output).toContain("crear tareas de seguimiento");
    expect(output).toContain("registrar actividades");
    expect(output).toContain("actualizar deals");
  });

  it("tiene exactamente 3 líneas (una por endpoint)", () => {
    const lines = describeAllowedEndpoints()
      .split("\n")
      .filter((l) => l.startsWith("- "));
    expect(lines).toHaveLength(3);
  });
});

// ─── repairActionSchema (Zod refine) ──────────────────────────────────────────

describe("repairActionSchema — validación Zod contra allowlist", () => {
  it("acepta endpoint permitido: POST tasks", () => {
    const result = repairActionSchema.safeParse({
      action: "test",
      endpoint: "POST /api/crm/tasks",
      payload: {},
    });
    expect(result.success).toBe(true);
  });

  it("acepta endpoint permitido: PATCH deals con UUID", () => {
    const result = repairActionSchema.safeParse({
      action: "test",
      endpoint: "PATCH /api/crm/deals/550e8400-e29b-41d4-a716-446655440000",
      payload: {},
    });
    expect(result.success).toBe(true);
  });

  it("rechaza endpoint no permitido: POST contacts", () => {
    const result = repairActionSchema.safeParse({
      action: "test",
      endpoint: "POST /api/crm/contacts",
      payload: {},
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      expect(message).toContain("no permitido");
    }
  });

  it("rechaza endpoint no permitido: DELETE tasks", () => {
    const result = repairActionSchema.safeParse({
      action: "test",
      endpoint: "DELETE /api/crm/tasks",
      payload: {},
    });
    expect(result.success).toBe(false);
  });

  it("rechaza endpoint no permitido: PATCH sin ID", () => {
    const result = repairActionSchema.safeParse({
      action: "test",
      endpoint: "PATCH /api/crm/deals/",
      payload: {},
    });
    expect(result.success).toBe(false);
  });
});
