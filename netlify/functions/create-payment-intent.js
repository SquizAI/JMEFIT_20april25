// Netlify serverless function to create a payment intent for one-time payments
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
    const { priceId, userId, customerId, metadata = {} } = data;

    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No price ID provided' })
      };
    }

    // Get the price from Stripe
    const price = await stripe.prices.retrieve(priceId);
    
    if (!price || !price.active) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid or inactive price' })
      };
    }

    // Get the product from Stripe
    const product = await stripe.products.retrieve(price.product);
    
    if (!product || !product.active) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid or inactive product' })
      };
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link', 'cashapp'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: data.success_url || 'https://jmefit.com/checkout/success',
      cancel_url: data.cancel_url || 'https://jmefit.com/checkout/canceled',
      customer: customerId,
      customer_email: data.customerEmail,
      client_reference_id: userId,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'en',
      metadata: {
        ...metadata,
        userId: userId
      }
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
    console.error('Error creating payment intent:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Failed to create payment intent' 
      })
    };
  }
};
