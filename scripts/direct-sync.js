#!/usr/bin/env node

/**
 * Direct Stripe to Supabase Sync Script
 * This script uses the stripe_jmefit MCP server to sync products and prices directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fetch from 'node-fetch';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are not set in your .env file');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncProducts() {
  console.log('Starting direct Stripe to Supabase sync using stripe_jmefit MCP...');
  
  try {
    // Use the stripe_jmefit MCP to get products
    console.log('Fetching products from Stripe...');
    const productsResponse = await fetch('https://api.cascade.io/mcp/stripe_jmefit/list_products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 100
      })
    });
    
    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
    }
    
    const products = await productsResponse.json();
    console.log(`Found ${products.length} products in Stripe`);
    
    // Process each product
    for (const product of products) {
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
      console.log(`Fetching prices for product ${product.name}...`);
      const pricesResponse = await fetch('https://api.cascade.io/mcp/stripe_jmefit/list_prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: product.id,
          limit: 100
        })
      });
      
      if (!pricesResponse.ok) {
        console.error(`Failed to fetch prices for product ${product.id}: ${pricesResponse.statusText}`);
        continue;
      }
      
      const prices = await pricesResponse.json();
      console.log(`Found ${prices.length} prices for product ${product.name}`);
      
      // Process each price
      for (const price of prices) {
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
