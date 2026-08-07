-- Test: Constraints: unique, check, PK, FK, defaults
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(31);

-- Unique constraints prevent duplicates
SELECT isnt_null('public','Subscriber','email', 'Subscriber.email is NOT NULL');
SELECT isnt_null('public','Subscriber','id', 'Subscriber.id is NOT NULL');
SELECT isnt_null('public','Order','stripeSessionId', 'Order.stripeSessionId is NOT NULL');
SELECT isnt_null('public','Order','item', 'Order.item is NOT NULL');
SELECT isnt_null('public','Order','amount', 'Order.amount is NOT NULL');
SELECT isnt_null('public','PipelineStage','name', 'PipelineStage.name is NOT NULL');
SELECT isnt_null('public','PipelineStage','order', 'PipelineStage.order is NOT NULL');
SELECT isnt_null('public','Product','name', 'Product.name is NOT NULL');
SELECT isnt_null('public','Contact','firstName', 'Contact.firstName is NOT NULL');
SELECT isnt_null('public','Deal','title', 'Deal.title is NOT NULL');
SELECT isnt_null('public','Deal','contactId', 'Deal.contactId is NOT NULL');
SELECT isnt_null('public','Invoice','number', 'Invoice.number is NOT NULL');
SELECT isnt_null('public','InvoiceItem','description', 'InvoiceItem.description is NOT NULL');
SELECT isnt_null('public','InvoiceItem','invoiceId', 'InvoiceItem.invoiceId is NOT NULL');
SELECT isnt_null('public','Subscription','stripeSubscriptionId', 'Subscription.stripeSubscriptionId is NOT NULL');
SELECT isnt_null('public','Activity','title', 'Activity.title is NOT NULL');
SELECT isnt_null('public','Task','title', 'Task.title is NOT NULL');
SELECT isnt_null('public','DealItem','dealId', 'DealItem.dealId is NOT NULL');

-- Unique indexes prevent duplicate Stripe IDs
SELECT is_unique('public', 'Order_stripeSessionId_key', 'stripeSessionId is unique index');
SELECT is_unique('public', 'Invoice_stripeInvoiceId_key', 'stripeInvoiceId is unique index');
SELECT is_unique('public', 'Subscription_stripeSubscriptionId_key', 'stripeSubscriptionId is unique index');

-- webhook_events: unique constraint on provider + external_event_id
SELECT isnt_null('public','webhook_events','provider', 'webhook_events.provider is NOT NULL');
SELECT isnt_null('public','webhook_events','external_event_id', 'webhook_events.external_event_id is NOT NULL');
SELECT is_unique('public', 'webhook_events_provider_external_id_key', 'webhook_events provider+external_event_id is unique');

-- outbox_events: required fields
SELECT isnt_null('public','outbox_events','type', 'outbox_events.type is NOT NULL');
SELECT isnt_null('public','outbox_events','aggregate_type', 'outbox_events.aggregate_type is NOT NULL');
SELECT isnt_null('public','outbox_events','aggregate_id', 'outbox_events.aggregate_id is NOT NULL');
SELECT has_index('public','outbox_events','available_at','outbox_events_pending_idx', 'idx on available_at for pending jobs');

-- FK constraints exist
SELECT has_fk('public', 'Deal', 'Deal_contactId_fkey', 'Deal.contactId FK exists');
SELECT has_fk('public', 'Deal', 'Deal_stageId_fkey', 'Deal.stageId FK exists');
SELECT has_fk('public', 'InvoiceItem', 'InvoiceItem_invoiceId_fkey', 'InvoiceItem.invoiceId FK exists');

SELECT * FROM finish();
