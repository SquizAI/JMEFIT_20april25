/**
 * Netlify Function: Validate Stripe Price ID
 *
 * Validates that a Stripe price ID exists and is active.
 * Returns price details if valid, error message if invalid.
 */

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

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        valid: false,
        error: 'Method not allowed. Use POST.'
      })
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    const { priceId } = data;

    // Validate input
    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          valid: false,
          price: null,
          error: 'Price ID is required'
        })
      };
    }

    if (typeof priceId !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          valid: false,
          price: null,
          error: 'Price ID must be a string'
        })
      };
    }

    // Check format
    if (!priceId.startsWith('price_')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          valid: false,
          price: null,
          error: 'Invalid price ID format. Must start with "price_"'
        })
      };
    }

    // Verify with Stripe API
    try {
      const price = await stripe.prices.retrieve(priceId, {
        expand: ['product']
      });

      // Check if price is active
      if (!price.active) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            valid: false,
            price: null,
            error: `Price ${priceId} exists but is not active in Stripe`
          })
        };
      }

      // Check if associated product is active
      if (price.product && typeof price.product === 'object' && !price.product.active) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            valid: false,
            price: null,
            error: `Price ${priceId} is active but its associated product is inactive`
          })
        };
      }

      // Price is valid and active
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: true,
          price: {
            id: price.id,
            amount: price.unit_amount,
            currency: price.currency,
            type: price.type,
            recurring: price.recurring,
            product: {
              id: typeof price.product === 'string' ? price.product : price.product.id,
              name: typeof price.product === 'object' ? price.product.name : null
            },
            active: price.active
          },
          error: null
        })
      };

    } catch (stripeError) {
      // Handle specific Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        // Price doesn't exist
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            valid: false,
            price: null,
            error: `Price ID ${priceId} does not exist in Stripe`
          })
        };
      }

      // Other Stripe errors
      console.error('Stripe API error:', stripeError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          valid: false,
          price: null,
          error: 'Failed to validate price with Stripe API'
        })
      };
    }

  } catch (error) {
    console.error('Error validating price ID:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        valid: false,
        price: null,
        error: error.message || 'Failed to validate price ID'
      })
    };
  }
};
