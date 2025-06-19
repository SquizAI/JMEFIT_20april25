import Stripe from 'stripe';
import express from 'express';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);
const router = express.Router();

/**
 * Creates a Stripe Checkout session for subscription products
 * 
 * Request body:
 * {
 *   items: [{ id, price, name, billingInterval }],
 *   successUrl: string,
 *   cancelUrl: string,
 *   customerEmail: string (optional)
 * }
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, successUrl, cancelUrl, customerEmail } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // Create line items for Stripe Checkout
    const lineItems = [];
    const metadata = {};

    // For each item in the cart, create a line item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // For subscription products
      if (item.billingInterval) {
        // Use the stripe_price_id from the frontend if available
        if (item.stripe_price_id) {
          console.log(`Using existing price ID from frontend: ${item.stripe_price_id}`);          
          lineItems.push({
            price: item.stripe_price_id,
            quantity: 1,
          });
        } else {
          // Fallback: create a price on the fly if no stripe_price_id is provided
          console.log(`No price ID provided for ${item.name}, creating one on the fly`);          
          const price = await stripe.prices.create({
            unit_amount: Math.round(item.price * 100), // Convert to cents
            currency: 'usd',
            recurring: {
              interval: item.billingInterval,
            },
            product_data: {
              name: item.name,
            },
          });
          
          lineItems.push({
            price: price.id,
            quantity: 1,
          });
        }
      } else {
        // For one-time products
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: 1,
        });
      }
      
      // Add item details to metadata
      metadata[`item_${i}_id`] = item.id;
      metadata[`item_${i}_name`] = item.name;
      metadata[`item_${i}_price`] = item.price.toString();
      if (item.billingInterval) {
        metadata[`item_${i}_billing_interval`] = item.billingInterval;
      }
    }

    // Create the checkout session
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: items.some(item => item.billingInterval) ? 'subscription' : 'payment',
      success_url: successUrl || `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/checkout?canceled=true`,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    };
    
    // If customer email is provided, add it to the session
    // This will link the payment to their account
    if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
