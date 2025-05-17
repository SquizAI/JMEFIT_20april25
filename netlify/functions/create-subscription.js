// Netlify serverless function to create a subscription checkout session
// This function handles products that should conceptually be treated as subscriptions
// even if they're configured as one-time payments in Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required but was not provided in environment variables');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Define the prices that should be treated as subscriptions
// Format: priceId: { interval: 'month' or 'year' }
const SUBSCRIPTION_PRICES = {
  // Trainer Feedback Program
  'price_1RPpiBG00IiCtQkDBBgajsyo': { interval: 'month' },
  'price_1RPb4CG00IiCtQkDWk5SOKce': { interval: 'year' },
  
  // Self-Led Training Program
  'price_1RPb3wG00IiCtQkDGn5dPucz': { interval: 'year' },
  'price_1RPb3rG00IiCtQkDWSMYE6VP': { interval: 'month' },
  
  // Nutrition & Training
  'price_1RPb3fG00IiCtQkDkYMCoapu': { interval: 'year' },
  'price_1RPb3aG00IiCtQkD8Jd1Rvdj': { interval: 'month' },
  
  // Nutrition Only
  'price_1RPb3NG00IiCtQkDRzrvSEOk': { interval: 'year' },
  'price_1RPb3HG00IiCtQkDK6blELBN': { interval: 'month' }
};

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

    // Check if this is a subscription price (either by Stripe recurring field or our mapping)
    const isSubscription = price.recurring || SUBSCRIPTION_PRICES[priceId];
    
    if (!isSubscription) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Price is not a subscription price' })
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

    // For prices that have recurring property, use subscription mode
    // For prices configured as one-time but treated as subscriptions, use payment mode
    const mode = price.recurring ? 'subscription' : 'payment';
    
    // Add the interval to metadata so we can track this on the application side
    const subscriptionInfo = SUBSCRIPTION_PRICES[priceId] || {};
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
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
        userId: userId,
        isSubscription: 'true',
        billingInterval: subscriptionInfo.interval || 'unknown',
        applicationSubscription: 'true' // Flag to identify as a subscription in our app
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
    console.error('Error creating subscription:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Failed to create subscription' 
      })
    };
  }
};
