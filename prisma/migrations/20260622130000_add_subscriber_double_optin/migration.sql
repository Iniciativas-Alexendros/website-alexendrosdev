-- Double opt-in para Subscriber: token de confirmación de un solo uso con
-- caducidad y marca de confirmación. RLS ya está habilitado en la tabla
-- (migración 20260609000000_enable_rls); las columnas nuevas la heredan.

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN "token" TEXT,
ADD COLUMN "tokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "confirmedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_token_key" ON "Subscriber"("token");
