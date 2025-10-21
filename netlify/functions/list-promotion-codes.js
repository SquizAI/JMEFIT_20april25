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
    // Get promotion codes from Stripe
    const promotionCodes = await stripe.promotionCodes.list({
      limit: 100,
      active: true
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: promotionCodes.data.map(code => ({
          id: code.id,
          code: code.code,
          coupon: {
            id: code.coupon.id,
            name: code.coupon.name,
            percent_off: code.coupon.percent_off,
            amount_off: code.coupon.amount_off,
            currency: code.coupon.currency
          },
          active: code.active,
          times_redeemed: code.times_redeemed,
          max_redemptions: code.max_redemptions,
          expires_at: code.expires_at
        }))
      })
    };
  } catch (error) {
    console.error('Error listing promotion codes:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}; 