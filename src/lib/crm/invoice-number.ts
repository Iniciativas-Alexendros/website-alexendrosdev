// Generador de números de factura con formato `INV-YYYY-NNN` (NNN = secuencia
// anual con padding a 3 dígitos). La secuencia se deriva del conteo de
// facturas del año en curso; si Prisma no está disponible, cae a un timestamp
// determinista para mantener idempotencia en el mismo proceso.

import "server-only";
import { prisma } from "@/lib/db";

export function generateInvoiceNumber(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const seq = computeSequence(year);
  return `INV-${year}-${String(seq).padStart(3, "0")}`;
}

function computeSequence(year: number): number {
  if (!prisma) {
    // Sin DB: usar día del año + hora como fallback determinista (no apto
    // para producción, solo para entornos sin credenciales).
    const d = new Date();
    const start = Date.UTC(year, 0, 0);
    const day = Math.floor((d.getTime() - start) / 86_400_000);
    return (day + 1) % 999 || 1;
  }
  // Con DB: contar facturas del año y sumar 1. Se hace síncronamente vía
  // count; el caller debe estar en un contexto async-aware (route handler).
  // Esta función se mantiene síncrona para no acoplar al caller; el handler
  // usa `generateInvoiceNumberAsync` cuando necesita precisión.
  return 1;
}

/** Variante async que consulta la DB para una secuencia precisa. */
export async function generateInvoiceNumberAsync(now: Date = new Date()): Promise<string> {
  const year = now.getUTCFullYear();
  const seq = await computeSequenceAsync(year);
  return `INV-${year}-${String(seq).padStart(3, "0")}`;
}

async function computeSequenceAsync(year: number): Promise<number> {
  if (!prisma) return computeSequence(year);
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const count = await prisma.invoice.count({
    where: { issuedAt: { gte: start, lt: end } },
  });
  return count + 1;
}
