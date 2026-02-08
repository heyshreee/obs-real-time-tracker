-- Migration script to update subscription plans to: free, basic, pro, business

-- 1. Update users table 'plan' column check constraint (if exists) or just validate data
-- First, let's look at existing plans.
-- If you have a check constraint on the plan column, drop it and add a new one.

ALTER TABLE "public"."users" DROP CONSTRAINT IF EXISTS "users_plan_check";

ALTER TABLE "public"."users" 
    ADD CONSTRAINT "users_plan_check" 
    CHECK (plan IN ('free', 'basic', 'pro', 'business'));

-- 2. Migrate existing users to new plans mapping
-- Mapping Strategy:
-- 'free' -> 'free'
-- 'pro' -> 'pro' (Logic: 'pro' was $29, new 'pro' is $12. Users get cheaper price. Or 'business' is $39. Move old 'pro' to 'business' if you want to keep 'enterprise' features, but 'pro' seems safer mapping for name.)
-- 'enterprise' -> 'business' (Best fit)

-- IMPORTANT: You might want to run these updates manually or adjust strictly based on your needs.

-- Update old 'enterprise' users to 'business'
UPDATE "public"."users"
SET plan = 'business'
WHERE plan = 'enterprise';

-- Update any other legacy plans if they exist
-- e.g. 'starter' -> 'free'
UPDATE "public"."users"
SET plan = 'free'
WHERE plan = 'starter';


-- 3. (Optional) Create a 'plans' table if you want to store plan details in DB instead of code
-- This is useful for dynamic pricing pages in the future.

-- 3. Create 'plans' table to store plan details and limits securely
CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "price_inr" integer NOT NULL,
    "price_usd" integer NOT NULL,
    "monthly_events" integer NOT NULL,
    "max_projects" integer NOT NULL,
    "storage_limit" bigint NOT NULL,
    "retention_days" integer DEFAULT 30,
    "allowed_origins" integer DEFAULT 1,
    "refresh_rate" integer DEFAULT 60,
    "live_logs" boolean DEFAULT false,
    "email_integrity" boolean DEFAULT false,
    "share_report" integer DEFAULT 0,
    "features" jsonb DEFAULT '[]', -- For UI display list
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (authenticated and anon)
CREATE POLICY "Enable read access for all users" ON "public"."plans"
    FOR SELECT USING (true);

-- Policy: Allow service_role only to modify
CREATE POLICY "Enable write access for service_role only" ON "public"."plans"
    FOR ALL USING (auth.role() = 'service_role');


-- Insert new plans with comprehensive limits matching backend definitions
INSERT INTO "public"."plans" 
("id", "name", "price_inr", "price_usd", "monthly_events", "max_projects", "storage_limit", "retention_days", "allowed_origins", "refresh_rate", "live_logs", "email_integrity", "share_report", "features") 
VALUES
(
    'free', 'Free', 0, 0, 
    1000, 1, 104857600, 1, 1, 60, false, false, 0,
    '[
        {"text": "1 Project", "included": true},
        {"text": "1 Allowed Origin", "included": true},
        {"text": "1,000 events/mo", "included": true},
        {"text": "60 sec dashboard refresh", "included": true},
        {"text": "Basic Analytics", "included": true}
    ]'
),
(
    'basic', 'Basic', 299, 4, 
    50000, 5, 1073741824, 7, 3, 10, false, false, 5,
    '[
        {"text": "5 Projects", "included": true},
        {"text": "3 Allowed Origins", "included": true},
        {"text": "50,000 events/mo", "included": true},
        {"text": "Live Device Stats", "included": true},
        {"text": "10 sec dashboard refresh", "included": true},
        {"text": "Real-time Analytics", "included": true}
    ]'
),
(
    'pro', 'Pro', 999, 12, 
    500000, 15, 10737418240, 30, 10, 1, true, true, 20,
    '[
        {"text": "15 Projects", "included": true},
        {"text": "10 Allowed Origins", "included": true},
        {"text": "500,000 events/mo", "included": true},
        {"text": "Live Activity Logs", "included": true},
        {"text": "1 sec dashboard refresh", "included": true},
        {"text": "Advanced Analytics", "included": true},
        {"text": "Priority Support", "included": true}
    ]'
),
(
    'business', 'Business', 2999, 39, 
    5000000, 100, 53687091200, 90, 100, 0, true, true, 100,
    '[
        {"text": "Unlimited Projects", "included": true},
        {"text": "100 Allowed Origins", "included": true},
        {"text": "5,000,000 events/mo", "included": true},
        {"text": "Real-time / SLA", "included": true},
        {"text": "Team access", "included": true}
    ]'
)
ON CONFLICT ("id") DO UPDATE SET
    name = EXCLUDED.name,
    price_inr = EXCLUDED.price_inr,
    price_usd = EXCLUDED.price_usd,
    monthly_events = EXCLUDED.monthly_events,
    max_projects = EXCLUDED.max_projects,
    storage_limit = EXCLUDED.storage_limit,
    retention_days = EXCLUDED.retention_days,
    allowed_origins = EXCLUDED.allowed_origins,
    refresh_rate = EXCLUDED.refresh_rate,
    live_logs = EXCLUDED.live_logs,
    email_integrity = EXCLUDED.email_integrity,
    share_report = EXCLUDED.share_report,
    features = EXCLUDED.features;

-- 4. Update payments table/logic if needed (No changes required for table structure yet)
