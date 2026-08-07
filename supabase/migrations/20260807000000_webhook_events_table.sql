-- webhook_events table: idempotency registry for external webhooks (Stripe, Notion)
-- Prevents duplicate processing on retries; tracks attempt count and errors.
CREATE TABLE "webhook_events" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL CHECK ("provider" IN ('stripe', 'notion')),
    "external_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "attempt_count" INTEGER NOT NULL DEFAULT 1,
    "processed_at" TIMESTAMPTZ,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "webhook_events_provider_external_id_key"
    ON "webhook_events"("provider", "external_event_id");

CREATE INDEX "webhook_events_status_idx"
    ON "webhook_events"("status");

CREATE INDEX "webhook_events_created_at_idx"
    ON "webhook_events"("created_at");

-- Enable RLS and deny anonymous/authenticated access
-- Only the backend (owner role via Prisma) can read/write this table.
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "webhook_events" FROM anon, authenticated;

-- Comment for clarity
COMMENT ON TABLE "webhook_events" IS 'Idempotency registry for Stripe and Notion webhooks';
