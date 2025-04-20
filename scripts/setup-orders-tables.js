// Script to set up orders and order_items tables using Supabase client
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

async function setupOrdersTables() {
  try {
    console.log('Setting up orders and order_items tables...');
    
    // Check if orders table exists
    const { data: ordersCheck, error: ordersCheckError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersCheckError && ordersCheckError.message.includes('relation "orders" does not exist')) {
      console.log('Orders table does not exist. Creating it through the Supabase dashboard...');
      console.log('Please run the following SQL in your Supabase dashboard SQL editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  stripe_checkout_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_id ON orders(stripe_checkout_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  amount INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
      `);
    } else {
      console.log('Orders table already exists.');
    }
    
    // Let's create a test order using the Supabase client
    console.log('Creating a test order...');
    
    // First, get a product to use in our test order
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('Error fetching products:', productsError.message);
      return;
    }
    
    if (!products || products.length === 0) {
      console.error('No products found in the database');
      return;
    }
    
    const testProduct = products[0];
    
    // Get a user to associate with the order
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    let userId = null;
    
    if (usersError || !users || users.length === 0) {
      console.log('No users found. Creating a test user...');
      
      // Create a test user in the auth.users table
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'password123',
        email_confirm: true
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError.message);
        console.log('Will try to create a user in the users table directly...');
        
        // Try to create a user in the users table directly
        const { data: newUser, error: newUserError } = await supabase
          .from('users')
          .insert({
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            stripe_customer_id: 'cus_test',
            metadata: { role: 'customer' }
          })
          .select();
        
        if (newUserError) {
          console.error('Error creating user:', newUserError.message);
          console.log('Will use a dummy user ID for testing...');
          userId = '00000000-0000-0000-0000-000000000000';
        } else {
          userId = newUser[0].id;
          console.log(`Created test user with ID: ${userId}`);
        }
      } else {
        userId = authUser.user.id;
        console.log(`Created auth user with ID: ${userId}`);
        
        // Also create a record in the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            stripe_customer_id: 'cus_test',
            metadata: { role: 'customer' }
          });
        
        if (profileError) {
          console.error('Error creating user profile:', profileError.message);
        }
      }
    } else {
      userId = users[0].id;
      console.log(`Using existing user with ID: ${userId}`);
    }
    
    // Create a test order
    const orderData = {
      user_id: userId,
      stripe_checkout_id: 'cs_test_' + Math.random().toString(36).substring(2, 15),
      stripe_payment_intent_id: 'pi_test_' + Math.random().toString(36).substring(2, 15),
      status: 'pending',
      amount: testProduct.metadata.price || 1000,
      currency: 'usd',
      metadata: {
        customer_email: 'test@example.com',
        product_name: testProduct.name
      }
    };
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select();
    
    if (orderError) {
      if (orderError.message.includes('relation "orders" does not exist')) {
        console.error('Error: Orders table does not exist. Please run the SQL script in the Supabase dashboard.');
        return;
      } else {
        console.error('Error creating test order:', orderError.message);
        return;
      }
    }
    
    console.log(`Created test order with ID: ${order[0].id}`);
    
    // Create a test order item
    const orderItemData = {
      order_id: order[0].id,
      product_id: testProduct.id,
      quantity: 1,
      amount: testProduct.metadata.price || 1000,
      metadata: {
        product_name: testProduct.name
      }
    };
    
    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert(orderItemData)
      .select();
    
    if (orderItemError) {
      if (orderItemError.message.includes('relation "order_items" does not exist')) {
        console.error('Error: Order_items table does not exist. Please run the SQL script in the Supabase dashboard.');
        return;
      } else {
        console.error('Error creating test order item:', orderItemError.message);
        return;
      }
    }
    
    console.log(`Created test order item with ID: ${orderItem[0].id}`);
    
    // Fetch the complete order with its items
    const { data: completeOrder, error: completeOrderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('id', order[0].id)
      .single();
    
    if (completeOrderError) {
      console.error('Error fetching complete order:', completeOrderError.message);
      return;
    }
    
    console.log('\nTest Order Details:');
    console.log(JSON.stringify(completeOrder, null, 2));
    
    console.log('\nCheckout test completed successfully!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
setupOrdersTables();

// Export for ES modules
export {};
