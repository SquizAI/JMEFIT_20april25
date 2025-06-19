const stripe = require('stripe')(process.env.VITE_STRIPE_SECRET_KEY);

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
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { items, successUrl, cancelUrl, customerEmail, giftRecipientEmail } = data;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Items are required and must be an array' })
      };
    }

    if (!successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Success and cancel URLs are required' })
      };
    }

    // Format line items for Stripe
    const lineItems = items.map(item => {
      // If the item has a stripe_price_id, use that directly
      if (item.stripe_price_id) {
        return {
          price: item.stripe_price_id,
          quantity: item.quantity || 1
        };
      }
      
      // Otherwise, create a price on the fly
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || '',
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
          recurring: item.billingInterval ? {
            interval: item.billingInterval
          } : undefined
        },
        quantity: item.quantity || 1
      };
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: items.some(item => item.billingInterval) ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: giftRecipientEmail ? { gift_recipient_email: giftRecipientEmail } : undefined
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
    console.error('Stripe checkout error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'An error occurred creating the checkout session'
      })
    };
  }
};
