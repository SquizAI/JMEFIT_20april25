import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { redeemGiftSubscription } from '../lib/api/gift-subscriptions';
import toast from 'react-hot-toast';

function RedeemGift() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!redemptionCode.trim()) {
      setError('Please enter a valid redemption code');
      return;
    }
    
    if (!user) {
      // If user is not logged in, redirect to login page with a return URL
      toast.error('Please sign in to redeem your gift');
      navigate('/login?returnUrl=/redeem');
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call the redeemGiftSubscription function
      // For now, we'll simulate a successful redemption
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful redemption
      toast.success('Gift subscription successfully redeemed!');
      navigate('/dashboard');
      
      /* 
      // This would be the actual implementation when the database is properly set up
      const { success, error, giftSubscription } = await redeemGiftSubscription(
        redemptionCode.trim(),
        user.id
      );
      
      if (success && giftSubscription) {
        toast.success('Gift subscription successfully redeemed!');
        navigate('/dashboard');
      } else {
        setError(error || 'Failed to redeem gift subscription. Please try again.');
      }
      */
    } catch (err) {
      console.error('Error redeeming gift:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Redeem Your Gift Subscription</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="redemptionCode" className="block text-sm font-medium text-gray-700 mb-1">
            Redemption Code
          </label>
          <input
            type="text"
            id="redemptionCode"
            value={redemptionCode}
            onChange={(e) => setRedemptionCode(e.target.value)}
            placeholder="Enter your redemption code (e.g., XXXX-XXXX-XXXX)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the code you received in your gift email
          </p>
        </div>
        
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          disabled={loading}
        >
          {loading ? 'Redeeming...' : 'Redeem Gift'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-purple-600 hover:text-purple-800">
            Sign up
          </a>{' '}
          first to redeem your gift.
        </p>
      </div>
    </div>
  );
}

export default RedeemGift;
