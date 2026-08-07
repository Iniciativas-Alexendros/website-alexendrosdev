-- Migración: renombrar Subscriber.token -> token_hash
-- Razón: almacenar hash SHA-256 en vez de token en claro (seguridad)
-- Los tokens existentes se hashean en esta migración (backfill).

-- Habilitar pgcrypto para SHA-256
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Renombrar columna token -> token_hash
ALTER TABLE "Subscriber" RENAME COLUMN "token" TO "token_hash";

-- Backfill: hashear tokens existentes (los tokens en claro ahora son hashes)
UPDATE "Subscriber"
SET "token_hash" = encode(digest("token_hash", 'sha256'), 'hex')
WHERE "token_hash" IS NOT NULL;
