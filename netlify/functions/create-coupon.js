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
    const { name, type, value, duration, duration_in_months, redeem_by } = JSON.parse(event.body);

    // Validate required fields
    if (!name || !type || !value || !duration) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create coupon parameters
    const couponParams = {
      name: name,
      duration: duration,
      id: name.toUpperCase().replace(/[^A-Z0-9]/g, '') // Generate clean ID from name
    };

    // Add percentage or amount off
    if (type === 'percent') {
      couponParams.percent_off = parseFloat(value);
    } else {
      couponParams.amount_off = Math.round(parseFloat(value) * 100); // Convert to cents
      couponParams.currency = 'usd';
    }

    // Add duration in months if repeating
    if (duration === 'repeating' && duration_in_months) {
      couponParams.duration_in_months = parseInt(duration_in_months);
    }

    // Add expiration date if provided
    if (redeem_by) {
      // Ensure the timestamp is in the future
      const now = Math.floor(Date.now() / 1000);
      if (redeem_by <= now) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Expiration date must be in the future' })
        };
      }
      couponParams.redeem_by = redeem_by;
    }

    // Create the coupon in Stripe
    const coupon = await stripe.coupons.create(couponParams);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(coupon)
    };
  } catch (error) {
    console.error('Error creating coupon:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: error.message || 'Invalid coupon parameters'
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create coupon',
        details: error.message 
      })
    };
  }
}; 