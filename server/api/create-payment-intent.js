import Stripe from 'stripe';
import express from 'express';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);
const router = express.Router();

/**
 * Creates a Stripe Payment Intent for mobile checkout
 * 
 * Request body:
 * {
 *   items: [{ id, price, name, billingInterval }],
 *   customerEmail: string (optional),
 *   giftRecipientEmail: string (optional)
 * }
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { items, customerEmail, giftRecipientEmail } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // Calculate total amount from items
    const amount = items.reduce((sum, item) => sum + item.price, 0);
    const amountInCents = Math.round(amount * 100); // Convert to cents

    // Prepare metadata
    const metadata = {};
    
    // For each item in the cart, add to metadata
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      metadata[`item_${i}_id`] = item.id;
      metadata[`item_${i}_name`] = item.name;
      metadata[`item_${i}_price`] = item.price.toString();
      if (item.billingInterval) {
        metadata[`item_${i}_billing_interval`] = item.billingInterval;
      }
    }
    
    // Add customer email to metadata if provided
    if (customerEmail) {
      metadata.customer_email = customerEmail;
    }
    
    // Add gift recipient email to metadata if provided
    if (giftRecipientEmail) {
      metadata.gift_recipient_email = giftRecipientEmail;
      metadata.is_gift = 'true';
    }

    // Create payment intent options
    const paymentIntentOptions = {
      amount: amountInCents,
      currency: 'usd',
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    // Send client secret to the client
    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
