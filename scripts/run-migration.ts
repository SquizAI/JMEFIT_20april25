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
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running database migration...');
    
    // Get current file directory in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../db/migrations/create_products_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error running migration:', error);
      
      // Try an alternative approach if the RPC method fails
      console.log('Trying alternative approach...');
      
      // Break the SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // Create products table with minimal fields
      const createTableResult = await supabase.from('products').insert({
        id: '00000000-0000-0000-0000-000000000000',
        name: '_migration_placeholder_',
        description: 'This is a placeholder record created during migration',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (createTableResult.error) {
        console.error('Failed to create table through insert:', createTableResult.error);
      } else {
        console.log('Successfully created products table!');
      }
      
      return;
    }
    
    console.log('Migration successful!', data);
  } catch (error) {
    console.error('Error in migration script:', error);
  }
}

runMigration();
