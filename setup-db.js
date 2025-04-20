import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase credentials
const supabaseUrl = 'https://jjmaxsmlrcizxfgucvzx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbWF4c21scmNpenhmZ3Vjdnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTQxMjIsImV4cCI6MjA1ODIzMDEyMn0.gl4BX2tyGkzby5mkDG0OHUkpa2qV5owYfEjJt0JZYWs';

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
