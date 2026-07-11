// Reglas de transición del pipeline de ventas (9 stages, freelancing realista).
// Stages: 0=Nuevo, 1=Contactado, 2=Discovery call, 3=Propuesta,
//         4=Negociación, 5=Cerrado ganado, 6=Onboarding,
//         7=En progreso, 8=Entregado, 9=Cerrado perdido

export interface Stage {
  order: number;
  name: string;
  terminal: boolean;
}

const STAGES: Stage[] = [
  { order: 0, name: "Nuevo", terminal: false },
  { order: 1, name: "Contactado", terminal: false },
  { order: 2, name: "Discovery call", terminal: false },
  { order: 3, name: "Propuesta", terminal: false },
  { order: 4, name: "Negociación", terminal: false },
  { order: 5, name: "Cerrado ganado", terminal: true },
  { order: 6, name: "Onboarding", terminal: false },
  { order: 7, name: "En progreso", terminal: false },
  { order: 8, name: "Entregado", terminal: true },
  { order: 9, name: "Cerrado perdido", terminal: true },
];

const TERMINAL_ORDERS = new Set([8, 9]); // Entregado, Cerrado perdido

/**
 * Devuelve el stage inicial de un deal nuevo (order 0).
 */
export function getInitialStage(): Stage {
  return STAGES[0]!;
}

/**
 * Valida si la transición de stage `from` a `to` es permitida.
 *
 * Reglas:
 * - Lineal forward: 0→1, 1→2, ..., 7→8
 * - "Cerrado perdido" (9) accesible desde stage ≥3 (Propuesta o posterior)
 * - No se permiten saltos ni retrocesos (salvo ramal a 9)
 * - Stages 8 y 9 son terminales: no admiten más transiciones
 * - Stage 5 (Cerrado ganado) es terminal como "cierre comercial" pero permite
 *   transición a 6 (Onboarding) para la fase de entrega
 */
export function isValidTransition(from: number, to: number): boolean {
  // Stages terminales (8=Entregado, 9=Cerrado perdido) no pueden moverse
  if (TERMINAL_ORDERS.has(from)) return false;

  // Transición a "Cerrado perdido" (9) accesible desde stage ≥3
  if (to === 9) return from >= 3;

  // Lineal forward: solo +1
  return to === from + 1;
}

/**
 * Indica si el stage (por orden) es terminal.
 *
 * Stage 5 (Cerrado ganado) es terminal como "cierre comercial" pero permite
 * transición a Onboarding (6). Stages 8 y 9 son verdaderamente terminales.
 */
export function isTerminalStage(order: number): boolean {
  return order === 5 || TERMINAL_ORDERS.has(order);
}

/** Devuelve todos los stages (para system prompts y listados). */
export function getAllStages(): Stage[] {
  return [...STAGES];
}

/**
 * Calcula subtotal, impuesto y total para una lista de items de factura.
 */
export function computeInvoiceTotals(
  items: { quantity: number; unitPrice: number }[],
  taxRate: number,
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const taxAmount = Math.round(subtotal * taxRate);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}
