// This script synchronizes Stripe products and prices with Supabase
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is not set. Please set it before running this script.');
  process.exit(1);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables must be set before running this script.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function syncStripeProducts() {
  try {
    console.log('Starting Stripe product synchronization with Supabase...');
    
    // Retrieve all active products from Stripe
    const { data: stripeProducts } = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });

    console.log(`Found ${stripeProducts.length} active products in Stripe`);
    
    // For each product, retrieve all its prices
    for (const product of stripeProducts) {
      const { data: stripePrices } = await stripe.prices.list({
        product: product.id,
        active: true
      });
      
      console.log(`Product: ${product.name} has ${stripePrices.length} prices`);
      
      // First, ensure the product exists in Supabase
      const { data: existingProduct, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('stripe_product_id', product.id)
        .single();
      
      let productId;
      
      if (productError || !existingProduct) {
        // Insert new product - removed image field to match existing schema
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            name: product.name,
            description: product.description || '',
            stripe_product_id: product.id,
            active: product.active,
            metadata: product.metadata
          })
          .select()
          .single();
        
        if (insertError) {
          console.error(`Error inserting product ${product.name}:`, insertError);
          continue;
        }
        
        productId = newProduct.id;
        console.log(`Created new product in Supabase: ${product.name}`);
      } else {
        // Update existing product - removed image field to match existing schema
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: product.name,
            description: product.description || '',
            active: product.active,
            metadata: product.metadata,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_product_id', product.id);
        
        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError);
          continue;
        }
        
        productId = existingProduct.id;
        console.log(`Updated existing product in Supabase: ${product.name}`);
      }
      
      // Now sync all prices for this product
      for (const price of stripePrices) {
        const interval = price.recurring ? price.recurring.interval : 'one-time';
        
        // Check if price exists
        const { data: existingPrice, error: priceError } = await supabase
          .from('prices')
          .select('*')
          .eq('stripe_price_id', price.id)
          .single();
        
        if (priceError || !existingPrice) {
          // Insert new price - removed metadata field to match existing schema
          const { error: insertPriceError } = await supabase
            .from('prices')
            .insert({
              product_id: productId,
              stripe_price_id: price.id,
              active: price.active,
              currency: price.currency,
              unit_amount: price.unit_amount,
              interval: interval
            });
          
          if (insertPriceError) {
            console.error(`Error inserting price for ${product.name}:`, insertPriceError);
            continue;
          }
          
          console.log(`Created new price in Supabase for ${product.name}: ${price.unit_amount/100} ${price.currency} (${interval})`);
        } else {
          // Update existing price - removed metadata field to match existing schema
          const { error: updatePriceError } = await supabase
            .from('prices')
            .update({
              active: price.active,
              unit_amount: price.unit_amount,
              interval: interval,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_price_id', price.id);
          
          if (updatePriceError) {
            console.error(`Error updating price for ${product.name}:`, updatePriceError);
            continue;
          }
          
          console.log(`Updated existing price in Supabase for ${product.name}: ${price.unit_amount/100} ${price.currency} (${interval})`);
        }
      }
    }
    
    console.log('Stripe product synchronization completed successfully.');
  } catch (error) {
    console.error('Error synchronizing Stripe products:', error);
  }
}

// Run the sync function
syncStripeProducts()
  .then(() => {
    console.log('Synchronization completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Synchronization failed:', error);
    process.exit(1);
  });
