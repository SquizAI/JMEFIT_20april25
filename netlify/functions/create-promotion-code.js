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
    const { couponId, code, active = true, maxRedemptions, expiresAt } = JSON.parse(event.body);

    // Validate required fields
    if (!couponId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Coupon ID is required' })
      };
    }

    // Verify the coupon exists
    const coupon = await stripe.coupons.retrieve(couponId);
    if (!coupon || !coupon.valid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid or inactive coupon' })
      };
    }

    // Create promotion code parameters
    const promotionCodeParams = {
      coupon: couponId,
      active: active
    };

    // Use provided code or default to coupon ID
    if (code) {
      promotionCodeParams.code = code;
    } else {
      promotionCodeParams.code = couponId;
    }

    // Add optional parameters
    if (maxRedemptions) {
      promotionCodeParams.max_redemptions = parseInt(maxRedemptions);
    }

    if (expiresAt) {
      promotionCodeParams.expires_at = parseInt(expiresAt);
    }

    // Create the promotion code in Stripe
    const promotionCode = await stripe.promotionCodes.create(promotionCodeParams);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: true,
        promotionCode: promotionCode,
        customerCode: promotionCode.code,
        message: `Promotion code created successfully. Customers can use code: ${promotionCode.code}`
      })
    };
  } catch (error) {
    console.error('Error creating promotion code:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: error.message || 'Invalid promotion code parameters'
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create promotion code',
        details: error.message 
      })
    };
  }
}; 