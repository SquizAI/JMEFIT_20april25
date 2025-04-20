// Fix OAuth Redirect Configuration
// This script demonstrates the changes needed to fix OAuth redirects

/**
 * 1. In the Supabase Dashboard:
 * - Go to Project Settings > API
 * - Set the Site URL to: https://jmefit.com
 * - Set the Redirect URLs to include: https://jmefit.com/auth/callback
 * 
 * 2. In Google Cloud Console:
 * - Go to APIs & Services > Credentials
 * - Edit your OAuth 2.0 Client ID
 * - Add these Authorized redirect URIs:
 *   - https://jjmaxsmlrcizxfgucvzx.supabase.co/auth/v1/callback
 *   - https://jmefit.com/auth/callback
 * 
 * 3. In Supabase Auth Settings:
 * - Go to Authentication > URL Configuration
 * - Set Site URL to: https://jmefit.com
 * - Add Redirect URLs: https://jmefit.com/auth/callback
 */

// The getRedirectUrl function in your code looks correct:
function getRedirectUrl() {
  return window.location.hostname.includes('localhost')
    ? `${window.location.origin}/auth/callback`
    : `https://jmefit.com/auth/callback`;
}

// When using signInWithOAuth, make sure to use the redirect URL:
const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl() // This should redirect to https://jmefit.com/auth/callback in production
    }
  });
  
  if (error) {
    console.error('Error signing in with Google:', error);
  }
};

// After making these changes, rebuild and redeploy your application
console.log('Remember to update the configuration in Supabase Dashboard and Google Cloud Console');
