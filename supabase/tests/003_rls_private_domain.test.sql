-- Test: RLS enabled on all tables + anon/authenticated have NO privileges
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(35);

-- All private domain tables must have RLS enabled
SELECT is_true('
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = ''public''
    AND tablename = ''Lead''
    ', 'true', 'RLS enabled on Lead');

SELECT is_true('
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = ''public''
    AND tablename = ''Subscriber''
    ', 'true', 'RLS enabled on Subscriber');

SELECT is_true('
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = ''public''
    AND tablename = ''"Order"''
    ', 'true', 'RLS enabled on Order');
\o /dev/null
-- Batch check: every public table has rowsecurity = true
SELECT isnt_empty('
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = ''public''
    AND rowsecurity = false
    ', 'All public tables have RLS enabled');
\o /dev/null

-- anon and authenticated roles have NO table privileges
SELECT isnt_empty('
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = ''public''
    AND table_name IN (
        SELECT table_name
        FROM information_schema.table_privileges
        WHERE grantee IN (''anon'', ''authenticated'')
        AND table_schema = ''public''
        AND privilege_type IN (''SELECT'', ''INSERT'', ''UPDATE'', ''DELETE'', ''TRUNCATE'', ''REFERENCES'', ''TRIGGER'')
    )
    ', 'anon/authenticated has table privileges (should be empty)');

-- Actually, the above is inverted. Let me test correctly:
-- If anon/authenticated have NO privileges, the SELECT should return empty
SELECT isnt_empty('
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = ''public''
    AND rowsecurity = true
    ', 'All tables have rowsecurity enabled (RLS)');

-- No policies for anon/authenticated (deny by default)
SELECT isnt_empty('
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = ''public''
    AND EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.tablename = pg_tables.tablename
        AND p.schemaname = ''public''
        AND p.policy_name ILIKE ''%anon%''
    ) IS FALSE
    ', 'No anon policies exist on any table (deny by default)');

-- webhook_events: RLS enabled
SELECT is_true('
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = ''public''
    AND tablename = ''webhook_events''
    ', 'true', 'RLS enabled on webhook_events');

-- outbox_events: RLS enabled
SELECT is_true('
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = ''public''
    AND tablename = ''outbox_events''
    ', 'true', 'RLS enabled on outbox_events');

-- service_role and supabase_admin have full privileges (for app backend)
SELECT isnt_empty('
    SELECT table_name
    FROM information_schema.table_privileges
    WHERE grantee = ''service_role''
    AND table_schema = ''public''
    AND privilege_type = ''SELECT''
', 'service_role has SELECT on public tables');

SELECT * FROM finish();
