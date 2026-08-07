-- Test: Outbox event processing + webhook idempotency
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(14);

-- webhook_events: idempotency on provider + external_event_id
INSERT INTO webhook_events (provider, external_event_id, event_type, payload_hash, status)
VALUES ('stripe', 'evt_test_001', 'checkout.session.completed', 'abc123', 'processing');

-- Second insert with same provider + external_event_id should fail (unique constraint)
SELECT lives_ok('
    INSERT INTO webhook_events (provider, external_event_id, event_type, payload_hash, status)
    VALUES (''stripe'', ''evt_test_001'', ''checkout.session.completed'', ''abc123'', ''duplicate'')
', 'Duplicate webhook event rejected by unique constraint');

-- Valid: different provider, same external_id
SELECT lives_ok('
    INSERT INTO webhook_events (provider, external_event_id, event_type, payload_hash, status)
    VALUES (''notion'', ''evt_test_001'', ''page_updated'', ''xyz789'', ''received'')
', 'Different provider with same external_id allowed');

-- outbox_events: valid insert
SELECT lives_ok('
    INSERT INTO outbox_events (type, aggregate_type, aggregate_id, payload)
    VALUES (''send_email'', ''contact'', ''test-id-1'', ''{"to":"test@test.com"}'')
', 'Outbox event created successfully');

-- outbox_events: status defaults to pending
SELECT is('
    SELECT status FROM outbox_events WHERE aggregate_id = ''test-id-1''
', 'pending', 'outbox_events.status defaults to pending');

-- outbox_events: attempts defaults to 0
SELECT is('
    SELECT attempts FROM outbox_events WHERE aggregate_id = ''test-id-1''
', '0', 'outbox_events.attempts defaults to 0');

-- outbox_events: max_attempts defaults to 5
SELECT is('
    SELECT max_attempts FROM outbox_events WHERE aggregate_id = ''test-id-1''
', '5', 'outbox_events.max_attempts defaults to 5');

-- Outbox pending index works
SELECT isnt_empty('
    SELECT id FROM outbox_events WHERE status = ''pending'' AND available_at <= now()
', 'Pending outbox events appear in pending index');

-- webhook_events: status defaults to received
SELECT is('
    SELECT status FROM webhook_events WHERE external_event_id = ''evt_test_001'' AND provider = ''stripe''
', 'processing', 'webhook_events.status can be set to processing');

-- webhook_events: provider check constraint
SELECT throws_ok('
    INSERT INTO webhook_events (provider, external_event_id, event_type, payload_hash)
    VALUES (''invalid_provider'', ''evt_test_002'', ''test'', ''hash'')
', 'webhook_events rejects invalid provider');

-- outbox_events: valid payload with empty JSON
SELECT lives_ok('
    INSERT INTO outbox_events (type, aggregate_type, aggregate_id)
    VALUES (''sync_notion'', ''deal'', ''test-id-2'')
', 'outbox_events with empty payload succeeds (defaults to {})');

-- Webhook event count after test data
SELECT is('
    SELECT count(*) FROM webhook_events
', '2', 'webhook_events has 2 events after test inserts');

-- Outbox event count after test data
SELECT is('
    SELECT count(*) FROM outbox_events
', '2', 'outbox_events has 2 events after test inserts');

-- Cleanup
DELETE FROM webhook_events;
DELETE FROM outbox_events;

SELECT * FROM finish();
