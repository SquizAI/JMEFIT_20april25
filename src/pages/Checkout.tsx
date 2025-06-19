import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cart';
import { ArrowLeft, CreditCard, Lock, Check, User, Mail, Key, Gift } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { createCheckoutSession, hasSubscriptionItems, hasOneTimeItems, handleMixedCart } from '../utils/checkout';
import { supabase } from '../lib/supabase';
import { Elements, PaymentElement, useStripe, useElements, AddressElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Using Stripe's PaymentIntent type
import { PaymentIntent as StripePaymentIntent } from '@stripe/stripe-js';

type CheckoutFormProps = {
  clientSecret: string;
  handleSuccess: (paymentIntent: StripePaymentIntent) => void;
}

function CheckoutForm({ handleSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);

    // Confirm the payment
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      // Show error to your customer
      setPaymentError(result.error.message);
      toast.error(result.error.message || 'Payment failed. Please try again.');
      setLoading(false);
    } else {
      // Payment succeeded
      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        handleSuccess(result.paymentIntent as StripePaymentIntent);
      } else {
        // Handle other statuses or redirect to return_url
        window.location.href = `${window.location.origin}/checkout/success`;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{paymentError}</p>
        </div>
      )}
      
      <PaymentElement className="mb-6" options={{
        layout: {
          type: 'tabs',
          defaultCollapsed: false,
        },
      }} />
      
      <AddressElement options={{
        mode: 'billing',
        fields: {
          phone: 'always',
        },
        validation: {
          phone: {
            required: 'never',
          },
        },
      }} />
      
      <button
        disabled={!stripe || loading}
        className="w-full flex items-center justify-center bg-jme-purple text-white py-4 px-6 rounded-lg font-bold hover:bg-purple-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <CreditCard className="w-5 h-5 mr-2" />
        {loading ? 'Processing Payment...' : 'Pay Now'}
      </button>
    </form>
  );
}

function Checkout() {
  const { items, total, removeItem, updateItemInterval } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Force recalculation of prices when component mounts
  useEffect(() => {
    // Ensure all items have the correct prices before checkout
    if (items.length > 0) {
      // Force update all items to ensure prices are current
      items.forEach(item => {
        if (item.id) {
          updateItemInterval(item.id, item.billingInterval || 'month');
        }
      });
      console.log('Cart has items:', items.length);
    } else {
      console.log('Cart is empty, adding a test item for debugging');
      // Add a test item to the cart for debugging purposes
      const testItem = {
        id: 'test-item-' + Date.now(),
        name: 'Test Product One-Time',
        price: 10,
        description: 'Test product for debugging checkout flow',
        billingInterval: 'one-time' as 'month' | 'year' | 'one-time'
      };
      useCartStore.getState().addItem(testItem);
    }
  }, []);  // Empty dependency array to run only once on mount
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get('canceled');
  const [clientSecret] = useState<string>('');
  const [showEmbeddedCheckout] = useState(false);
  
  // Handle checkout initialization and cancellation
  useEffect(() => {
    // If the checkout was canceled, reset loading state but don't show error toast
    // This prevents multiple error messages when returning from a canceled checkout
    if (canceled === 'true') {
      setLoading(false);
      // Remove toast.error to prevent multiple error messages
    } else if (!loading && user) {
      // Only trigger checkout if we're not already loading AND the user is logged in
      // This prevents duplicate checkout attempts and ensures we have user info
      handleCheckout();
    } else if (!loading && !user) {
      // If user is not logged in, redirect to login page
      toast.error('Please sign in before proceeding to checkout');
      // Redirect to login page with a return URL to come back to checkout
      window.location.href = `/auth?returnUrl=${encodeURIComponent('/checkout')}`;
    }
  }, [canceled, user]);
  
  // Clean up URL parameters when component unmounts or when canceled param is detected
  useEffect(() => {
    if (canceled === 'true') {
      // Remove the canceled parameter from the URL to prevent showing the error on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('canceled');
      window.history.replaceState({}, '', url);
    }
  }, [canceled]);
  
  // Account creation states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountStep, setAccountStep] = useState(user ? 'complete' : 'account');
  
  // Gift certificate states
  const [isGift, setIsGift] = useState(false);
  const [giftRecipientEmail, setGiftRecipientEmail] = useState('');
  
  // Guest checkout state
  const [checkoutAsGuest, setCheckoutAsGuest] = useState(false);
  
  // Check if cart has only one-time purchases
  const hasOnlyOneTimePurchases = () => {
    return items.every(item => 
      item.name.includes('One-Time') || 
      item.name.includes('Shred') || 
      !item.billingInterval
    );
  };
  
  // Check if guest checkout should be allowed
  const allowGuestCheckout = () => {
    // Allow guest checkout for one-time purchases OR when buying as a gift
    return hasOnlyOneTimePurchases() || isGift;
  };
  
  // Check if any program requires minimum 3-month commitment
  const hasMinThreeMonthProgram = () => {
    return items.some(item => 
      (item.name.includes('Transformation') || 
       item.name.includes('Premium') || 
       item.name.includes('Elite')) && 
      item.billingInterval
    );
  };
  
  // Calculate how much a user saves with yearly billing
  // Only apply yearly discount to subscription items, not one-time purchases
  const calculateYearlySavings = (item: any) => {
    if (item.billingInterval === 'year' && item.yearlyDiscountApplied) {
      // The yearly price is 80% of the monthly price * 12
      // So the savings is 20% of the monthly price * 12
      const monthlyEquivalent = (item.price / 0.8) / 12;
      const yearlySavings = monthlyEquivalent * 12 * 0.2;
      return yearlySavings.toFixed(2);
    }
    return 0;
  };

  // We don't need to show a message if the payment was canceled
  // This was causing duplicate error messages
  // useEffect(() => {
  //   if (canceled) {
  //     toast.error('Payment was canceled. Please try again.');
  //   }
  // }, [canceled]);

  // Handle account creation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAccount(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast.success('Account created! Please check your email to verify your account.');
        setAccountStep('complete');
      }
    } catch (error: any) {
      console.error('Account creation error:', error);
      setError(`Failed to create account: ${error.message}`);
      toast.error('Failed to create account');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleCheckout = async () => {
    // Simple direct checkout with minimal steps
    setLoading(true);
    setError(null);
    
    // Debug logging to understand cart state
    console.log('Cart items at checkout:', items);
    console.log('Cart store state:', useCartStore.getState());
    
    try {
      // Check if cart is empty and add a test item if needed
      if (!items || items.length === 0) {
        console.log('Cart is empty, adding a test item before checkout');
        // Create a test item
        const testItem = {
          id: 'test-item-' + Date.now(),
          name: 'Test Product One-Time',
          price: 10,
          description: 'Test product for debugging checkout flow',
          billingInterval: 'one-time' as 'month' | 'year' | 'one-time'
        };
        
        // Add the test item to the cart
        useCartStore.getState().addItem(testItem);
        
        // Wait a moment for the state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the updated items from the store
        const updatedItems = useCartStore.getState().items;
        console.log('Updated cart after adding test item:', updatedItems);
        
        // If still empty, show a more helpful error
        if (!updatedItems || updatedItems.length === 0) {
          console.error('Cart still empty after adding test item');
          throw new Error('Unable to add items to cart. Please try refreshing the page or contact support.');
        }
      }
      
      // Get the user's email - either from their account, the form, or guest email
      const customerEmail = user?.email || 
                          (accountStep === 'complete' ? email : undefined) || 
                          (checkoutAsGuest ? email : undefined);
      
      // Ensure all items have the correct prices before checkout
      const checkoutItems = items.map(item => {
        // Make sure SHRED Challenge has the correct price
        if (item.name && item.name.includes('SHRED')) {
          return {
            ...item,
            billingInterval: 'one-time' as 'month' | 'year' | 'one-time',
            price: 297.00
          };
        }
        return item;
      });
      
      // Determine the correct endpoint based on cart contents
      const hasSubscriptions = items.some(item => 
        item.billingInterval === 'month' || item.billingInterval === 'year'
      );
      
      const hasOneTimeItems = items.some(item => 
        !item.billingInterval || 
        item.billingInterval === 'one-time' ||
        item.name.includes('One-Time') ||
        item.name.includes('SHRED')
      );
      
      // Choose the appropriate endpoint
      let endpoint;
      if (hasSubscriptions && hasOneTimeItems) {
        // Mixed cart - for now, prioritize subscriptions and show a message
        endpoint = '/.netlify/functions/create-subscription-checkout';
        toast('Processing subscription items first. One-time items will be handled separately.', { icon: 'ℹ️' });
      } else if (hasSubscriptions) {
        // Only subscription items
        endpoint = '/.netlify/functions/create-subscription-checkout';
      } else {
        // Only one-time items
        endpoint = '/.netlify/functions/create-checkout';
      }
      
      // Direct call to serverless function
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: checkoutItems,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout?canceled=true`,
          customerEmail
        }),
      });
      
      if (!response.ok) {
        console.error('Checkout API error status:', response.status);
        let errorMessage = 'Failed to create checkout session';
        
        try {
          const errorData = await response.json();
          console.error('Checkout API error details:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
          // Try to get text response if JSON parsing fails
          try {
            const textError = await response.text();
            console.error('Error response text:', textError);
            errorMessage = textError || errorMessage;
          } catch (textError) {
            console.error('Failed to get error text:', textError);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const session = await response.json();
      
      // Immediately redirect to Stripe's hosted checkout
      if (session && session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
      
      // Note: We don't clear the cart here because the user might cancel the checkout
      // The cart will be cleared after successful payment confirmation
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      // Simple error handling
      const errorMessage = error.message || 'Failed to create checkout session. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Reset loading state
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Link to="/train" className="text-jme-purple hover:text-purple-700">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/programs" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to programs
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
          {/* Checkout Section */}
          <div>
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
              <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h2 className="text-xl font-semibold mb-2">Try Our New Checkout Experience</h2>
                <p className="mb-3">Experience our improved checkout process with direct integration to Stripe products.</p>
                <Link to="/checkout/stripe" className="inline-block bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors">
                  Use New Checkout
                </Link>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              {/* Guest checkout option for one-time purchases or gift purchases */}
              {!user && (hasOnlyOneTimePurchases() || isGift) && accountStep === 'account' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">{hasOnlyOneTimePurchases() ? 'One-Time Purchase' : 'Gift Purchase'}</h3>
                  <p className="text-blue-700 mb-4">
                    {hasOnlyOneTimePurchases() 
                      ? 'Since you\'re making a one-time purchase, you can checkout as a guest or create an account to save your information for future purchases.'
                      : 'Since you\'re purchasing this as a gift, you can checkout as a guest or create an account to save your information for future purchases.'}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setCheckoutAsGuest(true);
                        setAccountStep('guest');
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-white border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 hover:bg-blue-50"
                    >
                      Checkout as Guest
                    </button>
                    <button
                      onClick={() => {
                        setCheckoutAsGuest(false);
                        setAccountStep('account');
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Create an Account
                    </button>
                  </div>
                </div>
              )}
              
              {/* Guest checkout email form */}
              {!user && checkoutAsGuest && accountStep === 'guest' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Checkout as Guest</h3>
                  <p className="text-gray-600 mb-4">
                    Please provide your email to receive your purchase confirmation and receipt.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="guestEmail"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jme-purple focus:border-jme-purple"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    
                    {/* Gift option */}
                    <div className="mt-4">
                      <div className="flex items-center mb-2">
                        <input
                          id="isGift"
                          type="checkbox"
                          checked={isGift}
                          onChange={(e) => setIsGift(e.target.checked)}
                          className="h-4 w-4 text-jme-purple focus:ring-jme-purple border-gray-300 rounded"
                        />
                        <label htmlFor="isGift" className="ml-2 block text-sm text-gray-700 font-medium">
                          This is a gift for someone else
                        </label>
                      </div>
                      
                      {isGift && (
                        <div className="mt-3 pl-6">
                          <label htmlFor="giftEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Recipient's Email
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Gift className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="giftEmail"
                              type="email"
                              value={giftRecipientEmail}
                              onChange={(e) => setGiftRecipientEmail(e.target.value)}
                              required={isGift}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jme-purple focus:border-jme-purple"
                              placeholder="recipient@email.com"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            We'll email the access details to this address
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Account creation step */}
              {!user && !checkoutAsGuest && accountStep === 'account' ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Create an Account</h3>
                  <p className="text-gray-600 mb-4">
                    Create an account to manage your subscription and access your purchases.
                  </p>
                  
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jme-purple focus:border-jme-purple"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jme-purple focus:border-jme-purple"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          autoComplete="current-password"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jme-purple focus:border-jme-purple"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={creatingAccount}
                      className="w-full flex items-center justify-center bg-jme-purple text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {creatingAccount ? 'Creating Account...' : 'Create Account & Continue'}
                    </button>
                  </form>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link to="/auth" className="text-jme-purple font-medium hover:text-purple-700">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    You'll be redirected to Stripe's secure checkout page to complete your purchase.
                  </p>
                  
                  {showEmbeddedCheckout && clientSecret ? (
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <Elements stripe={loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)} options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#6b21a8',
                            colorBackground: '#ffffff',
                            colorText: '#1F2937',
                            borderRadius: '8px',
                          },
                        },
                      }}>
                        <CheckoutForm 
                          clientSecret={clientSecret}
                          handleSuccess={(_paymentIntent) => {
                            useCartStore.getState().clearCart();
                            toast.success('Payment successful!');
                            // Redirect to success page after a brief moment
                            setTimeout(() => {
                              window.location.href = `${window.location.origin}/checkout/success`;
                            }, 1500);
                          }}
                        />
                      </Elements>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Display a warning if the cart has mixed items (both subscription and one-time) */}
                      {hasSubscriptionItems(items) && hasOneTimeItems(items) && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-yellow-700">
                                Your cart contains both subscription and one-time purchase items. These will be processed as separate transactions.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={async () => {
                          setLoading(true);
                          setError(null);
                          
                          try {
                            // Get the user's email - either from their account, the form, or guest email
                            const customerEmail = user?.email || 
                                              (accountStep === 'complete' ? email : undefined) || 
                                              (checkoutAsGuest ? email : undefined);
                            
                            // Check if we have a mixed cart (both subscription and one-time items)
                            if (hasSubscriptionItems(items) && hasOneTimeItems(items)) {
                              // Show a toast notification about processing as separate transactions
                              toast('Processing subscription items first. One-time items will be handled separately.', { icon: 'ℹ️' });
                              
                              // Get subscription items only
                              const { subscriptionItems } = handleMixedCart(items);
                              
                              // Process subscription items first
                              await createCheckoutSession(
                                subscriptionItems,
                                `${window.location.origin}/checkout/success`,
                                `${window.location.origin}/checkout?canceled=true`,
                                customerEmail,
                                isGift ? giftRecipientEmail : undefined
                              );
                            } else {
                              // Process all items together (either all subscription or all one-time)
                              await createCheckoutSession(
                                items,
                                `${window.location.origin}/checkout/success`,
                                `${window.location.origin}/checkout?canceled=true`,
                                customerEmail,
                                isGift ? giftRecipientEmail : undefined
                              );
                            }
                            
                            // The user will be redirected to Stripe's checkout page
                            // No need to set clientSecret or showEmbeddedCheckout as we're using redirect checkout
                          } catch (error: unknown) {
                            console.error('Payment initialization error:', error);
                            const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment';
                            setError(errorMessage);
                            toast.error(errorMessage);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="w-full flex items-center justify-center bg-jme-purple text-white py-4 px-6 rounded-lg font-bold hover:bg-purple-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {loading ? 'Initializing Checkout...' : 'Checkout Securely'}
                      </button>
                      
                      <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full flex items-center justify-center bg-black text-white py-4 px-6 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.0301 12.978C17.0161 11.8608 17.4375 10.9667 18.2863 10.2455C17.7953 9.54932 17.0161 9.08932 15.9551 8.86182C14.9641 8.64432 13.8331 9.28682 13.3021 9.28682C12.7431 9.28682 11.7521 8.89182 10.9731 8.89182C9.33312 8.91182 7.57812 10.1758 7.57812 12.747C7.57812 13.4608 7.69212 14.1968 7.92012 14.955C8.23212 16.0208 9.51012 18.7308 10.8431 18.687C11.5921 18.6658 12.1231 18.1608 13.1001 18.1608C14.0491 18.1608 14.5401 18.687 15.3751 18.687C16.2241 18.6728 17.3551 16.2028 17.6531 15.1298C16.6201 14.5818 17.0301 13.0348 17.0301 12.978Z" fill="white"/>
                            <path d="M15.1899 7.77C15.8689 6.95 15.7969 6.17 15.7829 5.89C15.1469 5.92 14.3959 6.38 14.0139 6.89C13.5929 7.44 13.3089 8.11 13.3649 8.85C14.0699 8.9 14.5329 8.56 15.1899 7.77Z" fill="white"/>
                          </svg>
                          {loading ? 'Processing...' : 'Apple Pay'}
                        </div>
                      </button>
                      
                      <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full flex items-center justify-center bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-lg font-bold hover:bg-gray-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                            <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                            <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                            <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
                            <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
                          </svg>
                          {loading ? 'Processing...' : 'Google Pay'}
                        </div>
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-4 text-sm text-gray-500 flex items-center justify-center">
                    <Lock className="w-4 h-4 mr-1" />
                    Secure checkout powered by Stripe
                  </div>
                  
                  {/* Minimum commitment notice */}
                  {hasMinThreeMonthProgram() && (
                    <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                      <p className="font-medium">Please note:</p>
                      <p>Some programs in your cart require a minimum 3-month commitment.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 sticky top-20 md:top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-6 mb-6">
                {/* Get cart store functions at the component level, not inside the map */}
                {items.map(item => {
                  const hasSubscription = !!item.billingInterval;
                  
                  return (
                    <div key={item.id} className="border-b pb-4 relative">
                      <div className="flex flex-wrap justify-between mb-2 pr-8">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          {/* Only show billing text for subscription products, not SHRED Challenge */}
                          {hasSubscription && !item.name.includes('SHRED') && (
                            <p className="text-sm text-gray-500">
                              Billed {item.billingInterval === 'month' ? 'monthly' : 'annually'}
                            </p>
                          )}
                          {/* Show one-time payment text for SHRED Challenge */}
                          {item.name.includes('SHRED') && (
                            <p className="text-sm text-gray-500">One-time payment</p>
                          )}
                        </div>
                        <p className="font-medium">${item.price.toFixed(2)}</p>
                        <div>
                        <button 
                          onClick={() => {
                            // Use the removeItem function from the component level
                            removeItem(item.id);
                            toast.success('Item removed from cart');
                          }}
                            className="absolute top-0 right-0 p-2 sm:p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors touch-manipulation"
                          aria-label="Remove item"
                          title="Remove from cart"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                        </div>
                      </div>
                      
                      {/* Billing interval selection */}
                      {/* Only show billing interval options for subscription products */}
                      {hasSubscription && !item.name.includes('One-Time') && !item.name.includes('SHRED') && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">Billing interval:</p>
                          <div className="flex space-x-3">
                            <div className="flex flex-wrap gap-3 w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  // Use setTimeout to ensure state updates properly
                                  updateItemInterval(item.id, 'month');
                                  // Force a re-render after a small delay
                                  setTimeout(() => {
                                    // This empty setState forces a re-render
                                    setLoading(l => l);
                                  }, 50);
                                }}
                                className={`flex flex-1 min-w-[120px] h-10 items-center justify-center px-4 py-2 rounded-md text-sm ${item.billingInterval === 'month' 
                                  ? 'bg-jme-purple text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                              >
                                {item.billingInterval === 'month' && <Check className="w-3 h-3 mr-1" />}
                                Monthly
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  // Use setTimeout to ensure state updates properly
                                  updateItemInterval(item.id, 'year');
                                  // Force a re-render after a small delay
                                  setTimeout(() => {
                                    // This empty setState forces a re-render
                                    setLoading(l => l);
                                  }, 50);
                                }}
                                className={`flex flex-1 min-w-[120px] h-10 items-center justify-center px-4 py-2 rounded-md text-sm ${item.billingInterval === 'year' 
                                  ? 'bg-jme-purple text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                              >
                                {item.billingInterval === 'year' && <Check className="w-3 h-3 mr-1" />}
                                Yearly
                                {item.billingInterval === 'year' && (
                                  <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">-20%</span>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {item.billingInterval === 'year' && item.yearlyDiscountApplied && !item.name.includes('One-Time') && (
                            <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                              <p className="font-medium">You save ${calculateYearlySavings(item)} with annual billing!</p>
                              <p className="text-xs">That's 20% off the monthly price for 12 months</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* For one-time products, show a badge */}
                      {item.name.includes('One-Time') || item.name.includes('Shred') ? (
                        <div className="mt-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            One-time purchase
                          </span>
                        </div>
                      ) : null}
                      
                      {/* For programs with minimum 3-month commitment */}
                      {(item.name.includes('Transformation') || 
                        item.name.includes('Premium') || 
                        item.name.includes('Elite')) && 
                        item.billingInterval && (
                        <div className="mt-2">
                          <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                            Minimum 3-month commitment
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>${items.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}</span>
                </div>
                {items.some(item => item.billingInterval === 'year' && item.yearlyDiscountApplied && !item.name.includes('One-Time') && !item.name.includes('SHRED')) && (
                  <div className="text-sm text-green-600 mt-2 bg-green-50 p-2 rounded">
                    <p className="font-medium">Includes 20% annual discount</p>
                    <p>
                      You save ${items.reduce((total, item) => {
                        if (item.billingInterval === 'year' && item.yearlyDiscountApplied && !item.name.includes('One-Time') && !item.name.includes('Shred')) {
                          const monthlyEquivalent = (item.price / 0.8) / 12;
                          const yearlySavings = monthlyEquivalent * 12 * 0.2;
                          return total + yearlySavings;
                        }
                        return total;
                      }, 0).toFixed(2)} with annual billing
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;