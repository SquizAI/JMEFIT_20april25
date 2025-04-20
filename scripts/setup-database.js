// This script helps set up the database schema in Supabase
// Run with: node scripts/setup-database.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to create products table
const createProductsTableSQL = `
-- Create the products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  stripe_product_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on stripe_product_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id ON products(stripe_product_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`;

// SQL to create gift subscriptions table
const createGiftSubscriptionsTableSQL = `
-- Create the gift_subscriptions table
CREATE TABLE IF NOT EXISTS gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  purchaser_id UUID REFERENCES auth.users(id),
  recipient_first_name TEXT NOT NULL,
  recipient_last_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  gift_message TEXT,
  redemption_code TEXT UNIQUE NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  billing_interval TEXT NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_purchaser_id ON gift_subscriptions(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_recipient_email ON gift_subscriptions(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_redemption_code ON gift_subscriptions(redemption_code);

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS trigger_update_gift_subscriptions_updated_at ON gift_subscriptions;
CREATE TRIGGER trigger_update_gift_subscriptions_updated_at
BEFORE UPDATE ON gift_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`;

async function setupDatabase() {
  console.log('Setting up database schema...');
  
  try {
    // Execute SQL to create products table
    const { error: productsError } = await supabase.rpc('pgcrypto', { sql: createProductsTableSQL });
    
    if (productsError) {
      console.error('Error creating products table:', productsError.message);
      return;
    }
    
    console.log('Products table created successfully!');
    
    // Execute SQL to create gift subscriptions table
    const { error: giftError } = await supabase.rpc('pgcrypto', { sql: createGiftSubscriptionsTableSQL });
    
    if (giftError) {
      console.error('Error creating gift_subscriptions table:', giftError.message);
      return;
    }
    
    console.log('Gift subscriptions table created successfully!');
    
    // Check if tables were created
    const { data: productsData, error: productsTableError } = await supabase
      .from('products')
      .select('count(*)', { count: 'exact' })
      .limit(0);
      
    if (productsTableError) {
      console.error('Error verifying products table:', productsTableError.message);
      return;
    }
    
    const { data: giftData, error: giftTableError } = await supabase
      .from('gift_subscriptions')
      .select('count(*)', { count: 'exact' })
      .limit(0);
      
    if (giftTableError) {
      console.error('Error verifying gift_subscriptions table:', giftTableError.message);
      return;
    }
    
    console.log('Products table verified. Current count:', productsData?.count || 0);
    console.log('Gift subscriptions table verified. Current count:', giftData?.count || 0);
    console.log('Database setup complete!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the setup
setupDatabase();
