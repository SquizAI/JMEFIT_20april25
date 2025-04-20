// Script to check if the products table exists and display its structure
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

async function checkProductsTable() {
  try {
    console.log('Checking products table...');
    
    // Query to check if the products table exists
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing products table:', error.message);
      return;
    }
    
    console.log('Products table exists!');
    console.log('Current number of records:', Array.isArray(data) ? data.length : 0);
    
    // Get table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'products' });
    
    if (tableError) {
      console.log('Could not get table structure. Creating custom query...');
      
      // Alternative: Create a custom SQL query to get table structure
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'products')
        .eq('table_schema', 'public');
      
      if (columnsError) {
        console.error('Error getting table structure:', columnsError.message);
        return;
      }
      
      console.log('\nTable structure:');
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
    } else {
      console.log('\nTable structure:', tableInfo);
    }
    
    console.log('\nProducts table is ready to use!');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the check
checkProductsTable();

// Export for ES modules
export {};
