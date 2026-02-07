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

CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "price_inr" integer NOT NULL,
    "price_usd" integer NOT NULL,
    "monthly_events" integer NOT NULL,
    "max_projects" integer NOT NULL,
    "retention_days" integer DEFAULT 30,
    "features" jsonb DEFAULT '{}',
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert new plans
INSERT INTO "public"."plans" ("id", "name", "price_inr", "price_usd", "monthly_events", "max_projects", "retention_days", "features") VALUES
('free', 'Free', 0, 0, 1000, 1, 1, '{"live_logs": false, "refresh_rate": 60}'),
('basic', 'Basic', 299, 4, 50000, 5, 7, '{"live_logs": false, "refresh_rate": 10}'),
('pro', 'Pro', 999, 12, 500000, 15, 30, '{"live_logs": false, "refresh_rate": 1}'),
('business', 'Business', 2999, 39, 5000000, 100, 90, '{"live_logs": true, "refresh_rate": 0}');


-- 4. Update payments table to reflect new plan names if needed
-- (Assuming historical data should stay as is, but if you want to normalize:)
-- UPDATE "public"."payments" SET plan_id = 'business' WHERE plan_id = 'enterprise';
