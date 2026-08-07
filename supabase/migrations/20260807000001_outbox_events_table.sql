-- outbox_events table: transactional outbox for decoupled side effects
-- (Notion sync, Resend email, Stripe follow-ups). Inserted in the same
-- $transaction as the domain event; processed by an async worker with
-- exponential backoff and dead-letter tracking.
CREATE TABLE "outbox_events" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "available_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "locked_at" TIMESTAMPTZ,
    "processed_at" TIMESTAMPTZ,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "outbox_events_pending_idx"
    ON "outbox_events"("status", "available_at")
    WHERE "status" = 'pending';

CREATE INDEX "outbox_events_locked_idx"
    ON "outbox_events"("locked_at")
    WHERE "locked_at" IS NOT NULL;

-- Enable RLS and deny anonymous/authenticated access
ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "outbox_events" FROM anon, authenticated;

COMMENT ON TABLE "outbox_events" IS 'Transactional outbox for async side effects (Notion, Resend, Stripe)';
