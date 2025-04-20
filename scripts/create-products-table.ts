import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Check for environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function createProductsTable() {
  try {
    console.log('Creating products table...');
    
    // Get current file directory in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // SQL for creating products table
    const sql = `
      -- Create the products table if it doesn't exist
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

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_products_stripe_id ON products(stripe_product_id);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
    `;
    
    // Execute SQL using Postgres RPC
    console.log('Executing SQL...');
    
    // Use the direct REST API to execute SQL - requires FULL Postgres access
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    
    // Since we've already checked for undefined supabaseKey at the beginning,
    // we can assert it's not undefined here
    if (supabaseKey) {
      headers.append('apikey', supabaseKey);
      headers.append('Authorization', `Bearer ${supabaseKey}`);
    }
    
    headers.append('Prefer', 'resolution=merge-duplicates');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error executing SQL:', errorText);
      
      // Try alternative approach with direct table creation
      console.log('Trying alternative approach with direct table creation...');
      
      // Try to create a test product to see if it creates the table automatically
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: 'Test Product',
          description: 'A test product',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Error with alternative approach:', error);
        console.log('\nPlease use the Supabase Dashboard to run the SQL script at:');
        console.log('sql/create_products_table.sql');
      } else {
        console.log('Successfully created products table and inserted test product!');
        console.log('Test product:', data);
      }
      
      return;
    }
    
    const result = await response.json();
    console.log('SQL executed successfully:', result);
    
    // Verify that the table was created
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error verifying table creation:', error);
    } else {
      console.log('Products table created successfully!');
    }
  } catch (error) {
    console.error('Error creating products table:', error);
    console.log('\nPlease use the Supabase Dashboard to run the SQL script at:');
    console.log('sql/create_products_table.sql');
  }
}

// Run the function
createProductsTable();
