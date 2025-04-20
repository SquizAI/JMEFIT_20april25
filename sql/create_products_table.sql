-- Create the products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_product_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_stripe_id ON products(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Optional: Add a sample product for testing
INSERT INTO products (name, description, active)
VALUES ('Sample Product', 'This is a sample product', true)
ON CONFLICT (id) DO NOTHING;
