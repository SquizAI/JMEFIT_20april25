-- Enable Row Level Security
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO '[JWT_SECRET_PLACEHOLDER]';

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_product_id TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  features JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription prices table
CREATE TABLE IF NOT EXISTS subscription_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  stripe_price_id TEXT NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year', 'week', 'day')),
  interval_count INTEGER DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  recurring BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  price_id UUID,
  stripe_price_id TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout logs table
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_type TEXT NOT NULL,
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SHRED waitlist table
CREATE TABLE IF NOT EXISTS shred_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  fitness_goals TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SHRED orders table
CREATE TABLE IF NOT EXISTS shred_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view for SHRED waitlist
CREATE OR REPLACE VIEW shred_waitlist_view AS
SELECT 
  sw.id,
  sw.email,
  sw.full_name,
  sw.phone,
  sw.fitness_goals,
  sw.created_at,
  CASE 
    WHEN so.id IS NOT NULL THEN true
    ELSE false
  END AS has_ordered
FROM shred_waitlist sw
LEFT JOIN shred_orders so ON sw.email = so.email;

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles: users can read and update only their own profiles
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Products: anyone can read products, only admins can modify
CREATE POLICY "Anyone can view products" 
  ON products FOR SELECT 
  USING (true);

-- Orders: users can view their own orders
CREATE POLICY "Users can view own orders" 
  ON orders FOR SELECT 
  USING (auth.uid() = user_id);

-- Order items: users can view their own order items
CREATE POLICY "Users can view own order items" 
  ON order_items FOR SELECT 
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Workouts: users can manage their own workout logs
CREATE POLICY "Users can manage own workout logs" 
  ON workout_logs FOR ALL 
  USING (auth.uid() = user_id);

-- Subscriptions: users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
  ON subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Create functions for admin access
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for all tables
CREATE POLICY "Admins can do anything with products"
  ON products FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do anything with subscription plans"
  ON subscription_plans FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do anything with subscription prices"
  ON subscription_prices FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all users"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all waitlist entries"
  ON shred_waitlist FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all shred orders"
  ON shred_orders FOR SELECT
  USING (is_admin());

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workout_logs_updated_at
  BEFORE UPDATE ON workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shred_orders_updated_at
  BEFORE UPDATE ON shred_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create prices table for one-time purchases
CREATE TABLE IF NOT EXISTS prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stripe_price_id TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on prices table
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Create policy for prices
CREATE POLICY "Anyone can view prices" 
  ON prices FOR SELECT 
  USING (true);

CREATE POLICY "Admins can do anything with prices"
  ON prices FOR ALL
  USING (is_admin());

-- Create trigger for prices
CREATE TRIGGER update_prices_updated_at
  BEFORE UPDATE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add sample data with Stripe integration focus
INSERT INTO products (name, description, stripe_product_id, active, metadata)
VALUES 
('Monthly App Subscription', 'Access to the JMEFit monthly app with daily workouts', 'prod_monthly_app', true, '{"type": "subscription"}'::jsonb),
('SHRED Challenge', '12-week intensive training program', 'prod_shred', true, '{"type": "program"}'::jsonb),
('1:1 Coaching', 'Personal coaching with Jaime', 'prod_coaching', true, '{"type": "service"}'::jsonb);

-- Add prices for products
INSERT INTO prices (product_id, stripe_price_id, price, active)
VALUES 
((SELECT id FROM products WHERE name = 'SHRED Challenge'), 'price_shred_standard', 149.99, true),
((SELECT id FROM products WHERE name = '1:1 Coaching'), 'price_coaching_standard', 299.99, true);

-- Add subscription plans with Stripe product IDs
INSERT INTO subscription_plans (name, description, features, stripe_product_id, active)
VALUES 
('Basic', 'Basic monthly app subscription', '["Daily workouts", "Progress tracking", "Community access"]'::jsonb, 'prod_basic_sub', true),
('Premium', 'Premium monthly app subscription', '["Daily workouts", "Progress tracking", "Community access", "Direct messaging", "Nutrition guide"]'::jsonb, 'prod_premium_sub', true);

-- Add subscription prices with Stripe price IDs
INSERT INTO subscription_prices (subscription_plan_id, stripe_price_id, interval, price, currency, active)
VALUES 
((SELECT id FROM subscription_plans WHERE name = 'Basic'), 'price_basic_monthly', 'month', 29.99, 'usd', true),
((SELECT id FROM subscription_plans WHERE name = 'Basic'), 'price_basic_yearly', 'year', 299.99, 'usd', true),
((SELECT id FROM subscription_plans WHERE name = 'Premium'), 'price_premium_monthly', 'month', 49.99, 'usd', true),
((SELECT id FROM subscription_plans WHERE name = 'Premium'), 'price_premium_yearly', 'year', 499.99, 'usd', true);
