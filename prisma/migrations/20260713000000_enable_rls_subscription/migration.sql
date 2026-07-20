-- Enable RLS on Subscription table (missed in 20260709000000_add_subscription_and_stripe_invoice_id)
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
