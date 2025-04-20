// Script to create users table and add sample users
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

async function createUsersTable() {
  try {
    console.log('Creating users table...');
    
    // Create users table with SQL query
    const { error: tableError } = await supabase.rpc('exec', { 
      query: `
        -- Enable UUID extension if not already enabled
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Create the users table
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          first_name TEXT,
          last_name TEXT,
          stripe_customer_id TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create an index on email for faster lookups
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        -- Create an index on stripe_customer_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

        -- Create a function to update the updated_at timestamp if it doesn't exist
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create a trigger to automatically update the updated_at column
        DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
        CREATE TRIGGER trigger_update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `
    });
    
    if (tableError) {
      if (tableError.message.includes('relation "users" already exists')) {
        console.log('Users table already exists, skipping creation.');
      } else if (tableError.message.includes('function "exec" does not exist')) {
        console.error('Error: The exec function does not exist in your Supabase instance.');
        console.log('Please use the Supabase dashboard to run the SQL script manually.');
        return;
      } else {
        console.error('Error creating users table:', tableError.message);
        return;
      }
    } else {
      console.log('Users table created successfully!');
    }
    
    // Add sample users
    const sampleUsers = [
      {
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        stripe_customer_id: 'cus_sample1',
        metadata: { role: 'customer' }
      },
      {
        email: 'user2@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        stripe_customer_id: 'cus_sample2',
        metadata: { role: 'customer' }
      },
      {
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        stripe_customer_id: 'cus_admin',
        metadata: { role: 'admin' }
      }
    ];
    
    console.log('Adding sample users...');
    const { data: insertedUsers, error: insertError } = await supabase
      .from('users')
      .upsert(sampleUsers, { onConflict: 'email' })
      .select();
    
    if (insertError) {
      console.error('Error adding sample users:', insertError.message);
      return;
    }
    
    console.log(`${insertedUsers.length} sample users added/updated successfully!`);
    
    // Verify by getting all users
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError.message);
      return;
    }
    
    console.log(`\nTotal users in database: ${allUsers.length}`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
createUsersTable();

// Export for ES modules
export {};
