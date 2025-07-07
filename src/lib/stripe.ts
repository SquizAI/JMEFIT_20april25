import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

// Client-side Stripe instance
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Log if we're using the test environment
console.log(`Using Stripe in ${import.meta.env.DEV ? 'TEST' : 'PRODUCTION'} mode`);

/**
 * Get the client-side Stripe instance
 */
export async function getStripe(): Promise<StripeClient | null> {
  return stripePromise;
}

// WARNING: Server-side Stripe operations should NEVER be done in the frontend
// All server-side operations should be handled by Netlify Functions or backend APIs

/**
 * Check if the server is available
 * @returns Promise that resolves to true if server is available, false otherwise
 */
async function isServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Server connection check failed:', error);
    return false;
  }
}

export async function createCheckoutSession(
  items: Array<{
    id: string;
    name: string;
    price: number;
    stripe_price_id?: string; // Add support for stripe_price_id
    billingInterval?: 'month' | 'year';
    description?: string;
  }>,
  successUrl?: string,
  cancelUrl?: string,
  customerEmail?: string,
  giftRecipientEmail?: string
) {
  try {
    // First check if the server is available
    const serverAvailable = await isServerAvailable();
    if (!serverAvailable) {
      throw new Error('Cannot connect to the server. Please make sure the server is running.');
    }
    
    // Call our server API to create a Checkout session
    // Use relative URL to work in both development and production
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        successUrl,
        cancelUrl,
        customerEmail,
        giftRecipientEmail,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // If we can't parse the JSON, use the status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('Invalid response from server: missing checkout URL');
    }
    
    // Redirect to Stripe Checkout
    window.location.href = data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}