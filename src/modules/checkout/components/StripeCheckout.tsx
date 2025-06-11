import { useEffect, useState } from 'react';
import { useCartStore } from '../../../store/cart';
import { useLocation, useNavigate } from 'react-router-dom';

export default function StripeCheckout() {
  const { items } = useCartStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [canceledCheckout, setCanceledCheckout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if the user came back from a canceled checkout
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('canceled') === 'true') {
      setCanceledCheckout(true);
      // Optionally clear the URL parameter to avoid persisting the canceled state
      window.history.replaceState(null, '', '/checkout');
    }
  }, [location]);

  // Redirect to programs page if cart is empty (but not if user just canceled checkout)
  useEffect(() => {
    if (items.length === 0 && !canceledCheckout && !isRedirecting) {
      navigate('/programs');
    }
  }, [items.length, canceledCheckout, isRedirecting, navigate]);

  // Function to retry checkout
  const handleRetryCheckout = () => {
    setCanceledCheckout(false);
    setRedirectError(null);
  };

  // Define the redirectToStripeCheckout function but don't automatically call it
  const redirectToStripeCheckout = async () => {
    // Skip redirect if the user just canceled a checkout
    if (canceledCheckout) {
      return;
    }
    
    if (items.length > 0) {
      setIsRedirecting(true);
      try {
        // We're using the unified mixed cart approach - always use create-checkout
        // This endpoint supports both subscription and one-time products in the same cart
        const endpoint = '/.netlify/functions/create-checkout';

        // Map items and ensure they have valid Stripe price IDs
        const itemsForCheckout = items
          .map(item => {
            const isSubscription = item.billingInterval === 'month' || item.billingInterval === 'year';
            
            // Check if the item has a stripe_price_id
            if (!item.stripe_price_id) {
              return null;
            }
            
            return {
              id: item.id,
              name: item.name,
              price: item.price,
              stripe_price_id: item.stripe_price_id,
              quantity: 1, 
              billingInterval: item.billingInterval || 'one-time',
              // Add minimum commitment info for subscription products
              description: isSubscription
                ? `${item.description || item.name} (3-month minimum commitment)`
                : (item.description || item.name)
            };
          })
          .filter(item => item !== null); // Filter out null items (those without price IDs)
        
        // Check if we have any valid items after filtering
        if (itemsForCheckout.length === 0) {
          throw new Error('No valid items with Stripe price IDs found in cart');
        }
        
        // Prepare the request body with all necessary fields
        const requestBody = {
          items: itemsForCheckout,
          userId: localStorage.getItem('userId'),
          customerEmail: localStorage.getItem('userEmail') || undefined,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout?canceled=true`,
          metadata: {
            source: 'web_app',
            cartItemCount: itemsForCheckout.length
          }
        };
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          let errorData;
          
          try {
            const errorText = await response.text();
            try {
              errorData = JSON.parse(errorText);
            } catch (parseErr) {
              // Could not parse error response
            }
          } catch (e) {
            // Could not get response text
          }
          
          // User-friendly error
          const errorMessage = errorData?.error || 
            `Failed to create checkout session (${response.status}). Please try again or contact support.`;
            
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Redirect directly to Stripe
        window.location.href = data.url;
        
      } catch (err) {
        setRedirectError(err instanceof Error ? err.message : 'Failed to redirect to checkout');
        setIsRedirecting(false);
      }
    }
  };

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-medium">Redirecting to secure checkout...</h2>
        <p className="text-gray-600 mt-2">Please do not refresh the page.</p>
      </div>
    );
  }

  // Show error state if redirect failed
  if (redirectError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium text-red-700 mb-2">Checkout Error</h2>
          <p className="text-red-600 mb-4">{redirectError}</p>
          <button
            onClick={handleRetryCheckout}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            If the problem persists, please contact our support team for assistance.
          </p>
        </div>
      </div>
    );
  }
  
  // If items in cart, show cart items and checkout button
  if (items.length > 0) {
    // Normal cart display for compatible items
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Your Cart</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {items.map((item, index) => {
            const hasSubscription = !!item.billingInterval && item.billingInterval !== 'one-time';
            const isOneTime = item.billingInterval === 'one-time' || item.name.includes('SHRED') || item.name.includes('One-Time');
            
            return (
              <div key={index} className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center relative">
                  <div className="pr-10">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-600">
                  {item.billingInterval === 'month' && 'Monthly subscription'}
                  {item.billingInterval === 'year' && 'Annual subscription'}
                      {isOneTime && 'One-time purchase'}
                </p>
              </div>
                  <div className="text-xl font-bold mt-2 sm:mt-0">
                ${item.price.toFixed(2)}
                  </div>
                  
                  {/* Remove button - positioned absolutely for better mobile UX */}
                  <button
                    onClick={() => {
                      const { removeItem } = useCartStore.getState();
                      removeItem(item.id);
                    }}
                    className="absolute top-0 right-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors touch-manipulation"
                    aria-label="Remove item"
                    title="Remove from cart"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                {/* Billing interval options for subscription products */}
                {hasSubscription && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Billing interval:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const { updateItemInterval } = useCartStore.getState();
                          updateItemInterval(item.id, 'month');
                        }}
                        className={`flex items-center justify-center px-4 py-2 rounded-md text-sm ${
                          item.billingInterval === 'month'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => {
                          const { updateItemInterval } = useCartStore.getState();
                          updateItemInterval(item.id, 'year');
                        }}
                        className={`flex items-center justify-center px-4 py-2 rounded-md text-sm ${
                          item.billingInterval === 'year'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Yearly
                        {item.billingInterval === 'year' && (
                          <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">-20%</span>
                        )}
                      </button>
                    </div>
                    
                    {item.billingInterval === 'year' && (
                      <div className="mt-2 text-sm text-green-600">
                        <p>Save 20% with annual billing</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="p-6 bg-gray-50 flex justify-between items-center">
            <div className="text-lg font-semibold">Total:</div>
            <div className="text-2xl font-bold">
              ${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={redirectToStripeCheckout}
            className="px-8 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-lg font-semibold"
            disabled={isRedirecting}
          >
            {isRedirecting ? 'Processing...' : 'Proceed to Secure Checkout'}
          </button>
          <p className="mt-2 text-gray-600 text-sm">
            You'll be redirected to our secure payment processor.
          </p>
        </div>
      </div>
    );
  }
  
  // If no items in cart, show redirect message (component will redirect to programs)
  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-medium">Your cart is empty</h2>
        <p className="text-gray-600 mt-2">Redirecting to programs...</p>
      </div>
    );
  }

  // Fallback UI (should not normally be seen)
  return <div className="text-center py-10">Processing checkout...</div>;
}
