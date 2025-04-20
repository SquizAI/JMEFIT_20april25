import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  try {
    console.log('Checking Supabase database schema...');
    console.log(`Supabase URL: ${supabaseUrl}`);
    
    // Get list of all tables
    console.log('\n--- Trying to get list of tables ---');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error getting tables:', tablesError);
    } else {
      console.log('Available tables:', tablesData?.map(t => t.table_name).join(', ') || 'None');
    }
    
    // Try to access specific tables we're interested in
    console.log('\n--- Trying to access products table ---');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('Error accessing products table:', productsError);
      console.log('Products table likely does not exist or you do not have permissions.');
    } else {
      console.log('Products table exists. Sample data:', productsData);
    }
    
    // List all permissions we have
    console.log('\n--- Checking user permissions ---');
    const { data: permissionsData, error: permissionsError } = await supabase
      .rpc('get_my_claims');
    
    if (permissionsError) {
      console.error('Error checking permissions:', permissionsError);
    } else {
      console.log('Your permissions:', permissionsData);
    }
    
    console.log('\nTo create the products table, please use the SQL script at:');
    console.log('sql/create_products_table.sql');
    console.log('Copy this script and run it in the Supabase Dashboard SQL Editor.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkDatabaseSchema();
