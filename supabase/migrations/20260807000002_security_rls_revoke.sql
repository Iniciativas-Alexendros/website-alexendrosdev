-- Enable RLS on all tables in public schema with REVOKE grants.
-- This migration complements the existing Prisma RLS migrations (which only
-- cover Lead, Subscriber, Order, Subscription, _prisma_migrations) by extending
-- RLS + deny-by-default to ALL domain tables, webhook_events, and outbox_events.
--
-- Rationale: anon/authenticated roles must have no access to private domain
-- tables via PostgREST. The application talks to Postgres exclusively through
-- Prisma using the database owner role, which bypasses RLS.

-- Enable RLS on all tables in public schema that don't have it yet
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND rowsecurity = false
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- REVOKE all privileges from anon and authenticated on all objects
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
