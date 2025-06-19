#!/usr/bin/env node

/**
 * Direct Stripe to Supabase Sync Script
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
  console.log('Starting Stripe to Supabase sync...');
  
  try {
    // Fetch all active products from Stripe
    const stripeProducts = await stripe.products.list({
      active: true,
      limit: 100,
    });
    
    console.log(`Found ${stripeProducts.data.length} products in Stripe`);
    const productsProcessed = [];
    
    // Process each product
    for (const product of stripeProducts.data) {
      console.log(`Processing product: ${product.id} (${product.name})`);
      
      // Check if product exists in Supabase - handle potential duplicates
      const { data: existingProducts, error: queryError } = await supabase
        .from('products')
        .select('*')
        .eq('stripe_product_id', product.id);
      
      if (queryError) {
        console.error(`Error querying product ${product.id}:`, queryError);
        continue;
      }
      
      // Handle potential duplicates
      if (existingProducts && existingProducts.length > 1) {
        console.log(`Found ${existingProducts.length} duplicate entries for product ${product.id}, cleaning up...`);
        
        // Keep the first one, delete the rest
        const keepId = existingProducts[0].id;
        for (let i = 1; i < existingProducts.length; i++) {
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', existingProducts[i].id);
          
          if (deleteError) {
            console.error(`Error deleting duplicate product ${existingProducts[i].id}:`, deleteError);
          } else {
            console.log(`Deleted duplicate product with ID ${existingProducts[i].id}`);
          }
        }
      }
      
      const existingProduct = existingProducts && existingProducts.length > 0 ? existingProducts[0] : null;
      
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
      
      productsProcessed.push({
        id: product.id,
        name: product.name,
        action: existingProduct ? 'updated' : 'created'
      });
      
      // Fetch prices for this product
      const stripePrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });
      
      console.log(`Found ${stripePrices.data.length} prices for product ${product.name}`);
      const pricesProcessed = [];
      
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
        
        // Check if price exists in Supabase - handle potential duplicates
        const { data: existingPrices, error: priceQueryError } = await supabase
          .from('prices')
          .select('*')
          .eq('stripe_price_id', price.id);
        
        if (priceQueryError) {
          console.error(`Error querying price ${price.id}:`, priceQueryError);
          continue;
        }
        
        // Handle potential duplicates
        if (existingPrices && existingPrices.length > 1) {
          console.log(`Found ${existingPrices.length} duplicate entries for price ${price.id}, cleaning up...`);
          
          // Keep the first one, delete the rest
          const keepId = existingPrices[0].id;
          for (let i = 1; i < existingPrices.length; i++) {
            const { error: deleteError } = await supabase
              .from('prices')
              .delete()
              .eq('id', existingPrices[i].id);
            
            if (deleteError) {
              console.error(`Error deleting duplicate price ${existingPrices[i].id}:`, deleteError);
            } else {
              console.log(`Deleted duplicate price with ID ${existingPrices[i].id}`);
            }
          }
        }
        
        const existingPrice = existingPrices && existingPrices.length > 0 ? existingPrices[0] : null;
        
        // Get the Supabase product ID for this Stripe product ID
        const { data: productData, error: productQueryError } = await supabase
          .from('products')
          .select('id')
          .eq('stripe_product_id', price.product)
          .single();
        
        if (productQueryError) {
          console.error(`Error getting Supabase product ID for Stripe product ${price.product}:`, productQueryError);
          continue;
        }
        
        if (!productData || !productData.id) {
          console.error(`Could not find Supabase product ID for Stripe product ${price.product}`);
          continue;
        }
        
        const priceData = {
          product_id: productData.id, // Use the Supabase product ID
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
        
        pricesProcessed.push({
          id: price.id,
          product_id: price.product,
          amount: price.unit_amount/100,
          currency: price.currency,
          interval,
          action: existingPrice ? 'updated' : 'created'
        });
      }
      
      // Add the processed prices to the response
      productsProcessed[productsProcessed.length - 1].prices = pricesProcessed;
    }
    
    console.log('Sync completed successfully!');
    console.log(`Processed ${productsProcessed.length} products`);
    
    // Count total prices processed
    let totalPrices = 0;
    for (const product of productsProcessed) {
      totalPrices += product.prices ? product.prices.length : 0;
    }
    console.log(`Processed ${totalPrices} prices`);
    
    return {
      success: true,
      productsProcessed,
      totalProducts: productsProcessed.length,
      totalPrices
    };
  } catch (error) {
    console.error('Error during sync:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the sync
syncProducts();
