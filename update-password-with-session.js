import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjmaxsmlrcizxfgucvzx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbWF4c21scmNpenhmZ3Vjdnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTQxMjIsImV4cCI6MjA1ODIzMDEyMn0.gl4BX2tyGkzby5mkDG0OHUkpa2qV5owYfEjJt0JZYWs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePasswordWithRecoveryToken() {
  try {
    console.log('🔄 Setting session with recovery token...');
    
    // Set the session using the tokens from the URL
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: 'eyJhbGciOiJIUzI1NiIsImtpZCI6Im9hWmE5QUo5azVaMldldk0iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2pqbWF4c21scmNpenhmZ3Vjdnp4LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlNzQyZjlhNC02OTk4LTRjOTUtOTY1Ny05NDY1ZjM0ZDM3NTIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyMDIwNTA0LCJpYXQiOjE3NTIwMTY5MDQsImVtYWlsIjoiam1lQGptZWZpdC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJSGcyNEdNSEZvcXBTZEFXRjJOQzhsVWNOUW03MXgzb1BpRGp2ODN2Vm81dXdndkE9czk2LWMiLCJlbWFpbCI6ImptZUBqbWVmaXQuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkphaW1lIFRoYXJwZSIsImlzX2FkbWluIjp0cnVlLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiSmFpbWUgVGhhcnBlIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSUhnMjRHTUhGb3FwU2RBV0YyTkM4bFVjTlFtNzF4M29QaURqdjgzdlZvNXV3Z3ZBPXM5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMDc3MTk3Nzk0NTQxMzk1ODI3NzkiLCJzdWIiOiIxMDc3MTk3Nzk0NTQxMzk1ODI3NzkifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvdHAiLCJ0aW1lc3RhbXAiOjE3NTIwMTY5MDR9XSwic2Vzc2lvbl9pZCI6IjVmZmNmMDdjLWJkY2EtNDFhOS1iOGQwLTM1NmJhYjc5YzU3NSIsImlzX2Fub255bW91cyI6ZmFsc2V9.-nHHHqygv6H2tFoqa0CDB9jS7dJlLMm1FiZquh8SLLY',
      refresh_token: '3uspboeb5mg3'
    });

    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }

    console.log('✅ Session set successfully!');
    console.log('👤 User:', sessionData.user.email);
    console.log('🔧 Admin status:', sessionData.user.user_metadata.is_admin);

    // Now update the password
    console.log('🔄 Updating password...');
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: 'G0dh@$m3!'
    });

    if (updateError) {
      console.error('❌ Password update error:', updateError.message);
      return;
    }

    console.log('🎉 Password updated successfully!');
    console.log('✅ Admin user jme@jmefit.com can now login with: G0dh@$m3!');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the function
updatePasswordWithRecoveryToken(); 