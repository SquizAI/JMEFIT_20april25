import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function CheckoutSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to home if user navigates here directly without completing checkout
  useEffect(() => {
    const hasCompletedCheckout = sessionStorage.getItem('checkoutCompleted');
    if (!hasCompletedCheckout) {
      navigate('/');
    }
    
    // Clear the checkout completed flag
    return () => {
      sessionStorage.removeItem('checkoutCompleted');
    };
  }, [navigate]);
  
  return (
    <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-md">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You for Your Purchase!</h1>
        <p className="text-lg text-gray-600">Your order has been successfully processed.</p>
      </div>
      
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-purple-800 mb-3">Order Details</h2>
        <p className="text-gray-700 mb-2">
          A confirmation email has been sent to {user?.email || 'your email address'}.
        </p>
        {user ? (
          <p className="text-gray-700">
            You can view your subscriptions and purchases in your <Link to="/dashboard" className="text-purple-600 hover:text-purple-800 underline">dashboard</Link>.
          </p>
        ) : (
          <p className="text-gray-700">
            Create an account to manage your subscriptions and access your purchases.
          </p>
        )}
      </div>
      
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Gift Subscriptions</h2>
        <p className="text-gray-700 mb-2">
          If you purchased any gift subscriptions, the recipients have been notified via email with instructions on how to redeem their gifts.
        </p>
        <p className="text-gray-700">
          You can view the status of your gift subscriptions in your <Link to="/dashboard" className="text-purple-600 hover:text-purple-800 underline">dashboard</Link>.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
        <Link
          to="/"
          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-center"
        >
          Return to Home
        </Link>
        {user && (
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-white border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

export default CheckoutSuccess;
