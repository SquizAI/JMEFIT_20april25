const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // List all coupons from Stripe
    const coupons = await stripe.coupons.list({
      limit: 100 // Adjust as needed
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(coupons.data)
    };
  } catch (error) {
    console.error('Error listing coupons:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to list coupons',
        details: error.message 
      })
    };
  }
}; 