import "server-only";

/**
 * Monitor — métricas ligeras en memoria para observabilidad de negocio.
 *
 * Propósito: contar eventos clave (checkouts, webhooks, errores) en ventanas
 * de tiempo, exportables por el endpoint /api/health. Los datos son
 * best-effort: en instancia única (VPS/Coolify) son exactos; en despliegues
 * multi-instancia (Vercel serverless) cada instancia tiene su propio contador.
 *
 * Para métricas aggregate reales, ingerir los logs estructurados via SigNoz/OTel
 * (ver src/instrumentation.ts — @vercel/otel ya configurado).
 */

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface MetricPoint {
  /** Timestamp ISO del último evento de esta métrica. */
  lastEvent: string;
  /** Total acumulado desde que arrancó la instancia. */
  total: number;
  /** Eventos en la última ventana de 5 min. */
  recent5m: number;
  /** Eventos en la última ventana de 1 h. */
  recent1h: number;
}

export interface MonitorSnapshot {
  uptime: number;
  startedAt: string;
  metrics: Record<string, MetricPoint>;
}

// ─── Estado interno ─────────────────────────────────────────────────────────

const WINDOW_5M = 300_000;
const WINDOW_1H = 3_600_000;

let startedAt = Date.now();

const counters = new Map<string, number[]>();

function sweep(now: number): void {
  const cutoff = now - WINDOW_1H;
  for (const [key, times] of counters) {
    const active = times.filter((t) => t > cutoff);
    if (active.length === 0) {
      counters.delete(key);
    } else if (active.length < times.length) {
      counters.set(key, active);
    }
  }
}

let lastSweep = Date.now();

function ensureSweep(now: number): void {
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    sweep(now);
  }
}

// ─── API pública ────────────────────────────────────────────────────────────

/**
 * Registra un evento de métrica. Llámalo desde los Route Handlers en puntos
 * clave: checkout completado, webhook recibido, error de pago, etc.
 *
 * @example
 *   metric("checkout.started", "puesta-a-punto-web");
 *   metric("stripe.webhook.received", "checkout.session.completed");
 *   metric("checkout.error", "stripe_session_failed");
 */
export function metric(name: string, label?: string): void {
  const key = label ? `${name}:${label}` : name;
  const now = Date.now();
  ensureSweep(now);

  const times = counters.get(key) ?? [];
  times.push(now);

  // Podar eventos fuera de la ventana de 1h inline
  const cutoff = now - WINDOW_1H;
  const active = times.filter((t) => t > cutoff);
  counters.set(key, active);
}

/**
 * Obtiene una instantánea de todas las métricas actuales.
 */
export function snapshot(): MonitorSnapshot {
  const now = Date.now();
  ensureSweep(now);
  const cutoff5m = now - WINDOW_5M;
  const cutoff1h = now - WINDOW_1H;

  const metrics: Record<string, MetricPoint> = {};
  for (const [key, times] of counters) {
    const recent5m = times.filter((t) => t > cutoff5m).length;
    const recent1h = times.filter((t) => t > cutoff1h).length;
    metrics[key] = {
      lastEvent: new Date(times[times.length - 1]!).toISOString(),
      total: times.length,
      recent5m,
      recent1h,
    };
  }

  return {
    uptime: Math.floor((now - startedAt) / 1000),
    startedAt: new Date(startedAt).toISOString(),
    metrics,
  };
}

/**
 * Reinicia todas las métricas (para tests).
 */
export function _resetMetrics(): void {
  counters.clear();
  startedAt = Date.now();
  lastSweep = Date.now();
}
