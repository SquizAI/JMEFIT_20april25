// Ensure the API key is provided
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required but was not provided in environment variables');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    const { items, successUrl, cancelUrl, customerEmail } = data;

    if (!items || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No items provided for checkout' })
      };
    }

    // Filter out any non-subscription items
    const subscriptionItems = items.filter(item => 
      item.billingInterval === 'month' || item.billingInterval === 'year'
    );

    if (subscriptionItems.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No subscription items provided for subscription checkout' })
      };
    }

    // Validate all price IDs before creating checkout session
    for (const item of subscriptionItems) {
      if (item.stripe_price_id) {
        // Validate price ID format
        if (!item.stripe_price_id.startsWith('price_')) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: `Invalid price ID format for ${item.name}: ${item.stripe_price_id}`,
              errorType: 'InvalidPriceId',
              timestamp: new Date().toISOString()
            })
          };
        }

        // Verify price exists in Stripe
        try {
          const price = await stripe.prices.retrieve(item.stripe_price_id);
          if (!price.active) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                error: `The price for ${item.name} is no longer available. Please refresh the page.`,
                errorType: 'InactivePrice',
                timestamp: new Date().toISOString()
              })
            };
          }

          // Verify it's a recurring price
          if (price.type !== 'recurring') {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                error: `The price for ${item.name} is not a subscription price.`,
                errorType: 'NotRecurringPrice',
                timestamp: new Date().toISOString()
              })
            };
          }
        } catch (priceError) {
          console.error(`Price validation failed for ${item.stripe_price_id}:`, priceError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: `Invalid price ID for ${item.name}. Please contact support.`,
              errorType: 'PriceNotFound',
              timestamp: new Date().toISOString()
            })
          };
        }
      }
    }

    // Map subscription items to Stripe line items
    const lineItems = subscriptionItems.map(item => {
      // Check if the item has a valid Stripe price ID
      if (item.stripe_price_id) {
        return {
          price: item.stripe_price_id,
          quantity: item.quantity || 1
        };
      } else {
        // If no price ID, create a price on the fly
        const productData = {
          name: item.name
        };
        
        // Only add description if it exists and is not empty
        if (item.description && item.description.trim() !== '') {
          productData.description = item.description;
        }
        
        return {
          price_data: {
            currency: 'usd',
            product_data: productData,
            unit_amount: Math.round(item.price * 100), // Convert to cents
            recurring: {
              interval: item.billingInterval === 'year' ? 'year' : 'month'
            }
          },
          quantity: item.quantity || 1
        };
      }
    });

    // Create a subscription checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: successUrl || 'https://jmefit.com/checkout/success?session_id={CHECKOUT_SESSION_ID}',
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
    console.error('Error creating subscription checkout session:', error);

    // Handle specific Stripe errors
    let errorMessage = 'Failed to create subscription checkout session';
    let statusCode = 500;

    if (error.type) {
      switch (error.type) {
        case 'StripeCardError':
          // Card was declined
          errorMessage = 'Your card was declined. Please try a different payment method.';
          statusCode = 400;
          break;

        case 'StripeInvalidRequestError':
          // Invalid parameters sent to Stripe
          console.error('Invalid Stripe request:', error.message);
          errorMessage = 'Subscription configuration error. Please contact support with error code: INVALID_SUBSCRIPTION';
          statusCode = 400;
          break;

        case 'StripeAPIError':
          // Stripe API error
          console.error('Stripe API error:', error.message);
          errorMessage = 'Payment service temporarily unavailable. Please try again in a few minutes.';
          statusCode = 503;
          break;

        case 'StripeConnectionError':
          // Network error
          errorMessage = 'Network error. Please check your connection and try again.';
          statusCode = 503;
          break;

        case 'StripeAuthenticationError':
          // Authentication with Stripe failed
          console.error('Stripe authentication failed');
          errorMessage = 'Payment system configuration error. Please contact support with error code: AUTH_FAILED';
          statusCode = 500;
          break;

        case 'StripeRateLimitError':
          // Too many requests
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          statusCode = 429;
          break;

        default:
          errorMessage = error.message || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        errorType: error.type || 'UnknownError',
        timestamp: new Date().toISOString()
      })
    };
  }
};
