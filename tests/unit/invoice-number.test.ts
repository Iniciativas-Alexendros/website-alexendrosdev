import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock del cliente Prisma para poder probar la lógica de generación de número
// de factura sin necesidad de una DB real.
const mocks = vi.hoisted(() => ({
  state: {
    prisma: null as null | {
      invoice: { count: ReturnType<typeof vi.fn> };
    },
  },
}));

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.state.prisma;
  },
}));

const { generateInvoiceNumber, generateInvoiceNumberAsync } =
  await import("@/lib/crm/invoice-number");

beforeEach(() => {
  mocks.state.prisma = null;
});

describe("generateInvoiceNumber", () => {
  it("devuelve formato INV-YYYY-NNN con padding a 3 dígitos", () => {
    const number = generateInvoiceNumber(new Date(Date.UTC(2026, 0, 15)));
    expect(number).toMatch(/^INV-2026-\d{3}$/);
  });

  it("usa el año UTC del timestamp recibido", () => {
    expect(generateInvoiceNumber(new Date(Date.UTC(2025, 11, 31, 23, 59)))).toMatch(/^INV-2025-/);
    expect(generateInvoiceNumber(new Date(Date.UTC(2026, 0, 1, 0, 0)))).toMatch(/^INV-2026-/);
  });
});

describe("generateInvoiceNumberAsync", () => {
  it("devuelve formato INV-YYYY-NNN con padding a 3 dígitos", async () => {
    const number = await generateInvoiceNumberAsync(new Date(Date.UTC(2026, 5, 1)));
    expect(number).toMatch(/^INV-2026-\d{3}$/);
  });

  it("con DB: la secuencia es count+1 del año en curso", async () => {
    mocks.state.prisma = {
      invoice: { count: vi.fn().mockResolvedValue(7) },
    };
    const number = await generateInvoiceNumberAsync(new Date(Date.UTC(2026, 5, 1)));
    expect(number).toBe("INV-2026-008");
    expect(mocks.state.prisma.invoice.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          issuedAt: expect.objectContaining({
            gte: new Date(Date.UTC(2026, 0, 1)),
            lt: new Date(Date.UTC(2027, 0, 1)),
          }),
        }),
      }),
    );
  });

  it("sin DB: cae al fallback determinista (no lanza)", async () => {
    mocks.state.prisma = null;
    const number = await generateInvoiceNumberAsync(new Date(Date.UTC(2026, 5, 1)));
    expect(number).toMatch(/^INV-2026-\d{3}$/);
  });
});
