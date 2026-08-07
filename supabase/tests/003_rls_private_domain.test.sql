-- Test: RLS enabled on all tables + anon/authenticated have NO privileges
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(10);

-- All private domain tables must have RLS enabled
SELECT is((
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'Lead'
), true, 'RLS enabled on Lead');

SELECT is((
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'Subscriber'
), true, 'RLS enabled on Subscriber');

SELECT is((
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'Order'
), true, 'RLS enabled on Order');

-- Batch check: every public table has rowsecurity = true
SELECT isnt_empty('
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = ''public''
    AND rowsecurity = false
', 'No public tables without RLS');

-- anon and authenticated roles have NO table privileges
SELECT is_empty('
    SELECT 1
    FROM information_schema.table_privileges
    WHERE grantee IN (''anon'', ''authenticated'')
    AND table_schema = ''public''
    AND privilege_type IN (''SELECT'', ''INSERT'', ''UPDATE'', ''DELETE'', ''TRUNCATE'', ''REFERENCES'', ''TRIGGER'')
', 'anon/authenticated have no table privileges');

-- No policies for anon/authenticated (deny by default)
SELECT isnt_empty('
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = ''public''
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.tablename = pg_tables.tablename
        AND p.schemaname = ''public''
        AND p.policy_name ILIKE ''%anon%''
    )
', 'No anon policies exist on any table (deny by default)');

-- webhook_events: RLS enabled
SELECT is((
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'webhook_events'
), true, 'RLS enabled on webhook_events');

-- outbox_events: RLS enabled
SELECT is((
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'outbox_events'
), true, 'RLS enabled on outbox_events');

-- Count: all public tables should have rowsecurity = true (no exceptions)
SELECT is((
    SELECT count(*)
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = false
), 0, 'Zero public tables without RLS');

-- Verify no grants to anon/authenticated via pg_roles
SELECT is_empty('
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee IN (''anon'', ''authenticated'')
    AND table_schema = ''public''
', 'No role_table_grants for anon/authenticated');

SELECT * FROM finish();
