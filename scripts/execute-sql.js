// Script to execute SQL files directly on the Supabase database
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

// Get the SQL file path from command line arguments
const sqlFilePath = process.argv[2];
if (!sqlFilePath) {
  console.error('Error: Please provide the path to an SQL file');
  console.log('Usage: node execute-sql.js <path-to-sql-file>');
  process.exit(1);
}

async function executeSqlFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL content into individual statements
    // This is a simple implementation and may not work for all SQL files
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Execute the SQL statement using Supabase's REST API
        // Note: This is limited and may not work for all SQL statements
        const { error } = await supabase.rpc('exec', { query: stmt });
        
        if (error) {
          if (error.message.includes('function "exec" does not exist')) {
            console.error('Error: The exec function does not exist in your Supabase instance.');
            console.log('You may need to create this function or use the Supabase dashboard to run the SQL script manually.');
            break;
          } else if (error.message.includes('already exists')) {
            console.log(`Statement ${i + 1} skipped: Object already exists`);
          } else {
            console.error(`Error executing statement ${i + 1}:`, error.message);
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError);
      }
    }
    
    console.log('SQL execution completed');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Execute the SQL file
executeSqlFile(sqlFilePath);

// Export for ES modules
export {};
