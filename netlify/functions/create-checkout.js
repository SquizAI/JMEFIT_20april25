// Netlify serverless function to create a Stripe checkout session
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

    // Filter out any subscription items - this function is for one-time payments only
    const oneTimeItems = items.filter(item => 
      !item.billingInterval || 
      item.billingInterval === 'one-time' ||
      item.name.includes('One-Time') ||
      item.name.includes('Shred')
    );

    if (oneTimeItems.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No one-time payment items provided for payment checkout' })
      };
    }

    // Map cart items to Stripe line items
    const lineItems = oneTimeItems.map(item => {
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
            unit_amount: Math.round(item.price * 100) // Convert to cents
          },
          quantity: item.quantity || 1
        };
      }
    });

    // Create a one-time payment checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link', 'cashapp'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || 'https://jmefit.com/checkout/success',
      cancel_url: cancelUrl || 'https://jmefit.com/checkout/canceled',
      customer_email: customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'en',
      // These parameters are only valid in payment mode
      customer_creation: 'always',
      payment_intent_data: {
        setup_future_usage: 'off_session'
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
    console.error('Error creating checkout session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Failed to create checkout session' 
      })
    };
  }
};
