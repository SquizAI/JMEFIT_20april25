// This script creates an admin user in Supabase
// Run with: node scripts/create-admin-user.js

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using anon key for operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin user details
const adminEmail = 'jme@jmefit.com';
const adminPassword = 'Godwins2025##';
const adminDetails = {
  email: adminEmail,
  password: adminPassword,
  user_metadata: {
    full_name: 'JME Admin',
    is_admin: true
  },
  app_metadata: {
    role: 'admin'
  }
};

async function createAdminUser() {
  console.log('Creating admin user...');
  
  try {
    // Try to sign up the admin user
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: adminDetails.user_metadata
      }
    });
    
    if (error) {
      // If the error is that the user already exists, that's okay
      if (error.message.includes('already registered')) {
        console.log('Admin user already exists!');
        
        // Try to sign in to verify credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });
        
        if (signInError) {
          console.log('Admin exists but password may be different from provided one.');
          console.log('You may need to reset the password through the Supabase dashboard.');
        } else {
          console.log('Admin credentials are valid!');
        }
      } else {
        console.error('Error creating admin user:', error.message);
      }
      return;
    }
    
    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('User ID:', data.user?.id || 'Unknown');
    console.log('Note: You may need to verify the email address in Supabase dashboard');
    console.log('and manually set admin privileges if needed.');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the script
createAdminUser();
