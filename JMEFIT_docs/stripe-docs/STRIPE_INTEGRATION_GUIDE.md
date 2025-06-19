# Stripe Integration Guide for JMEFIT

This document provides a comprehensive reference for Stripe integration in the JMEFIT application, covering both React components and server-side implementation. Last updated: May 18, 2025.

## Table of Contents

1. [React Stripe.js Components](#react-stripejs-components)
2. [Current Checkout Flow](#current-checkout-flow) 
3. [Stripe Checkout Implementation](#stripe-checkout-implementation)
4. [Server-Side Implementation (Netlify Functions)](#server-side-implementation)
5. [Handling Subscriptions vs. One-Time Payments](#handling-subscriptions-vs-one-time-payments)
6. [Subscription Terms and Requirements](#subscription-terms-and-requirements)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)
8. [Official Documentation References](#official-documentation-references)

## Current Checkout Flow

### Overview

The JMEFIT checkout flow follows these steps:

1. User adds items to cart through the `/programs` or `/shop` pages
2. User clicks "Proceed to Checkout" which takes them to `/checkout`
3. The `StripeCheckout` component (`/src/modules/checkout/components/StripeCheckout.tsx`) loads and immediately determines if the cart contains subscription items
4. Based on the cart content, the appropriate Netlify serverless function is called:
   - For subscriptions: `/.netlify/functions/create-subscription`
   - For one-time purchases: `/.netlify/functions/create-checkout`
5. The serverless function creates a Stripe checkout session and returns the session URL
6. The user is redirected directly to Stripe's hosted checkout page
7. After payment, the user is redirected to either:
   - Success page: `/checkout/success`
   - Canceled page: `/checkout?canceled=true`

### Component Path Structure

```
src/
├── modules/
│   └── checkout/
│       ├── components/
│       │   ├── StripeCheckout.tsx  # Main checkout component
│       │   ├── ProductSelector.tsx # For selecting products if cart is empty
│       │   └── CheckoutFooter.tsx  # Footer with checkout buttons
│       ├── hooks/
│       │   └── useStripeProducts.ts # Hook to fetch Stripe products
│       └── types/
│           └── index.ts             # TypeScript interfaces for checkout
└── store/
    └── cart.ts                     # Zustand store for cart management
```

### Serverless Function Structure

```
netlify/
└── functions/
    ├── create-checkout.js          # Handles one-time payments
    ├── create-subscription.js      # Handles subscription payments
    ├── create-payment-intent.js    # Creates payment intents (alternative flow)
    ├── get-products.js             # Fetches products from Stripe
    └── sync-products.js            # Synchronizes Stripe products with Supabase
```

## React Stripe.js Components

### Installation

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

### Basic Setup

```jsx
import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

// Load Stripe outside of component render to avoid recreating the Stripe object
const stripePromise = loadStripe('pk_test_your_key');

function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

export default App;
```

### Checkout Form Component

```jsx
import React, {useState} from 'react';
import {useStripe, useElements, PaymentElement} from '@stripe/react-stripe-js';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);

    try {
      // Trigger form validation and wallet collection
      const {error: submitError} = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message);
        return;
      }

      // Create the PaymentIntent through your server endpoint
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [/* your cart items */],
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout?canceled=true`,
        }),
      });

      const {sessionId} = await res.json();
      
      // Redirect to Stripe Checkout
      const {error} = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay now'}
      </button>
      {errorMessage && <div>{errorMessage}</div>}
    </form>
  );
};

export default CheckoutForm;
```

## Stripe Checkout Implementation

### Client-Side Implementation

```tsx
// In src/modules/checkout/components/StripeCheckout.tsx
import { useEffect, useState } from 'react';
import { useCartStore } from '../../../store/cart';

export default function StripeCheckout() {
  const { items } = useCartStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  
  // Immediately redirect to Stripe checkout if there are items in the cart
  useEffect(() => {
    const redirectToStripeCheckout = async () => {
      if (items.length > 0) {
        setIsRedirecting(true);
        try {
          // Determine if we have subscription items or one-time payments
          const hasSubscription = items.some(item => 
            item.billingInterval === 'month' || 
            item.billingInterval === 'year'
          );

          // Use appropriate endpoint based on item types
          const endpoint = hasSubscription ? 
            '/.netlify/functions/create-subscription' : 
            '/.netlify/functions/create-checkout';

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                stripe_price_id: item.stripe_price_id,
                quantity: 1,
                billingInterval: item.billingInterval,
                description: item.description
              })),
              successUrl: `${window.location.origin}/checkout/success`,
              cancelUrl: `${window.location.origin}/checkout?canceled=true`,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create checkout session');
          }

          const data = await response.json();
          
          // Redirect directly to Stripe
          window.location.href = data.url;
          
        } catch (err) {
          console.error('Checkout redirect error:', err);
          setRedirectError(err instanceof Error ? err.message : 'Failed to redirect to checkout');
          setIsRedirecting(false);
        }
      }
    };

    redirectToStripeCheckout();
  }, [items]);
  
  /* Display code omitted for brevity */
};

## Server-Side Implementation

### One-Time Payment Checkout (Netlify Function)

```javascript
// netlify/functions/create-checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const data = JSON.parse(event.body);
    const {items, successUrl, cancelUrl, customerEmail} = data;

    if (!items || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({error: 'No items provided for checkout'})
      };
    }

    // Filter for one-time payment items
    const oneTimeItems = items.filter(item => 
      !item.billingInterval || 
      item.billingInterval === 'one-time'
    );

    if (oneTimeItems.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({error: 'No one-time payment items provided'})
      };
    }

    // Map cart items to Stripe line items
    const lineItems = oneTimeItems.map(item => {
      if (item.stripe_price_id) {
        return {
          price: item.stripe_price_id,
          quantity: item.quantity || 1
        };
      } else {
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              description: item.description || ''
            },
            unit_amount: Math.round(item.price * 100) // Convert to cents
          },
          quantity: item.quantity || 1
        };
      }
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || 'https://jmefit.com/checkout/success',
      cancel_url: cancelUrl || 'https://jmefit.com/checkout/canceled',
      customer_email: customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'en'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to create checkout session'
      })
    };
  }
};
        sessionId: session.id,
        url: session.url
      })
    };
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to create checkout session'
      })
    };
  }
};
```

## Handling Subscriptions vs. One-Time Payments

### Utility Functions

```typescript
// src/utils/checkout.ts

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
    item.billingInterval === 'one-time'
  );
};

// Function to create a checkout session based on cart contents
export const createCheckoutSession = async (
  items: CartItem[],
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
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
      customerEmail
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
    item.billingInterval === 'one-time'
  );
  
  return { subscriptionItems, oneTimeItems };
};
```

## Subscription Terms and Requirements

### Minimum Subscription Requirements

The following programs require a minimum subscription commitment:

product_ids: one time payments 
price_1RPq5aG00IiCtQkD30r2Csua
price_1RPq5RG00IiCtQkD94kNa9AQ


monthly (min 3 month commitment)
price_1RPpiBG00IiCtQkDBBgajsyo
price_1RPq65G00IiCtQkDvWPGX09T
yearly
price_1RPb4CG00IiCtQkDWk5SOKce
price_1RPq60G00IiCtQkDhEj1vQBr



- **Self-Led Training Program**: 3-month minimum commitment
  - Monthly price: $24.99 per month
  - Yearly price: $249.90 per year (save ~17%)
  - Description: Access to app & exercise library
  - The user must be informed that this is a subscription with a 3-month minimum commitment

- **Trainer Feedback Program**: 3-month minimum commitment
  - Monthly price: $49.99 per month
  - Yearly price: $499.90 per year (save ~17%)
  - Description: Access to app, exercise library, and trainer feedback

- **Nutrition Only Program**: 3-month minimum commitment
  - Monthly price: $69.99 per month
  - Yearly price: $699.90 per year (save ~17%)
  - Description: Nutrition counseling and meal plans

- **Nutrition & Training Program**: 3-month minimum commitment
  - Monthly price: $99.99 per month
  - Yearly price: $999.90 per year (save ~17%)
  - Description: Comprehensive nutrition and training program

### Displaying Subscription Terms

The subscription terms should be displayed to users in the following places:

1. **Product Cards**: Each subscription product should clearly indicate the minimum commitment period
2. **Checkout Page**: The checkout page should display the subscription terms before users proceed to payment
3. **Product Description**: The billing terms should be included in the product description sent to Stripe
4. **Confirmation Emails**: Post-purchase emails should restate the subscription terms

### Implementation Details

To ensure users are aware of subscription terms:

```tsx
// Example product description in StripeCheckout component
const items = useCartStore((state) => state.items).map(item => ({
  id: item.id,
  name: item.name,
  price: item.price,
  stripe_price_id: item.stripe_price_id,
  quantity: 1,
  billingInterval: item.billingInterval,
  description: item.description + (item.billingInterval !== 'one-time' ? ' (3-month minimum commitment)' : '')
}));
```

## Troubleshooting Common Issues

### 1. Stripe Price ID Issues

If you're encountering issues with Stripe price IDs, ensure:

- The price IDs exist in your Stripe dashboard
- You're using the correct price IDs for the environment (test vs. production)
- The price IDs match the billing interval (monthly vs. yearly)

### 2. Mixed Cart Issues

When handling mixed carts (subscription + one-time items):

- Process subscription items and one-time items separately
- Use the appropriate checkout function for each type
- Clearly communicate to users that items will be processed as separate transactions

### 3. Checkout Redirect Issues

If checkout redirects aren't working:

- Ensure success and cancel URLs are properly formatted with the full origin
- Check that the Stripe session is being created successfully
- Verify that the client-side redirect is being triggered

### 4. Environment Variables

Make sure these environment variables are properly set in your Netlify dashboard:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXX
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXX
```

## Official Documentation References

- [Stripe Checkout Documentation](https://docs.stripe.com/checkout/quickstart)
- [React Stripe.js Documentation](https://github.com/stripe/react-stripe-js)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
