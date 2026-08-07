import "server-only";
import { randomBytes, createHash } from "node:crypto";

// Double opt-in: el token de confirmación es aleatorio (128 bits), de un solo uso
// y caduca a las 48 h. Se guarda en la BD como hash SHA-256 (token_hash) para
// evitar exposición en caso de fuga de BD. El token en claro solo viaja por email.
export const CONFIRM_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

export function newConfirmationToken(now: number = Date.now()): {
  token: string;
  tokenHash: string;
  tokenExpiresAt: Date;
} {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return {
    token,
    tokenHash,
    tokenExpiresAt: new Date(now + CONFIRM_TOKEN_TTL_MS),
  };
}
