import { supabase } from '../supabase';
import type { Database } from '../database.types';
import { getStripe } from '../stripe';

export type Price = Database['public']['Tables']['prices']['Row'];

/**
 * Get all active prices
 */
export async function getPrices() {
  const { data, error } = await supabase
    .from('prices')
    .select('*, products(*)')
    .eq('active', true);

  if (error) throw error;
  return data;
}

/**
 * Get prices for a specific product
 */
export async function getProductPrices(productId: string) {
  const { data, error } = await supabase
    .from('prices')
    .select('*')
    .eq('product_id', productId)
    .eq('active', true);

  if (error) throw error;
  return data;
}

/**
 * Get a specific price by ID
 */
export async function getPriceById(priceId: string) {
  const { data, error } = await supabase
    .from('prices')
    .select('*, products(*)')
    .eq('id', priceId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new price in both Stripe and our database
 */
export async function createPrice({
  productId,
  amount,
  currency = 'usd',
  metadata = {}
}: {
  productId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
}) {
  // First get the product to get its Stripe product ID
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError || !product) throw new Error('Product not found');
  if (!product.stripe_product_id) throw new Error('Product has no Stripe ID');

  // Create price in Stripe
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe failed to initialize');

  const stripePrice = await stripe.prices.create({
    product: product.stripe_product_id,
    unit_amount: Math.round(amount * 100), // Stripe uses cents
    currency,
    metadata
  });

  // Create price in our database
  const { data: price, error: priceError } = await supabase
    .from('prices')
    .insert({
      product_id: productId,
      stripe_price_id: stripePrice.id,
      price: amount,
      currency,
      metadata,
      active: true
    })
    .select()
    .single();

  if (priceError) throw priceError;
  return price;
}

/**
 * Sync a price from Stripe to our database
 */
export async function syncPriceFromStripe(stripePriceId: string) {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe failed to initialize');

  // Get price from Stripe
  const stripePrice = await stripe.prices.retrieve(stripePriceId);
  
  // Find product by Stripe product ID
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('stripe_product_id', stripePrice.product)
    .single();
  
  if (productError || !product) {
    throw new Error(`Product with Stripe ID ${stripePrice.product} not found`);
  }

  // Check if price already exists
  const { data: existingPrice } = await supabase
    .from('prices')
    .select('*')
    .eq('stripe_price_id', stripePriceId)
    .single();

  if (existingPrice) {
    // Update existing price
    const { data: updatedPrice, error: updateError } = await supabase
      .from('prices')
      .update({
        price: stripePrice.unit_amount ? stripePrice.unit_amount / 100 : 0,
        currency: stripePrice.currency,
        active: stripePrice.active,
        metadata: stripePrice.metadata
      })
      .eq('id', existingPrice.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedPrice;
  } else {
    // Create new price
    const { data: newPrice, error: insertError } = await supabase
      .from('prices')
      .insert({
        product_id: product.id,
        stripe_price_id: stripePriceId,
        price: stripePrice.unit_amount ? stripePrice.unit_amount / 100 : 0,
        currency: stripePrice.currency,
        active: stripePrice.active,
        metadata: stripePrice.metadata
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newPrice;
  }
}

/**
 * Sync all prices for a product from Stripe
 */
export async function syncProductPricesFromStripe(productId: string) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError || !product || !product.stripe_product_id) {
    throw new Error('Product not found or has no Stripe ID');
  }

  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe failed to initialize');

  // Get all prices for this product from Stripe
  const stripePrices = await stripe.prices.list({
    product: product.stripe_product_id,
    limit: 100
  });

  const results = [];
  
  // Sync each price
  for (const stripePrice of stripePrices.data) {
    const result = await syncPriceFromStripe(stripePrice.id);
    results.push(result);
  }

  return results;
}

/**
 * Update a price (active status only)
 */
export async function updatePrice(priceId: string, active: boolean) {
  const { data, error } = await supabase
    .from('prices')
    .update({ active })
    .eq('id', priceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
