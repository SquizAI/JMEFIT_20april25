-- Migration: Create Products Table
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

-- Add comment to describe the table
COMMENT ON TABLE products IS 'Stores product information synchronized with Stripe';
