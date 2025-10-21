import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL script
const sqlScript = fs.readFileSync('db-setup.sql', 'utf8');

// Split the SQL script into individual statements
const statements = sqlScript
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .filter(stmt => stmt.trim() !== '');

// Execute each SQL statement
async function executeStatements() {
  console.log(`Executing ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      // Use the rpc method to execute SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      } else {
        console.log(`Statement ${i + 1} executed successfully:`, data);
      }
    } catch (err) {
      console.error(`Exception executing statement ${i + 1}:`, err.message);
    }
  }
  
  console.log('Database setup completed.');
}

executeStatements().catch(err => {
  console.error('Fatal error:', err);
});
