import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCartStore } from '../store/cart';

function CheckoutSuccess() {
  const { user } = useAuth();
  const { clearCart } = useCartStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  
  // Get session_id from URL parameters (Stripe redirects with this)
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Clear the cart when checkout is successful
    if (sessionId) {
      clearCart();
      setIsLoading(false);
    } else {
      // If no session_id, this might be a direct access - redirect to home after a delay
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      
      setIsLoading(false);
      return () => clearTimeout(timer);
    }
  }, [sessionId, clearCart, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="mx-auto h-16 w-16 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Looks like you came here directly
          </h1>
          <p className="text-gray-600 mb-6">
            This page is only accessible after completing a purchase. You'll be redirected to the home page in a few seconds.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Thank you for your purchase!
        </h1>
        <p className="text-gray-600 mb-6">
          Your order has been successfully processed. You'll receive a confirmation email shortly with your order details and next steps.
        </p>
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="block w-full bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors font-medium"
          >
            View Your Dashboard
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Continue Shopping
          </Link>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Order ID: {sessionId?.slice(0, 16)}...
          </p>
        </div>
      </div>
    </div>
  );
}

export default CheckoutSuccess;
