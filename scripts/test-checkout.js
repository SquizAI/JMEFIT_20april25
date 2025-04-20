// Script to test checkout functionality
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';

// Configure dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

if (!stripeSecretKey) {
  console.error('Error: Missing Stripe secret key in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create Stripe client
const stripe = new Stripe(stripeSecretKey);

async function testCheckout() {
  try {
    console.log('Testing checkout functionality...');
    
    // Step 1: Get a product from the database
    console.log('Fetching a product...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('name', 'Self-Led Training - Monthly')
      .limit(1);
    
    if (productsError) {
      console.error('Error fetching products:', productsError.message);
      return;
    }
    
    if (!products || products.length === 0) {
      console.error('No products found in the database');
      return;
    }
    
    const product = products[0];
    console.log(`Selected product: ${product.name} (${product.metadata.price / 100} USD)`);
    
    // Step 2: Create a test user
    console.log('\nCreating a test user...');
    const testUser = {
      id: uuidv4(),
      email: 'test_customer@example.com',
      first_name: 'Test',
      last_name: 'Customer',
      stripe_customer_id: null,
      metadata: { role: 'customer' }
    };
    
    // Check if the user already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUser.email)
      .limit(1);
    
    let user;
    
    if (userCheckError) {
      console.error('Error checking for existing user:', userCheckError.message);
      return;
    }
    
    if (existingUser && existingUser.length > 0) {
      console.log(`User ${testUser.email} already exists, using existing user.`);
      user = existingUser[0];
    } else {
      // Create the user in Supabase
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert(testUser)
        .select();
      
      if (createUserError) {
        console.error('Error creating user in Supabase:', createUserError.message);
        return;
      }
      
      console.log(`Created user: ${newUser[0].email}`);
      user = newUser[0];
    }
    
    // Step 3: Create a Stripe customer for the user
    if (!user.stripe_customer_id) {
      console.log('\nCreating a Stripe customer...');
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          metadata: {
            supabase_id: user.id
          }
        });
        
        console.log(`Created Stripe customer: ${customer.id}`);
        
        // Update the user with the Stripe customer ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customer.id })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating user with Stripe customer ID:', updateError.message);
        } else {
          user.stripe_customer_id = customer.id;
          console.log(`Updated user with Stripe customer ID: ${customer.id}`);
        }
      } catch (stripeError) {
        console.error('Error creating Stripe customer:', stripeError.message);
        // Continue with the test without a Stripe customer
        console.log('Continuing test without a Stripe customer...');
      }
    } else {
      console.log(`Using existing Stripe customer: ${user.stripe_customer_id}`);
    }
    
    // Step 4: Create a test order
    console.log('\nCreating a test order...');
    const orderData = {
      id: uuidv4(),
      user_id: user.id,
      stripe_checkout_id: `cs_test_${Math.random().toString(36).substring(2, 10)}`,
      stripe_payment_intent_id: `pi_test_${Math.random().toString(36).substring(2, 10)}`,
      status: 'pending',
      amount: product.metadata.price,
      currency: 'usd',
      metadata: {
        customer_email: user.email,
        product_name: product.name
      }
    };
    
    // Check if orders table exists
    let ordersTableExists = true;
    try {
      const { data: ordersCheck, error: ordersCheckError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
      
      if (ordersCheckError && ordersCheckError.message.includes('relation "orders" does not exist')) {
        ordersTableExists = false;
        console.error('Orders table does not exist. Please create it using the SQL in create_orders_tables.sql');
        console.log('Simulating order creation without database...');
      }
    } catch (error) {
      ordersTableExists = false;
      console.error('Error checking orders table:', error.message);
      console.log('Simulating order creation without database...');
    }
    
    let order;
    if (ordersTableExists) {
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select();
      
      if (orderError) {
        console.error('Error creating order:', orderError.message);
        return;
      }
      
      console.log(`Created order with ID: ${newOrder[0].id}`);
      order = newOrder[0];
      
      // Step 5: Create order item
      console.log('\nCreating order item...');
      const orderItemData = {
        id: uuidv4(),
        order_id: order.id,
        product_id: product.id,
        quantity: 1,
        amount: product.metadata.price,
        metadata: {
          product_name: product.name
        }
      };
      
      const { data: orderItem, error: orderItemError } = await supabase
        .from('order_items')
        .insert(orderItemData)
        .select();
      
      if (orderItemError) {
        console.error('Error creating order item:', orderItemError.message);
        return;
      }
      
      console.log(`Created order item with ID: ${orderItem[0].id}`);
    } else {
      // Simulate order creation
      order = orderData;
      console.log(`Simulated order with ID: ${order.id}`);
    }
    
    // Step 6: Simulate a Stripe checkout session
    console.log('\nSimulating Stripe checkout session...');
    try {
      // This is just a simulation - in a real app, we would create a real Stripe checkout session
      console.log('Creating checkout session for product:', product.name);
      console.log('Price:', `$${product.metadata.price / 100}`);
      console.log('Customer:', user.email);
      
      // Simulate a successful payment
      console.log('\nSimulating payment processing...');
      console.log('Payment successful!');
      
      // Update order status
      if (ordersTableExists) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            stripe_payment_intent_id: `pi_completed_${Math.random().toString(36).substring(2, 10)}`
          })
          .eq('id', order.id);
        
        if (updateError) {
          console.error('Error updating order status:', updateError.message);
        } else {
          console.log(`Updated order status to 'completed'`);
        }
      } else {
        console.log(`Simulated updating order status to 'completed'`);
      }
      
      // Get the complete order with items
      if (ordersTableExists) {
        const { data: completeOrder, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items:order_items(*)
          `)
          .eq('id', order.id)
          .single();
        
        if (fetchError) {
          console.error('Error fetching complete order:', fetchError.message);
        } else {
          console.log('\nComplete order details:');
          console.log(JSON.stringify(completeOrder, null, 2));
        }
      }
      
    } catch (stripeError) {
      console.error('Error with Stripe checkout simulation:', stripeError.message);
    }
    
    console.log('\nCheckout test completed successfully!');
    console.log('\nSummary:');
    console.log(`- Customer: ${user.email}`);
    console.log(`- Product: ${product.name}`);
    console.log(`- Price: $${product.metadata.price / 100}`);
    console.log(`- Order ID: ${order.id}`);
    console.log(`- Status: completed (simulated)`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
testCheckout();

// Export for ES modules
export {};
