const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check if webhook endpoint already exists
    const existingEndpoints = await stripe.webhookEndpoints.list({
      limit: 100
    });
    
    const webhookUrl = 'https://jmefit.com/.netlify/functions/stripe-webhook';
    const existingEndpoint = existingEndpoints.data.find(endpoint => 
      endpoint.url === webhookUrl
    );
    
    if (existingEndpoint) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Webhook endpoint already exists',
          endpoint: {
            id: existingEndpoint.id,
            url: existingEndpoint.url,
            status: existingEndpoint.status,
            events: existingEndpoint.enabled_events
          },
          secret: 'Already configured - check your existing endpoint'
        })
      };
    }

    // Create new webhook endpoint
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'payment_intent.succeeded',
        'invoice.payment_succeeded',
        'checkout.session.async_payment_succeeded',
        'checkout.session.async_payment_failed'
      ],
      description: 'JMEFit Checkout Confirmation Webhook'
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Webhook endpoint created successfully',
        endpoint: {
          id: webhookEndpoint.id,
          url: webhookEndpoint.url,
          status: webhookEndpoint.status,
          events: webhookEndpoint.enabled_events
        },
        secret: webhookEndpoint.secret,
        instructions: {
          step1: 'Copy the webhook secret (starts with whsec_)',
          step2: 'Go to https://app.netlify.com/projects/jmefitlanding/settings/deploys#environment-variables',
          step3: 'Add environment variable: STRIPE_WEBHOOK_SECRET = [the secret above]',
          step4: 'Redeploy your site with: netlify deploy --prod'
        }
      })
    };

  } catch (error) {
    console.error('Error setting up webhook:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: 'Failed to create webhook endpoint'
      })
    };
  }
}; 