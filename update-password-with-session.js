import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePasswordWithRecoveryToken() {
  try {
    // Get access token and refresh token from environment variables or command line args
    const accessToken = process.env.ACCESS_TOKEN || process.argv[2];
    const refreshToken = process.env.REFRESH_TOKEN || process.argv[3];
    const newPassword = process.env.NEW_PASSWORD || process.argv[4];

    if (!accessToken || !refreshToken || !newPassword) {
      console.error('ERROR: Missing required parameters:');
      console.error('Usage: node update-password-with-session.js <access_token> <refresh_token> <new_password>');
      console.error('Or set environment variables: ACCESS_TOKEN, REFRESH_TOKEN, NEW_PASSWORD');
      process.exit(1);
    }

    console.log('🔄 Setting session with recovery token...');

    // Set the session using the tokens from the URL
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }

    console.log('✅ Session set successfully!');
    console.log('👤 User:', sessionData.user.email);
    console.log('🔧 Admin status:', sessionData.user.user_metadata?.is_admin);

    // Now update the password
    console.log('🔄 Updating password...');
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('❌ Password update error:', updateError.message);
      return;
    }

    console.log('🎉 Password updated successfully!');
    console.log(`✅ User ${sessionData.user.email} can now login with the new password`);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the function
updatePasswordWithRecoveryToken(); 