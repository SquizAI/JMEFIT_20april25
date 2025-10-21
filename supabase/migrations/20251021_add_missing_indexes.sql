-- Add missing database indexes for performance optimization
-- Date: 2025-10-21
-- Purpose: Improve query performance on frequently accessed columns

-- ============================================================================
-- SUBSCRIPTIONS TABLE - Critical indexes for user and Stripe queries
-- ============================================================================

-- Index on user_id for fast user subscription lookups
-- This is CRITICAL as users frequently check their subscription status
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions(user_id);

-- Index on stripe_customer_id for Stripe webhook processing
-- Webhooks need to quickly find subscriptions by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON subscriptions(stripe_customer_id);

-- Index on stripe_subscription_id for Stripe webhook processing
-- Webhooks need to quickly find subscriptions by Stripe subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
  ON subscriptions(stripe_subscription_id);

-- Index on status for filtering active/canceled subscriptions
-- Dashboard queries filter by status frequently
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions(status);

-- Composite index for user + status queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status);

-- Index on current_period_end for finding expiring subscriptions
-- Used for renewal reminders and grace period management
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end
  ON subscriptions(current_period_end);

-- ============================================================================
-- ORDERS TABLE - Indexes for user and admin queries
-- ============================================================================

-- Index on user_id for fast user order lookups
-- Users frequently view their order history
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders(user_id);

-- Index on created_at for sorting and filtering by date
-- Order lists are typically sorted by date (most recent first)
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders(created_at DESC);

-- Index on status for filtering orders by status
-- Admin dashboard filters by order status
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(status);

-- Index on stripe_session_id for Stripe webhook processing
-- Webhooks need to quickly find orders by Stripe session ID
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON orders(stripe_session_id);

-- Composite index for user + status queries
CREATE INDEX IF NOT EXISTS idx_orders_user_status
  ON orders(user_id, status);

-- Composite index for user + created_at for user order history
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at
  ON orders(user_id, created_at DESC);

-- ============================================================================
-- BLOG POSTS TABLE - Indexes for public blog queries
-- ============================================================================

-- Index on published_at for sorting published posts
-- Blog listing pages sort by publication date
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at
  ON blog_posts(published_at DESC) WHERE status = 'published';

-- Composite index for status + published_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published
  ON blog_posts(status, published_at DESC);

-- Index on author_id for author page queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id
  ON blog_posts(author_id);

-- Full-text search index on title and content (for blog search)
-- PostgreSQL full-text search for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_search
  ON blog_posts USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_blog_posts_content_search
  ON blog_posts USING gin(to_tsvector('english', content));

-- ============================================================================
-- PAYMENT ANALYTICS TABLE - Indexes for admin analytics
-- ============================================================================

-- Index on user_id for user payment history
CREATE INDEX IF NOT EXISTS idx_payment_analytics_user_id
  ON payment_analytics(user_id);

-- Index on created_at for time-based analytics
CREATE INDEX IF NOT EXISTS idx_payment_analytics_created_at
  ON payment_analytics(created_at DESC);

-- Index on status for filtering by payment status
CREATE INDEX IF NOT EXISTS idx_payment_analytics_status
  ON payment_analytics(status);

-- Composite index for user + created_at
CREATE INDEX IF NOT EXISTS idx_payment_analytics_user_created
  ON payment_analytics(user_id, created_at DESC);

-- ============================================================================
-- USER ACTIVITIES TABLE - Indexes for activity tracking
-- ============================================================================

-- Index on activity_type for filtering by activity type
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type
  ON user_activities(activity_type);

-- Composite index for user + created_at for user activity feed
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created
  ON user_activities(user_id, created_at DESC);

-- ============================================================================
-- SUPPORT TICKETS TABLE - Indexes for support dashboard
-- ============================================================================

-- Index on assigned_to for admin dashboard (tickets assigned to me)
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to
  ON support_tickets(assigned_to);

-- Composite index for status + priority for support queue
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority
  ON support_tickets(status, priority);

-- Composite index for user + created_at for user ticket history
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created
  ON support_tickets(user_id, created_at DESC);

-- ============================================================================
-- TICKET MESSAGES TABLE - Indexes for conversation threads
-- ============================================================================

-- Index on ticket_id for loading all messages in a ticket
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id
  ON ticket_messages(ticket_id);

-- Composite index for ticket + created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_created
  ON ticket_messages(ticket_id, created_at);

-- ============================================================================
-- SHRED ORDERS TABLE - Indexes for SHRED challenge management
-- ============================================================================

-- Index on user_id for user SHRED order lookup
CREATE INDEX IF NOT EXISTS idx_shred_orders_user_id
  ON shred_orders(user_id);

-- Index on email for email-based lookup
CREATE INDEX IF NOT EXISTS idx_shred_orders_email
  ON shred_orders(email);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_shred_orders_created_at
  ON shred_orders(created_at DESC);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_shred_orders_status
  ON shred_orders(status);

-- ============================================================================
-- SHRED WAITLIST TABLE - Index for waitlist management
-- ============================================================================

-- Index on created_at for sorting waitlist by signup date
CREATE INDEX IF NOT EXISTS idx_shred_waitlist_created_at
  ON shred_waitlist(created_at DESC);

-- ============================================================================
-- WORKOUT LOGS TABLE - Indexes for user workout tracking
-- ============================================================================

-- Index on date for filtering workouts by date
CREATE INDEX IF NOT EXISTS idx_workout_logs_date
  ON workout_logs(date DESC);

-- Index on workout_type for filtering by type
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_type
  ON workout_logs(workout_type);

-- Composite index for user + date for user workout history
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date
  ON workout_logs(user_id, date DESC);

-- ============================================================================
-- PROFILES TABLE - Indexes for user management
-- ============================================================================

-- Index on email for email-based lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email);

-- Index on is_active for filtering active users
CREATE INDEX IF NOT EXISTS idx_profiles_is_active
  ON profiles(is_active) WHERE is_active = true;

-- ============================================================================
-- EMAIL CAMPAIGN METRICS TABLE - Indexes for email analytics
-- ============================================================================

-- Index on created_at for time-based analytics
CREATE INDEX IF NOT EXISTS idx_email_campaign_metrics_created_at
  ON email_campaign_metrics(created_at DESC);

-- Index on updated_at for finding recently updated campaigns
CREATE INDEX IF NOT EXISTS idx_email_campaign_metrics_updated_at
  ON email_campaign_metrics(updated_at DESC);

-- ============================================================================
-- AUTOMATION WORKFLOWS TABLE - Indexes for workflow management
-- ============================================================================

-- Index on is_active for filtering active workflows
CREATE INDEX IF NOT EXISTS idx_automation_workflows_is_active
  ON automation_workflows(is_active) WHERE is_active = true;

-- Index on trigger_type for filtering workflows by trigger
CREATE INDEX IF NOT EXISTS idx_automation_workflows_trigger_type
  ON automation_workflows(trigger_type);

-- ============================================================================
-- AUDIT LOGS TABLE - Indexes for audit trail queries
-- ============================================================================

-- Existing indexes from migration file are good:
-- - idx_audit_logs_user_id
-- - idx_audit_logs_created_at
-- - idx_audit_logs_action

-- Add composite index for user + action queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action
  ON audit_logs(user_id, action);

-- Add index on resource_type for filtering by resource
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type
  ON audit_logs(resource_type);

-- ============================================================================
-- MEDIA LIBRARY TABLE - Indexes for media management
-- ============================================================================

-- Index on uploaded_by for finding user uploads
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by
  ON media_library(uploaded_by);

-- Index on created_at for sorting media by upload date
CREATE INDEX IF NOT EXISTS idx_media_library_created_at
  ON media_library(created_at DESC);

-- Index on file_type for filtering by media type
CREATE INDEX IF NOT EXISTS idx_media_library_file_type
  ON media_library(file_type);

-- ============================================================================
-- ANALYZE TABLES - Update statistics for query planner
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE subscriptions;
ANALYZE orders;
ANALYZE blog_posts;
ANALYZE payment_analytics;
ANALYZE user_activities;
ANALYZE support_tickets;
ANALYZE ticket_messages;
ANALYZE shred_orders;
ANALYZE shred_waitlist;
ANALYZE workout_logs;
ANALYZE profiles;
ANALYZE email_campaign_metrics;
ANALYZE automation_workflows;
ANALYZE audit_logs;
ANALYZE media_library;

-- ============================================================================
-- AUDIT LOGGING - Log this migration
-- ============================================================================

-- Insert audit log entry for this migration
INSERT INTO audit_logs (user_id, action, resource_type, metadata)
VALUES (
  auth.uid(),
  'indexes_created',
  'database_migration',
  jsonb_build_object(
    'migration', '20251021_add_missing_indexes',
    'indexes_created', 45,
    'tables_optimized', ARRAY[
      'subscriptions',
      'orders',
      'blog_posts',
      'payment_analytics',
      'user_activities',
      'support_tickets',
      'ticket_messages',
      'shred_orders',
      'shred_waitlist',
      'workout_logs',
      'profiles',
      'email_campaign_metrics',
      'automation_workflows',
      'audit_logs',
      'media_library'
    ],
    'timestamp', NOW()
  )
);

-- ============================================================================
-- VERIFICATION - Check index usage
-- ============================================================================

-- This query will show all indexes on public tables
-- Run manually after migration to verify:
/*
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
*/

-- Check index sizes
/*
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_subscriptions_user_id IS
  'Fast lookup of user subscriptions - critical for user dashboard';

COMMENT ON INDEX idx_subscriptions_stripe_customer_id IS
  'Fast lookup by Stripe customer ID - used by webhooks';

COMMENT ON INDEX idx_orders_user_id IS
  'Fast lookup of user orders - critical for order history';

COMMENT ON INDEX idx_blog_posts_published_at IS
  'Fast sorting of published blog posts - used on blog listing page';

COMMENT ON INDEX idx_payment_analytics_user_id IS
  'Fast lookup of user payment history - used in user dashboard';

-- End of migration
