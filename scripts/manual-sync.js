#!/usr/bin/env node

/**
 * Manual Stripe to Supabase Sync Script
 * This script directly syncs products and prices from Stripe to Supabase
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize Stripe
const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('VITE_STRIPE_SECRET_KEY is not set in your .env file');
  process.exit(1);
}
const stripe = new Stripe(stripeSecretKey);

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are not set in your .env file');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncProducts() {
  console.log('Starting manual Stripe to Supabase sync...');
  
  try {
    // Fetch all active products from Stripe
    const stripeProducts = await stripe.products.list({
      active: true,
      limit: 100,
    });
    
    console.log(`Found ${stripeProducts.data.length} products in Stripe`);
    
    // Process each product
    for (const product of stripeProducts.data) {
      console.log(`Processing product: ${product.id} (${product.name})`);
      
      // Check if product exists in Supabase
      const { data: existingProduct, error: queryError } = await supabase
        .from('products')
        .select('*')
        .eq('stripe_product_id', product.id)
        .maybeSingle();
      
      if (queryError) {
        console.error(`Error querying product ${product.id}:`, queryError);
        continue;
      }
      
      const productData = {
        name: product.name,
        description: product.description,
        image_url: product.images && product.images.length > 0 ? product.images[0] : null,
        stripe_product_id: product.id,
        active: product.active,
        metadata: product.metadata || {}
      };
      
      if (!existingProduct) {
        // Insert new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        
        if (insertError) {
          console.error(`Error inserting product ${product.id}:`, insertError);
          continue;
        }
        console.log(`Created new product: ${product.name}`);
      } else {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('stripe_product_id', product.id);
        
        if (updateError) {
          console.error(`Error updating product ${product.id}:`, updateError);
          continue;
        }
        console.log(`Updated product: ${product.name}`);
      }
      
      // Fetch prices for this product
      const stripePrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });
      
      console.log(`Found ${stripePrices.data.length} prices for product ${product.name}`);
      
      // Process each price
      for (const price of stripePrices.data) {
        console.log(`Processing price: ${price.id} (${price.unit_amount/100} ${price.currency})`);
        
        // Determine the interval based on price data
        let interval = 'one-time';
        if (price.recurring) {
          interval = price.recurring.interval;
        } else if (product.name.toLowerCase().includes('month')) {
          interval = 'month';
        } else if (product.name.toLowerCase().includes('year')) {
          interval = 'year';
        }
        
        // Special case handling for specific products
        if (product.name === 'Self-Led Training Program') {
          const amount = price.unit_amount / 100;
          if (amount >= 15 && amount <= 30) {
            interval = 'month';
            console.log(`${product.name}: Setting $${amount} as monthly price`);
          } else if (amount >= 190 && amount <= 240) {
            interval = 'year';
            console.log(`${product.name}: Setting $${amount} as yearly price`);
          }
        } else if (product.name === 'Trainer Feedback Program') {
          const amount = price.unit_amount / 100;
          if (amount >= 30 && amount <= 50) {
            interval = 'month';
            console.log(`${product.name}: Setting $${amount} as monthly price`);
          } else if (amount >= 430 && amount <= 440) {
            interval = 'year';
            console.log(`${product.name}: Setting $${amount} as yearly price`);
          }
        }
        
        // Check if price exists in Supabase
        const { data: existingPrice, error: priceQueryError } = await supabase
          .from('prices')
          .select('*')
          .eq('stripe_price_id', price.id)
          .maybeSingle();
        
        if (priceQueryError) {
          console.error(`Error querying price ${price.id}:`, priceQueryError);
          continue;
        }
        
        const priceData = {
          product_id: price.product,
          active: price.active,
          unit_amount: price.unit_amount,
          currency: price.currency,
          interval,
          stripe_price_id: price.id
        };
        
        if (!existingPrice) {
          // Insert new price
          const { error: priceInsertError } = await supabase
            .from('prices')
            .insert([priceData]);
          
          if (priceInsertError) {
            console.error(`Error inserting price ${price.id}:`, priceInsertError);
            continue;
          }
          console.log(`Created new price: ${price.unit_amount/100} ${price.currency} (${interval})`);
        } else {
          // Update existing price
          const { error: priceUpdateError } = await supabase
            .from('prices')
            .update(priceData)
            .eq('stripe_price_id', price.id);
          
          if (priceUpdateError) {
            console.error(`Error updating price ${price.id}:`, priceUpdateError);
            continue;
          }
          console.log(`Updated price: ${price.unit_amount/100} ${price.currency} (${interval})`);
        }
      }
    }
    
    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Error during sync:', error);
  }
}

// Run the sync
syncProducts();
