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
        // Check if we need to create a price in Stripe
        // In a production app, you would have prices already created in Stripe
        // and would use those price IDs directly
        let priceId;
        
        // For demo purposes, create a price on the fly
        // In production, you should use existing price IDs
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
        
        priceId = price.id;
        
        lineItems.push({
          price: priceId,
          quantity: 1,
        });
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
