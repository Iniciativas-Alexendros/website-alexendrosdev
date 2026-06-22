import "server-only";
import { randomBytes } from "node:crypto";

// Double opt-in: el token de confirmación es aleatorio (128 bits), de un solo uso
// y caduca a las 48 h. Se guarda en la BD y se invalida al confirmar.
export const CONFIRM_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

export function newConfirmationToken(now: number = Date.now()): {
  token: string;
  tokenExpiresAt: Date;
} {
  return {
    token: randomBytes(32).toString("hex"),
    tokenExpiresAt: new Date(now + CONFIRM_TOKEN_TTL_MS),
  };
}
