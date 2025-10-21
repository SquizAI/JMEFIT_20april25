-- Improve RLS policies for better security
-- Date: 2025-10-21
-- Purpose: Add missing user-level RLS policies for better data protection

-- ============================================================================
-- USER ACTIVITIES - Allow users to see their own activities
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;

-- Create policy for users to view their own activities
CREATE POLICY "Users can view own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- PAYMENT ANALYTICS - Allow users to see their own payment history
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view own payment history" ON payment_analytics;

-- Create policy for users to view their own payment analytics
CREATE POLICY "Users can view own payment history"
  ON payment_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- SUPPORT TICKETS - Allow users to manage their own support tickets
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create tickets for themselves
CREATE POLICY "Users can create own tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (for example, to close them)
CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TICKET MESSAGES - Allow users to view messages for their tickets
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view own ticket messages" ON ticket_messages;

-- Users can view messages for their tickets
CREATE POLICY "Users can view own ticket messages"
  ON ticket_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- Users can create messages for their own tickets
CREATE POLICY "Users can create own ticket messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUBSCRIPTIONS - Enhance policies for better control
-- ============================================================================

-- Drop and recreate to ensure proper policy
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policy for subscriptions (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
    AND policyname = 'Admins can manage all subscriptions'
  ) THEN
    CREATE POLICY "Admins can manage all subscriptions"
      ON subscriptions FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND (raw_user_meta_data->>'is_admin' = 'true' OR raw_user_meta_data->>'role' = 'admin')
        )
      );
  END IF;
END $$;

-- ============================================================================
-- ORDERS - Enhance policies for better control
-- ============================================================================

-- Drop and recreate to ensure proper policy
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policy for orders (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders'
    AND policyname = 'Admins can manage all orders'
  ) THEN
    CREATE POLICY "Admins can manage all orders"
      ON orders FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND (raw_user_meta_data->>'is_admin' = 'true' OR raw_user_meta_data->>'role' = 'admin')
        )
      );
  END IF;
END $$;

-- ============================================================================
-- SUBSCRIPTION PLANS - Public read access for unauthenticated users
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;

-- Allow anyone (including unauthenticated) to view active subscription plans
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (active = true);

-- ============================================================================
-- SUBSCRIPTION PRICES - Public read access for unauthenticated users
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view active subscription prices" ON subscription_prices;

-- Allow anyone (including unauthenticated) to view active prices
CREATE POLICY "Anyone can view active subscription prices"
  ON subscription_prices FOR SELECT
  USING (active = true);

-- ============================================================================
-- BLOG POSTS - Ensure proper policies are in place
-- ============================================================================

-- Already fixed in previous migration (20250323_fix_blog_posts_rls.sql)
-- But let's ensure they exist

DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_posts'
    AND policyname = 'Anyone can view published blog posts'
  ) THEN
    CREATE POLICY "Anyone can view published blog posts"
      ON blog_posts FOR SELECT
      USING (status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_posts'
    AND policyname = 'Admins can manage all blog posts'
  ) THEN
    CREATE POLICY "Admins can manage all blog posts"
      ON blog_posts FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND (raw_user_meta_data->>'is_admin' = 'true' OR raw_user_meta_data->>'role' = 'admin')
        )
      );
  END IF;

  -- Authors can view and edit their own draft posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_posts'
    AND policyname = 'Authors can manage own blog posts'
  ) THEN
    CREATE POLICY "Authors can manage own blog posts"
      ON blog_posts FOR ALL
      USING (auth.uid() = author_id);
  END IF;
END $$;

-- ============================================================================
-- SHRED ORDERS - Allow users to view their own orders
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view own shred orders" ON shred_orders;

-- Users can view their own SHRED orders
CREATE POLICY "Users can view own shred orders"
  ON shred_orders FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- WORKOUT LOGS - Ensure users can only manage their own logs
-- ============================================================================

-- Already has policy "Users can manage own workout logs"
-- Let's verify it's comprehensive

DROP POLICY IF EXISTS "Users can manage own workout logs" ON workout_logs;

-- Users can view their own workout logs
CREATE POLICY "Users can view own workout logs"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own workout logs
CREATE POLICY "Users can create own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own workout logs
CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own workout logs
CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROFILES - Ensure users can only update their own profile
-- ============================================================================

-- Already has policies, but let's ensure they're correct
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for signup flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can create own profile'
  ) THEN
    CREATE POLICY "Users can create own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ============================================================================
-- AUDIT LOGGING - Log this migration
-- ============================================================================

-- Insert audit log entry for this migration
INSERT INTO audit_logs (user_id, action, resource_type, metadata)
VALUES (
  auth.uid(),
  'rls_policies_updated',
  'database_migration',
  jsonb_build_object(
    'migration', '20251021_improve_rls_policies',
    'tables_updated', ARRAY[
      'user_activities',
      'payment_analytics',
      'support_tickets',
      'ticket_messages',
      'subscriptions',
      'orders',
      'subscription_plans',
      'subscription_prices',
      'blog_posts',
      'shred_orders',
      'workout_logs',
      'profiles'
    ],
    'timestamp', NOW()
  )
);

-- ============================================================================
-- VERIFICATION - Verify all tables have RLS enabled
-- ============================================================================

-- This query will show all tables and their RLS status
-- Run manually after migration to verify:
/*
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view own activities" ON user_activities IS
  'Allow users to view their own activity history';

COMMENT ON POLICY "Users can view own payment history" ON payment_analytics IS
  'Allow users to view their own payment analytics and history';

COMMENT ON POLICY "Users can view own tickets" ON support_tickets IS
  'Allow users to view their own support tickets';

COMMENT ON POLICY "Users can view own ticket messages" ON ticket_messages IS
  'Allow users to view messages for their own support tickets';

COMMENT ON POLICY "Anyone can view active subscription plans" ON subscription_plans IS
  'Public access to active subscription plans for pricing page';

COMMENT ON POLICY "Anyone can view active subscription prices" ON subscription_prices IS
  'Public access to active subscription prices for pricing page';

-- End of migration
