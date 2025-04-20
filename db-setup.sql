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
INSERT INTO public.products (name, description, active)
VALUES 
  ('Macros Calculation', 'Custom macros calculation based on your goals', TRUE),
  ('Shred Challenge', '8-week intensive fat loss program', TRUE),
  ('Custom Workout Plan', 'Personalized workout plan tailored to your goals', TRUE);

-- Add sample prices for products
INSERT INTO public.prices (product_id, unit_amount, type)
VALUES 
  ((SELECT id FROM public.products WHERE name = 'Macros Calculation'), 4999, 'one_time'),
  ((SELECT id FROM public.products WHERE name = 'Shred Challenge'), 19999, 'one_time'),
  ((SELECT id FROM public.products WHERE name = 'Custom Workout Plan'), 14999, 'one_time');

-- Add sample subscription plans
INSERT INTO public.subscription_plans (name, description, features, active)
VALUES 
  ('Self-Led Program', 'Complete workout plans & exercise library', '["Personalized workout plans", "200+ exercise library", "Progress tracking", "Workout scheduling"]', TRUE),
  ('Trainer Feedback', 'Premium training with personal guidance', '["Form check video analysis", "Workout adaptations", "Direct messaging with trainers", "Regular progress reviews"]', TRUE);

-- Add sample subscription prices
INSERT INTO public.subscription_prices (subscription_plan_id, interval, unit_amount)
VALUES 
  ((SELECT id FROM public.subscription_plans WHERE name = 'Self-Led Program'), 'monthly', 1999),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Self-Led Program'), 'yearly', 19990),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Trainer Feedback'), 'monthly', 3499),
  ((SELECT id FROM public.subscription_plans WHERE name = 'Trainer Feedback'), 'yearly', 34990);
