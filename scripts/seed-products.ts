// Seed script to populate Supabase and Stripe with initial products
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';

// Load environment variables from .env file
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !stripeSecretKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Stripe
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as const // Using correct API version
});

// Define types for our product
type ProductData = {
  name: string;
  description: string;
  active: boolean;
  image_url: string | null;
  metadata: Record<string, any>;
};

// Sample product data
const products: ProductData[] = [
  {
    name: 'Premium Membership',
    description: 'Access to all premium features and content',
    active: true,
    image_url: 'https://example.com/images/premium.jpg',
    metadata: {
      type: 'subscription',
      duration: 'monthly'
    }
  },
  {
    name: 'Pro Membership',
    description: 'Advanced features for professional users',
    active: true,
    image_url: 'https://example.com/images/pro.jpg',
    metadata: {
      type: 'subscription',
      duration: 'annual'
    }
  },
  {
    name: 'Basic Package',
    description: 'Essential features for new users',
    active: true,
    image_url: 'https://example.com/images/basic.jpg',
    metadata: {
      type: 'one-time',
      level: 'beginner'
    }
  }
];

/**
 * Create product in Stripe and return the Stripe product ID
 */
async function createProductInStripe(product: ProductData): Promise<string> {
  try {
    // Format metadata for Stripe (convert objects to string values)
    const stripeMetadata: Record<string, string> = {};
    if (product.metadata && typeof product.metadata === 'object') {
      Object.entries(product.metadata).forEach(([key, value]) => {
        if (typeof value === 'string') {
          stripeMetadata[key] = value;
        } else if (value !== null && value !== undefined) {
          stripeMetadata[key] = String(value);
        }
      });
    }
    
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      active: product.active,
      images: product.image_url ? [product.image_url] : [],
      metadata: stripeMetadata
    });
    
    console.log(`Created Stripe product: ${stripeProduct.id}`);
    return stripeProduct.id;
  } catch (error: any) {
    console.error('Error creating product in Stripe:', error.message);
    throw error;
  }
}

/**
 * Create product in Supabase database
 */
async function createProductInDatabase(product: ProductData, stripeProductId: string) {
  try {
    console.log('Inserting product into database:', product.name);
    
    // Get the database schema first to understand table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('products')
      .select('id') // Just trying to see if this table exists and we can access it
      .limit(1);
      
    if (tableError) {
      console.error('Error accessing products table:', tableError);
      throw new Error(`Cannot access products table: ${tableError.message}`);
    }
    
    // Prepare the insert object - minimal required fields first
    const insertData: Record<string, any> = {
      name: product.name,
      description: product.description,
      stripe_product_id: stripeProductId
    };
    
    // Add optional fields
    if (product.active !== undefined) insertData.active = product.active;
    if (product.image_url) insertData.image_url = product.image_url;
    if (product.metadata) insertData.metadata = product.metadata;
    
    console.log('Inserting data:', insertData);
    
    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      // Log detailed error information
      console.error('Database error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log(`Created database product: ${data?.id}`);
    return data || null;
  } catch (error: any) {
    console.error('Error creating product in database:', error.message || 'Unknown error');
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Create the products table if it doesn't exist
 */
async function ensureProductsTable() {
  console.log('Checking and creating products table if needed...');
  
  try {
    // Try to access the products table
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);
      
    if (error && error.code === '42P01') { // Table doesn't exist error code
      console.log('Products table does not exist, attempting to create it...');
      
      // Execute raw SQL to create the table
      const { error: createError } = await supabase
        .rpc('create_products_table', {
          sql_command: `
            CREATE TABLE IF NOT EXISTS products (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              description TEXT,
              stripe_product_id TEXT,
              active BOOLEAN DEFAULT TRUE,
              image_url TEXT,
              metadata JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });
      
      if (createError) {
        console.error('Error creating products table:', createError);
        
        // Try direct creation using a simpler approach
        console.log('Attempting alternative products table creation...');
        
        // Create through direct insert with minimal required fields
        const { error: insertError } = await supabase.from('products').insert({
          id: 'temp-id',
          name: 'Temporary Product',
          description: 'A temporary product used to initialize the products table',
          active: false
        });
        
        if (insertError && insertError.code !== '23505') { // Not duplicate key error
          console.error('Alternative creation failed:', insertError);
          return false;
        }
        
        return true; // Table was created
      }
      
      console.log('Products table created successfully!');
      return true;
    } else if (error) {
      console.error('Error checking products table:', error);
      return false;
    }
    
    console.log('Products table already exists. Existing products:', data?.length || 0);
    return true;
  } catch (error) {
    console.error('Error accessing database:', error);
    return false;
  }
}

/**
 * Main function to seed products
 */
async function seedProducts() {
  console.log('Starting product seeding...');
  console.log('Connected to Supabase:', supabaseUrl);
  
  // Ensure the products table exists
  const tableExists = await ensureProductsTable();
  if (!tableExists) {
    console.error('Could not create or access the products table. Please check your database permissions.');
    return;
  }
  
  try {
    for (const product of products) {
      // First create in Stripe
      const stripeProductId = await createProductInStripe(product);
      
      // Then create in Supabase with the Stripe ID
      await createProductInDatabase(product, stripeProductId);
      
      console.log(`Successfully created product: ${product.name}`);
    }
    
    console.log('Product seeding completed successfully!');
  } catch (error: any) {
    console.error('Seeding failed:', error);
  }
}

// Run the seed function
seedProducts();
