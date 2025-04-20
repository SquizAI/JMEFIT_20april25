-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
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

-- Create prices table
CREATE TABLE IF NOT EXISTS public.prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stripe_price_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  currency TEXT DEFAULT 'usd',
  type TEXT DEFAULT 'one_time', -- 'one_time' or 'recurring'
  interval TEXT, -- 'month', 'year', etc. (for recurring prices)
  interval_count INTEGER DEFAULT 1,
  unit_amount INTEGER NOT NULL, -- in cents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  features JSONB,
  stripe_product_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_prices table
CREATE TABLE IF NOT EXISTS public.subscription_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  stripe_price_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  currency TEXT DEFAULT 'usd',
  interval TEXT NOT NULL, -- 'monthly', 'yearly', etc.
  unit_amount INTEGER NOT NULL, -- in cents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON public.prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_active ON public.prices(active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(active);
CREATE INDEX IF NOT EXISTS idx_subscription_prices_plan_id ON public.subscription_prices(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_prices_active ON public.subscription_prices(active);

-- Add sample product data
INSERT INTO public.products (name, description, active, metadata)
VALUES 
  ('Macros Calculation', 'Custom macros calculation based on your goals', TRUE, '{"product_type": "one-time"}'),
  ('SHRED Challenge', '8-week intensive fat loss program', TRUE, '{"product_type": "one-time"}');

-- Add sample subscription plans
INSERT INTO public.subscription_plans (name, description, features, active)
VALUES 
  ('Self-Led Training', 'Complete workout plans & exercise library', '["Personalized workout plans", "200+ exercise library", "Progress tracking", "Workout scheduling"]', TRUE),
  ('Trainer Feedback', 'Personal guidance & form checks', '["Form check video analysis", "Workout adaptations", "Direct messaging with trainers", "Regular progress reviews"]', TRUE),
  ('Nutrition Only', 'Custom nutrition plan, guidance & anytime support', '["Personalized meal plans", "Macro coaching", "Weekly check-ins", "Anytime access"]', TRUE),
  ('Nutrition & Training', 'Complete transformation package with nutrition and custom workouts', '["Everything in Nutrition Only", "Custom workout plans", "Form checks", "Progress tracking"]', TRUE);

-- Add sample prices for one-time products
INSERT INTO public.prices (product_id, unit_amount, type, active)
VALUES 
  ((SELECT id FROM public.products WHERE name = 'Macros Calculation'), 4999, 'one_time', TRUE),
  ((SELECT id FROM public.products WHERE name = 'SHRED Challenge'), 24900, 'one_time', TRUE);

-- Add sample subscription prices
INSERT INTO public.subscription_prices (subscription_plan_id, interval, unit_amount, active)
VALUES 
  ((SELECT id FROM public.subscription_plans WHERE name = 'Self-Led Training'), 'month', 1999, TRUE),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Self-Led Training'), 'year', 19190, TRUE),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Trainer Feedback'), 'month', 3499, TRUE),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Trainer Feedback'), 'year', 33590, TRUE),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Nutrition Only'), 'month', 9900, TRUE),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Nutrition Only'), 'year', 95040, TRUE),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Nutrition & Training'), 'month', 14900, TRUE),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Nutrition & Training'), 'year', 143040, TRUE);
