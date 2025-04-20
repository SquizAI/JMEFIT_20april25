// Script to clean up test products and keep only JmeFit products
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

async function cleanupProducts() {
  try {
    console.log('Cleaning up test products...');
    
    // Get all products
    const { data: allProducts, error: fetchError } = await supabase
      .from('products')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching products:', fetchError.message);
      return;
    }
    
    // Identify JmeFit products (those with names that match our naming pattern)
    const jmefitProductIds = allProducts
      .filter(product => 
        product.name.includes('Nutrition Only') ||
        product.name.includes('Nutrition & Training') ||
        product.name.includes('One-Time Macros') ||
        product.name.includes('Self-Led Training') ||
        product.name.includes('Trainer Feedback') ||
        product.name.includes('SHRED with JmeFit')
      )
      .map(product => product.id);
    
    console.log(`Found ${jmefitProductIds.length} JmeFit products to keep.`);
    
    // Delete all non-JmeFit products
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .not('id', 'in', jmefitProductIds);
    
    if (deleteError) {
      console.error('Error deleting test products:', deleteError.message);
      return;
    }
    
    console.log('Test products deleted successfully.');
    
    // Verify the cleanup
    const { data: remainingProducts, error: verifyError } = await supabase
      .from('products')
      .select('*');
    
    if (verifyError) {
      console.error('Error verifying products:', verifyError.message);
      return;
    }
    
    console.log(`\nTotal products in database after cleanup: ${remainingProducts.length}`);
    console.log('Remaining product names:');
    remainingProducts.forEach(product => {
      const price = product.metadata?.price 
        ? `$${(product.metadata.price / 100).toFixed(2)}` 
        : 'Price not set';
      console.log(`- ${product.name} (${price})`);
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
cleanupProducts();

// Export for ES modules
export {};
