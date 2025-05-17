import { useState } from 'react';
import { StripePrice } from '../types';
import { useCartStore } from '../../../stores/cart';
import { toast } from 'react-hot-toast';

interface CheckoutFooterProps {
  selectedItems: Record<string, { price: string; quantity: number }>;
  prices: StripePrice[];
}

export default function CheckoutFooter({ selectedItems, prices }: CheckoutFooterProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { clearCart } = useCartStore();

  // Create checkout session
  const handleCheckout = async () => {
    try {
      if (Object.keys(selectedItems).length === 0) {
        toast.error('Please select at least one product');
        return;
      }
      
      setIsCheckingOut(true);
      
      // Determine if we have one-time or subscription items
      const lineItems = Object.values(selectedItems);
      const hasSubscription = prices
        .filter(price => Object.keys(selectedItems).includes(price.id))
        .some(price => price.recurring);
      
      // Call the appropriate serverless function
      const endpoint = hasSubscription 
        ? '/.netlify/functions/create-subscription-checkout'
        : '/.netlify/functions/create-checkout';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: lineItems,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout?canceled=true`,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await response.json();
      
      // Clear cart and redirect to Stripe
      clearCart();
      
      // If we have a URL, redirect to it
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Legacy handling for implementations that return sessionId instead of URL
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md p-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-4 sm:mb-0">
          <span className="font-medium">Selected: {Object.keys(selectedItems).length} item(s)</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={isCheckingOut || Object.keys(selectedItems).length === 0}
          className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
}
