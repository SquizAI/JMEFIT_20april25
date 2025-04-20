import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Process the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // The hash contains the access token from the OAuth provider
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          navigate('/auth?error=Authentication failed');
          return;
        }
        
        // Redirect to dashboard on success
        navigate('/dashboard');
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        navigate('/auth?error=Unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin mb-4">
        <Loader className="w-12 h-12 text-jme-purple" />
      </div>
      <h2 className="text-xl font-medium text-gray-700">Completing sign in...</h2>
      <p className="text-gray-500 mt-2">Please wait while we authenticate you.</p>
    </div>
  );
}

export default AuthCallback;
