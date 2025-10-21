const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs').promises;

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`
    };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      const session = stripeEvent.data.object;
      console.log('Checkout session completed:', session.id);
      
      // Handle the completed checkout
      await handleCheckoutCompleted(session);
      break;
    
    case 'payment_intent.succeeded':
      const paymentIntent = stripeEvent.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      break;
    
    case 'invoice.payment_succeeded':
      const invoice = stripeEvent.data.object;
      console.log('Invoice payment succeeded:', invoice.id);
      
      // Handle subscription invoice payment
      await handleInvoicePayment(invoice);
      break;
    
    case 'customer.subscription.created':
      const subscription = stripeEvent.data.object;
      console.log('Subscription created:', subscription.id);
      
      // Handle new subscription
      await handleSubscriptionCreated(subscription);
      break;
    
    case 'customer.subscription.updated':
      const updatedSubscription = stripeEvent.data.object;
      console.log('Subscription updated:', updatedSubscription.id);
      
      // Handle subscription update
      await handleSubscriptionUpdated(updatedSubscription);
      break;
    
    case 'customer.subscription.deleted':
      const deletedSubscription = stripeEvent.data.object;
      console.log('Subscription deleted:', deletedSubscription.id);
      
      // Handle subscription cancellation
      await handleSubscriptionDeleted(deletedSubscription);
      break;
    
    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return {
    statusCode: 200,
    body: JSON.stringify({received: true})
  };
};

async function handleCheckoutCompleted(session) {
  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(session.customer);
    
    // Get line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    });
    
    // Find user in database by email
    let { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', customer.email)
      .single();
    
    if (userError) {
      console.log('User not found in profiles, creating new user record');
      
      // Create user record in profiles table
      const newUserData = {
        email: customer.email,
        full_name: customer.name || customer.email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newUser, error: createUserError } = await supabase
        .from('profiles')
        .insert(newUserData)
        .select()
        .single();
      
      if (createUserError) {
        console.error('Error creating user profile:', createUserError);
        user = null;
      } else {
        console.log('User profile created successfully:', newUser.id);
        user = newUser;
      }
    }
    
    // Create order record
    if (user) {
      const orderData = {
        user_id: user.id,
        stripe_checkout_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        total_amount: session.amount_total, // Keep in cents
        currency: session.currency,
        status: 'completed',
        billing_address: session.customer_details?.address || null,
        shipping_address: session.shipping_address || null,
        metadata: {
          payment_status: session.payment_status,
          mode: session.mode
        }
      };
      
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
      } else {
        console.log('Order created successfully:', newOrder.id);
        
        // Create order items
        for (const item of lineItems.data) {
          // Find the product in our database
          const { data: product } = await supabase
            .from('products')
            .select('id')
            .eq('stripe_product_id', item.price.product.id)
            .single();
          
          // Find the price in our database
          const { data: price } = await supabase
            .from('prices')
            .select('id')
            .eq('stripe_price_id', item.price.id)
            .single();
          
          const orderItemData = {
            order_id: newOrder.id,
            product_id: product?.id || null,
            price_id: price?.id || null,
            quantity: item.quantity,
            amount: item.price.unit_amount * item.quantity, // Keep in cents
            metadata: {
              product_name: item.price.product.name,
              stripe_price_id: item.price.id,
              stripe_product_id: item.price.product.id,
              currency: item.price.currency
            }
          };
          
          const { error: itemError } = await supabase
            .from('order_items')
            .insert(orderItemData);
          
          if (itemError) {
            console.error('Error creating order item:', itemError);
          }
        }
      }
    }
    
    // Send confirmation email
    await sendConfirmationEmail(session, customer, lineItems);
    
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // Find user in database by email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', customer.email)
      .single();
    
    if (userError) {
      console.error('Error finding user for subscription:', userError);
      return;
    }
    
    // Create subscription record
    const subscriptionData = {
      id: subscription.id,
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      plan_id: subscription.items.data[0]?.price?.id,
      created_at: new Date().toISOString()
    };
    
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData);
    
    if (subError) {
      console.error('Error creating subscription:', subError);
    } else {
      console.log('Subscription created successfully:', subscription.id);
    }
    
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    // Update subscription record
    const subscriptionData = {
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: subError } = await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('stripe_subscription_id', subscription.id);
    
    if (subError) {
      console.error('Error updating subscription:', subError);
    } else {
      console.log('Subscription updated successfully:', subscription.id);
    }
    
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    // Update subscription status to cancelled
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    if (subError) {
      console.error('Error cancelling subscription:', subError);
    } else {
      console.log('Subscription cancelled successfully:', subscription.id);
    }
    
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handleInvoicePayment(invoice) {
  try {
    // This handles recurring subscription payments
    if (invoice.subscription) {
      console.log('Processing subscription invoice payment:', invoice.id);
      
      // Get customer details
      const customer = await stripe.customers.retrieve(invoice.customer);
      
      // Find user in database by email
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', customer.email)
        .single();
      
      if (userError) {
        console.error('Error finding user for invoice:', userError);
        return;
      }
      
      // Create payment record
      const paymentData = {
        id: invoice.id,
        user_id: user.id,
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: invoice.subscription,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency,
        status: 'paid',
        created_at: new Date().toISOString()
      };
      
      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData);
      
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      } else {
        console.log('Payment record created successfully:', invoice.id);
      }
    }
    
  } catch (error) {
    console.error('Error handling invoice payment:', error);
  }
}

async function sendConfirmationEmail(session, customer, lineItems) {
  try {
    console.log('📧 Starting email send process for:', customer.email);
    
    // Determine email template based on products
    let templateFile = 'shred-challenge-welcome.html'; // Default to SHRED template
    let subject = 'Welcome to the SHRED Challenge - Time to Transform! 🔥';
    let packageName = 'SHRED Challenge';
    
    // Check what products were purchased
    const productNames = lineItems.data.map(item => item.price.product.name.toLowerCase());
    console.log('📦 Products purchased:', productNames);
    
    // Determine template based on products
    if (productNames.some(name => name.includes('nutrition'))) {
      templateFile = 'nutrition-programs-welcome.html';
      subject = 'Welcome to JME FIT - Your Nutrition Journey Starts Now! 🎉';
      packageName = 'Nutrition Program';
    } else if (productNames.some(name => name.includes('training'))) {
      templateFile = 'self-led-training-welcome.html';
      subject = 'Welcome to JME FIT - Let\'s Get You Moving! 💪';
      packageName = 'Self-Led Training';
    } else if (productNames.some(name => name.includes('macro'))) {
      templateFile = 'one-time-macros-welcome.html';
      subject = 'Welcome to JME FIT - Your Macro Blueprint is Coming! 📊';
      packageName = 'One-Time Macros';
    }
    
    console.log('📧 Using template:', templateFile);
    console.log('📧 Package name:', packageName);
    
    // Load email template
    let emailTemplate;
    const possiblePaths = [
      path.join(__dirname, 'emails', templateFile),
      path.join(process.cwd(), 'src', 'emails', templateFile),
      path.join(__dirname, '..', '..', 'src', 'emails', templateFile)
    ];
    
    for (const templatePath of possiblePaths) {
      try {
        console.log('🔍 Trying template path:', templatePath);
        emailTemplate = await fs.readFile(templatePath, 'utf8');
        console.log('✅ Template loaded successfully from:', templatePath);
        break;
      } catch (pathError) {
        console.log('❌ Template path failed:', templatePath);
        continue;
      }
    }
    
    if (!emailTemplate) {
      console.log('📧 Using fallback template');
      // Fallback to a simple HTML template
      emailTemplate = `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://jmefit.com/JME_fit_black_purple.png" alt="JME FIT" style="max-width: 200px; height: auto;">
            </div>
            <h1 style="color: #8B5CF6; text-align: center;">Welcome to JME FIT!</h1>
            <p>Hi {{CUSTOMER_NAME}},</p>
            <p>Welcome to your fitness journey with JME FIT! We're excited to have you on board.</p>
            <p>Your package: <strong>{{PACKAGE_NAME}}</strong></p>
            <p>We'll be in touch soon with more details about your program.</p>
            <p>Best regards,<br>The JME FIT Team</p>
          </body>
        </html>
      `;
    }
    
    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    // Replace template variables
    const logoUrl = 'https://jmefit.com/JME_fit_black_purple.png';
    const customerName = customer.name || 'Valued Customer';
    
    let processedTemplate = emailTemplate
      .replace(/{{CUSTOMER_NAME}}/g, customerName)
      .replace(/{{clientName}}/g, customerName)
      .replace(/{{PACKAGE_NAME}}/g, packageName)
      .replace(/{{logoUrl}}/g, logoUrl)
      .replace(/{{LOGO_URL}}/g, logoUrl);
    
    // Email options
    const mailOptions = {
      from: process.env.DEFAULT_FROM_EMAIL || 'JME FIT Team <info@jmefit.com>',
      to: customer.email,
      subject: subject,
      html: processedTemplate,
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Confirmation email sent successfully to:', customer.email);
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
  }
} 