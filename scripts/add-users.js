// Script to add users directly to the database
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

async function addUsers() {
  try {
    console.log('Checking if users table exists...');
    
    // Try to query the users table to see if it exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    // If the table doesn't exist, create it
    if (tableError && tableError.message.includes('relation "users" does not exist')) {
      console.log('Users table does not exist. Creating it...');
      
      // Create the users table
      const { error: createError } = await supabase.rpc('exec', { 
        query: `
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
          
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
        `
      });
      
      if (createError) {
        if (createError.message.includes('function "exec" does not exist')) {
          console.log('Cannot create table through API. Will try to insert users anyway...');
        } else {
          console.error('Error creating users table:', createError.message);
          console.log('Will try to insert users anyway...');
        }
      } else {
        console.log('Users table created successfully!');
      }
    } else {
      console.log('Users table already exists.');
    }
    
    // Sample users to add
    const sampleUsers = [
      {
        id: uuidv4(),
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        stripe_customer_id: 'cus_sample1',
        metadata: { role: 'customer' }
      },
      {
        id: uuidv4(),
        email: 'user2@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        stripe_customer_id: 'cus_sample2',
        metadata: { role: 'customer' }
      },
      {
        id: uuidv4(),
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        stripe_customer_id: 'cus_admin',
        metadata: { role: 'admin' }
      }
    ];
    
    console.log('Adding sample users...');
    
    // Try to insert the users
    const { data: insertedUsers, error: insertError } = await supabase
      .from('users')
      .insert(sampleUsers)
      .select();
    
    if (insertError) {
      if (insertError.message && insertError.message.includes('duplicate key value violates unique constraint')) {
        console.log('Some users already exist. Updating instead...');
        
        // Update existing users one by one
        for (const user of sampleUsers) {
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();
          
          if (checkError) {
            console.error(`Error checking user ${user.email}:`, checkError.message);
            continue;
          }
          
          if (existingUser) {
            // Update the existing user
            const { error: updateError } = await supabase
              .from('users')
              .update({
                first_name: user.first_name,
                last_name: user.last_name,
                stripe_customer_id: user.stripe_customer_id,
                metadata: user.metadata
              })
              .eq('id', existingUser.id);
            
            if (updateError) {
              console.error(`Error updating user ${user.email}:`, updateError.message);
            } else {
              console.log(`User ${user.email} updated successfully.`);
            }
          } else {
            // Insert the new user
            const { error: singleInsertError } = await supabase
              .from('users')
              .insert(user);
            
            if (singleInsertError) {
              console.error(`Error inserting user ${user.email}:`, singleInsertError.message);
            } else {
              console.log(`User ${user.email} inserted successfully.`);
            }
          }
        }
      } else {
        console.error('Error adding sample users:', insertError.message);
      }
    } else {
      console.log(`${insertedUsers.length} sample users added successfully!`);
    }
    
    // Verify by getting all users
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError.message);
      return;
    }
    
    console.log(`\nTotal users in database: ${allUsers.length}`);
    console.log('User emails:');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.first_name} ${user.last_name})`);
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
addUsers();

// Export for ES modules
export {};
