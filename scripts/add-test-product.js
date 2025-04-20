// Script to add a test product directly to the Supabase database
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

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

async function addTestProduct() {
  try {
    console.log('Adding test product to database...');
    
    // Create a test product
    const testProduct = {
      id: uuidv4(),
      name: 'Test Product',
      description: 'This is a test product created via direct database access',
      image_url: 'https://example.com/test-product.jpg',
      stripe_product_id: 'test_stripe_id_' + Date.now(),
      active: true,
      metadata: {
        testKey: 'testValue',
        category: 'test'
      }
    };
    
    // Insert the test product into the database
    const { data, error } = await supabase
      .from('products')
      .insert(testProduct)
      .select();
    
    if (error) {
      console.error('Error adding test product:', error.message);
      return;
    }
    
    console.log('Test product added successfully:');
    console.log(JSON.stringify(data, null, 2));
    
    // Verify by getting all products
    const { data: allProducts, error: fetchError } = await supabase
      .from('products')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching products:', fetchError.message);
      return;
    }
    
    console.log(`\nTotal products in database: ${allProducts.length}`);
    console.log('All products:');
    console.log(JSON.stringify(allProducts, null, 2));
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
addTestProduct();

// Export for ES modules
export {};
