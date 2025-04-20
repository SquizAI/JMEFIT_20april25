import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { getServerStripe } from '../../../lib/stripe';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { product_id, price, currency = 'usd', metadata = {} } = req.body;

    if (!product_id || price === undefined) {
      return res.status(400).json({ error: 'product_id and price are required' });
    }

    // Get the product from our database to get the Stripe product ID
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stripe_product_id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const stripe = getServerStripe();

    // Create the price in Stripe
    const stripePrice = await stripe.prices.create({
      product: product.stripe_product_id,
      unit_amount: price,
      currency,
      metadata
    });

    // Create the price in our database
    const { data: dbPrice, error: dbPriceError } = await supabase
      .from('prices')
      .insert({
        product_id,
        stripe_price_id: stripePrice.id,
        price,
        currency,
        active: true,
        metadata
      })
      .select()
      .single();

    if (dbPriceError) {
      // Try to clean up the Stripe price if DB insert fails
      await stripe.prices.update(stripePrice.id, { active: false });
      return res.status(500).json({ error: 'Failed to create price in database' });
    }

    return res.status(201).json(dbPrice);
  } catch (error) {
    console.error('Error creating price:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
