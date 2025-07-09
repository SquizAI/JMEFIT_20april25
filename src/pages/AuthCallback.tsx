import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Process the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // The hash contains the access token from the OAuth provider
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          navigate('/auth?error=Authentication failed');
          return;
        }

        if (!session?.user) {
          navigate('/auth?error=No user session found');
          return;
        }

        // Check if this is an admin login attempt
        const isAdminLogin = searchParams.get('admin') === 'true';
        const isAdmin = session.user.user_metadata?.is_admin === true || session.user.user_metadata?.role === 'admin';

        if (isAdminLogin) {
          if (isAdmin) {
            // Redirect admin users to admin dashboard
            navigate('/admin');
          } else {
            // Non-admin user tried to access admin login
            navigate('/admin/login?error=Unauthorized access');
          }
        } else {
          // Regular user login - redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        navigate('/auth?error=Unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

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
