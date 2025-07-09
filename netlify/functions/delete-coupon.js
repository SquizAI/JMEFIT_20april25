const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { couponId } = JSON.parse(event.body);

    // Validate required fields
    if (!couponId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Coupon ID is required' })
      };
    }

    // Delete the coupon in Stripe
    const deletedCoupon = await stripe.coupons.del(couponId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        success: true,
        deleted: deletedCoupon.id 
      })
    };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: error.message || 'Invalid coupon ID'
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to delete coupon',
        details: error.message 
      })
    };
  }
}; 