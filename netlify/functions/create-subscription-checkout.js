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

    // Filter out any non-subscription items
    const subscriptionItems = items.filter(item => 
      item.billingInterval === 'month' || item.billingInterval === 'year'
    );

    if (subscriptionItems.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No subscription items provided for subscription checkout' })
      };
    }

    // Map subscription items to Stripe line items
    const lineItems = subscriptionItems.map(item => {
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
            unit_amount: Math.round(item.price * 100), // Convert to cents
            recurring: {
              interval: item.billingInterval === 'year' ? 'year' : 'month'
            }
          },
          quantity: item.quantity || 1
        };
      }
    });

    // Create a subscription checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: successUrl || 'https://jmefit.com/checkout/success',
      cancel_url: cancelUrl || 'https://jmefit.com/checkout/canceled',
      customer_email: customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'en'
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
    console.error('Error creating subscription checkout session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'An error occurred while creating the checkout session' 
      })
    };
  }
};
