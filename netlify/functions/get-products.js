// Netlify serverless function to get products and prices from Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required but was not provided in environment variables');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
    // Get all active products
    const productsResponse = await stripe.products.list({
      active: true,
      limit: 100,
    });

    // Get all prices
    const pricesResponse = await stripe.prices.list({
      active: true,
      limit: 100,
    });

    // Filter out inactive products and get all essential data
    const products = productsResponse.data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      default_price: product.default_price,
      metadata: product.metadata,
      active: product.active
    }));

    // Filter and map prices to get essential data
    const prices = pricesResponse.data.map(price => ({
      id: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring,
      product: price.product
    }));

    // Return the data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        products,
        prices
      })
    };
  } catch (error) {
    console.error('Error fetching products and prices from Stripe:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Failed to fetch products and prices from Stripe' 
      })
    };
  }
};
