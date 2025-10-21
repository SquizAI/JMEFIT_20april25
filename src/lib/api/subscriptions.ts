import { supabase } from '../supabase';
// Server-side Stripe operations moved to Netlify functions
import type { Database } from '../database.types';

export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
export type SubscriptionPrice = Database['public']['Tables']['subscription_prices']['Row'];

/**
 * Get all active subscription plans with their prices
 */
export async function getSubscriptionPlans() {
  try {
    // Import error handling utilities
    const { handleSupabaseError } = await import('../utils/supabase-errors');
    const { retrySupabaseQuery } = await import('../utils/retry-logic');

    // Fetch subscription plans with retry logic
    const plans = await retrySupabaseQuery(
      () => supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true as any)
        .order('created_at'),
      {
        maxRetries: 3,
        onRetry: (attempt, error) => {
          console.warn(`Retrying getSubscriptionPlans (attempt ${attempt}):`, error.message);
        }
      }
    );

    // If no plans, return empty array
    if (!plans || plans.length === 0) return [];

    // For each plan, get its prices separately
    const plansWithPrices = await Promise.all(
      plans.map(async (plan) => {
        try {
          const prices = await retrySupabaseQuery(
            () => supabase
              .from('subscription_prices')
              .select('*')
              .eq('subscription_plan_id', plan.id),
            { maxRetries: 2 } // Fewer retries for sub-queries
          );

          return {
            ...plan,
            subscription_prices: prices || []
          };
        } catch (error) {
          // Log but don't fail - return plan without prices
          const classified = handleSupabaseError(error, {
            operation: 'fetch_subscription_prices',
            table: 'subscription_prices',
            additionalInfo: { plan_id: plan.id }
          });
          console.warn(`Failed to fetch prices for plan ${plan.id}:`, classified.userMessage);

          return {
            ...plan,
            subscription_prices: []
          };
        }
      })
    );

    return plansWithPrices;
  } catch (error) {
    // Import error handling utilities
    const { handleSupabaseError } = await import('../utils/supabase-errors');

    const classified = handleSupabaseError(error, {
      operation: 'fetch_subscription_plans',
      table: 'subscription_plans'
    });

    // Log the classified error
    console.error('Failed to fetch subscription plans:', classified.logMessage);

    // Throw user-friendly error
    throw new Error(classified.userMessage);
  }
}

/**
 * Create a new subscription using a subscription price ID
 * NOTE: Server-side operations moved to Netlify functions
 */
export async function createSubscription(priceId: string) {
  try {
    // Create a checkout session via netlify function
    const response = await fetch('/.netlify/functions/create-subscription-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        priceId,
        successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`
      })
    });

    if (!response.ok) throw new Error('Failed to create subscription');
    const { sessionId } = await response.json();
    return { sessionId };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Create a new subscription plan in both Stripe and our database
 */
export async function createSubscriptionPlan({
  name,
  description,
  features = [],
  metadata = {}
}: {
  name: string;
  description: string;
  features?: string[];
  metadata?: Record<string, any>;
}) {
  // Use server-side Stripe
  const stripe = getServerStripe();
  
  try {
    // Create product in Stripe first
    const stripeProduct = await stripe.products.create({
      name,
      description,
      metadata: {
        ...metadata,
        features: JSON.stringify(features)
      }
    });

    // Then create subscription plan in our database
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        name,
        description,
        features,
        stripe_product_id: stripeProduct.id,
        active: true,
        metadata
      } as any) // Using 'as any' to bypass type error temporarily
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    throw error;
  }
}

/**
 * Create a new subscription price for a plan
 */
export async function createSubscriptionPrice({
  planId,
  amount,
  interval,
  currency = 'usd',
  metadata = {}
}: {
  planId: string;
  amount: number;
  interval: 'month' | 'year';
  currency?: string;
  metadata?: Record<string, any>;
}) {
  // Get the subscription plan to get its Stripe product ID
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId as any) // Using 'as any' to bypass type error temporarily
    .single();

  if (planError || !plan) throw new Error('Subscription plan not found');
  if (!plan.stripe_product_id) throw new Error('Plan has no Stripe product ID');

  // Use server-side Stripe
  const stripe = getServerStripe();
  
  try {
    // Create price in Stripe
    const stripePrice = await stripe.prices.create({
      product: plan.stripe_product_id as string, // Using 'as string' to bypass type error temporarily
      unit_amount: Math.round(amount * 100),
      currency,
      recurring: {
        interval
      },
      metadata
    });

    // Create price in our database
    const { data: price, error: priceError } = await supabase
      .from('subscription_prices')
      .insert({
        subscription_plan_id: planId,
        stripe_price_id: stripePrice.id,
        price: amount,
        interval,
        currency,
        recurring: true,
        active: true,
        metadata
      } as any) // Using 'as any' to bypass type error temporarily
      .select()
      .single();

    if (priceError) throw priceError;
    return price;
  } catch (error) {
    console.error('Error creating subscription price:', error);
    throw error;
  }
}