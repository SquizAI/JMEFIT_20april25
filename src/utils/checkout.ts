import { CartItem } from '../store/cart';

// Function to determine if a cart contains subscription items
export const hasSubscriptionItems = (items: CartItem[]): boolean => {
  return items.some(item => 
    item.billingInterval === 'month' || 
    item.billingInterval === 'year'
  );
};

// Function to determine if a cart contains one-time payment items
export const hasOneTimeItems = (items: CartItem[]): boolean => {
  return items.some(item => 
    !item.billingInterval || 
    item.billingInterval === 'one-time' ||
    item.name.includes('One-Time') ||
    item.name.includes('Shred')
  );
};

// Function to create a checkout session based on cart contents
export const createCheckoutSession = async (
  items: CartItem[],
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string,
  giftRecipientEmail?: string
): Promise<{ sessionId: string; url: string }> => {
  if (items.length === 0) {
    throw new Error('No items in cart');
  }

  // Determine the correct checkout endpoint based on cart contents
  let endpoint = '/.netlify/functions/create-checkout';
  
  if (hasSubscriptionItems(items)) {
    endpoint = '/.netlify/functions/create-subscription-checkout';
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items,
      successUrl,
      cancelUrl,
      customerEmail,
      giftRecipientEmail
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const data = await response.json();
  
  // Redirect to Stripe checkout
  if (data.url) {
    window.location.href = data.url;
  }
  
  return data;
};

// Function to handle mixed carts (containing both subscription and one-time items)
export const handleMixedCart = (items: CartItem[]): { 
  subscriptionItems: CartItem[]; 
  oneTimeItems: CartItem[]; 
} => {
  const subscriptionItems = items.filter(item => 
    item.billingInterval === 'month' || 
    item.billingInterval === 'year'
  );
  
  const oneTimeItems = items.filter(item => 
    !item.billingInterval || 
    item.billingInterval === 'one-time' ||
    item.name.includes('One-Time') ||
    item.name.includes('Shred')
  );
  
  return { subscriptionItems, oneTimeItems };
};
