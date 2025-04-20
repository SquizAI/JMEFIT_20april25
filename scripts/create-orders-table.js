// Script to create orders table for checkout functionality
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createOrdersTables() {
  try {
    console.log('Creating orders and order_items tables...');
    
    // Create orders and order_items tables with SQL query
    const { error: tableError } = await supabase.rpc('exec', { 
      query: `
        -- Create the orders table
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id),
          stripe_checkout_id TEXT,
          stripe_payment_intent_id TEXT,
          status TEXT NOT NULL,
          amount INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'usd',
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create the order_items table for products in each order
        CREATE TABLE IF NOT EXISTS order_items (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          product_id UUID REFERENCES products(id),
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price INTEGER NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for faster lookups
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_id ON orders(stripe_checkout_id);
        CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

        -- Create triggers to automatically update the updated_at column
        DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders;
        CREATE TRIGGER trigger_update_orders_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS trigger_update_order_items_updated_at ON order_items;
        CREATE TRIGGER trigger_update_order_items_updated_at
        BEFORE UPDATE ON order_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `
    });
    
    if (tableError) {
      if (tableError.message.includes('relation "orders" already exists')) {
        console.log('Orders tables already exist, skipping creation.');
      } else if (tableError.message.includes('function "exec" does not exist')) {
        console.error('Error: The exec function does not exist in your Supabase instance.');
        console.log('Please use the Supabase dashboard to run the SQL script manually.');
        return;
      } else {
        console.error('Error creating orders tables:', tableError.message);
        return;
      }
    } else {
      console.log('Orders and order_items tables created successfully!');
    }
    
    console.log('Database setup for checkout functionality is complete!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
createOrdersTables();

// Export for ES modules
export {};
