import "server-only";

/**
 * Rate limiter en memoria (ventana deslizante por clave/IP).
 *
 * ⚠️ Vercel serverless: cada instancia de función tiene su propio Map.
 * Un mismo IP puede sortear el límite con requests paralelas a distintas
 * instancias. Suficiente como best-effort para tráfico bajo.
 * TODO S2: migrar a Upstash Redis para rate limiting distribuido.
 *
 * Suficiente para una instancia única (VPS). En despliegues multi-instancia es
 * best-effort; migrar a Upstash/Redis si se requiere límite global estricto.
 */
const hits = new Map<string, number[]>();

// Barrido perezoso anti-fuga: el Map crecería sin cota porque las claves de IPs
// que pegan una vez y no vuelven nunca se eliminaban. Cada SWEEP_INTERVAL_MS, la
// próxima llamada purga las claves cuyas marcas hayan caducado todas. No usamos
// setInterval (mantendría vivo el proceso y no aplica en serverless).
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

function sweep(now: number, windowMs: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, times] of hits) {
    if (times.every((t) => now - t >= windowMs)) hits.delete(k);
  }
}

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  sweep(now, windowMs);
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/**
 * Extrae la IP del cliente de cabeceras de proxy.
 *
 * Seguridad: el cliente controla por completo lo que mete en `x-forwarded-for`,
 * así que tomar el PRIMER valor es spoofeable y permite evadir el rate-limit con
 * IPs inventadas. Asumimos un proxy de confianza delante (Vercel/Nginx) que añade
 * la IP real al final de la cadena, por lo que:
 *   1) preferimos `x-real-ip` (lo fija el proxy, no el cliente);
 *   2) si solo hay `x-forwarded-for`, tomamos el ÚLTIMO valor (el añadido por el
 *      proxy más cercano), no el primero.
 * Si el servicio se expone directo a internet sin proxy, el rate-limit por IP no
 * es fiable por naturaleza: en ese caso, migrar a un límite con almacén externo.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",");
    return parts[parts.length - 1]!.trim();
  }
  return "anon";
}
