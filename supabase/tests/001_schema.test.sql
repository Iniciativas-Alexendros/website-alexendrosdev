-- Test: Schema structure: all expected tables exist
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Core domain and CRM tables
SELECT plan(25);

\o /dev/null
-- Verify all expected tables exist
SELECT results_eq('
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = ''public''
    AND table_type = ''BASE TABLE''
    ORDER BY table_name',
    ARRAY[
        'Activity','Contact','Deal','DealItem','Invoice','InvoiceItem',
        'Lead','Order','PipelineStage','Product','Subscriber','Subscription',
        'Task','outbox_events','webhook_events'
    ],
    'All 15 expected tables exist');

-- Critical tables exist as individual assertions
SELECT has_table('public', 'Lead', 'Lead table exists');
SELECT has_table('public', 'Subscriber', 'Subscriber table exists');
SELECT has_table('public', 'Order', '"Order" table exists');
SELECT has_table('public', 'Invoice', 'Invoice table exists');
SELECT has_table('public', 'Product', 'Product table exists');
SELECT has_table('public', 'PipelineStage', 'PipelineStage table exists');
SELECT has_table('public', 'Deal', 'Deal table exists');
SELECT has_table('public', 'Activity', 'Activity table exists');
SELECT has_table('public', 'Contact', 'Contact table exists');
SELECT has_table('public', 'Task', 'Task table exists');
SELECT has_table('public', 'DealItem', 'DealItem table exists');
SELECT has_table('public', 'InvoiceItem', 'InvoiceItem table exists');
SELECT has_table('public', 'Subscription', 'Subscription table exists');
SELECT has_table('public', 'webhook_events', 'webhook_events table exists');
SELECT has_table('public', 'outbox_events', 'outbox_events table exists');
\o

SELECT * FROM finish();
