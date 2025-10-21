/**
 * Netlify Function: Get Stripe Prices
 *
 * Fetches all JMEFIT product prices from Stripe.
 * Returns formatted price data with caching to reduce API calls.
 */

// Ensure the API key is provided
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required but was not provided in environment variables');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// In-memory cache (1 hour TTL)
let priceCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * JMEFIT Product Price IDs
 * These are the canonical price IDs from Stripe
 */
const JMEFIT_PRICE_IDS = {
  // Nutrition Only
  NUTRITION_ONLY_MONTHLY: 'price_1RPb3HG00IiCtQkDK6blELBN',
  NUTRITION_ONLY_YEARLY: 'price_1RPb3NG00IiCtQkDRzrvSEOk',

  // Nutrition & Training
  NUTRITION_TRAINING_MONTHLY: 'price_1RPq65G00IiCtQkDvWPGX09T',
  NUTRITION_TRAINING_YEARLY: 'price_1RPq60G00IiCtQkDhEj1vQBr',

  // Self-Led Training
  SELF_LED_TRAINING_MONTHLY: 'price_1RPb3rG00IiCtQkDWSMYE6VP',
  SELF_LED_TRAINING_YEARLY: 'price_1RPb3wG00IiCtQkDGn5dPucz',

  // Trainer Feedback
  TRAINER_FEEDBACK_MONTHLY: 'price_1RPpiBG00IiCtQkDBBgajsyo',
  TRAINER_FEEDBACK_YEARLY: 'price_1RPb4CG00IiCtQkDWk5SOKce',

  // One-Time Products
  SHRED_CHALLENGE: 'price_1RPq5RG00IiCtQkD94kNa9AQ',
  ONE_TIME_MACROS: 'price_1RPq5aG00IiCtQkD30r2Csua'
};

/**
 * Fetch a price from Stripe with error handling
 */
async function fetchPrice(priceId) {
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product']
    });

    return {
      id: price.id,
      amount: price.unit_amount,
      currency: price.currency,
      type: price.type,
      recurring: price.recurring,
      active: price.active,
      product: {
        id: typeof price.product === 'string' ? price.product : price.product.id,
        name: typeof price.product === 'object' ? price.product.name : 'Unknown Product'
      }
    };
  } catch (error) {
    console.error(`Failed to fetch price ${priceId}:`, error.message);
    return null;
  }
}

/**
 * Fetch all JMEFIT prices from Stripe
 */
async function fetchAllPrices() {
  const prices = {};

  // Fetch all prices in parallel
  const pricePromises = Object.entries(JMEFIT_PRICE_IDS).map(async ([key, priceId]) => {
    const price = await fetchPrice(priceId);
    return { key, price };
  });

  const results = await Promise.all(pricePromises);

  // Build price object
  results.forEach(({ key, price }) => {
    if (price) {
      prices[key] = price;
    }
  });

  return prices;
}

/**
 * Get prices (from cache or Stripe)
 */
async function getPrices() {
  const now = Date.now();

  // Return cached prices if still valid
  if (priceCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('Returning cached prices');
    return { ...priceCache, cached: true };
  }

  // Fetch fresh prices from Stripe
  console.log('Fetching fresh prices from Stripe');
  const prices = await fetchAllPrices();

  // Update cache
  priceCache = prices;
  cacheTimestamp = now;

  return { ...prices, cached: false };
}

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=3600' // 1 hour cache
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed. Use GET.'
      })
    };
  }

  try {
    // Get prices (from cache or Stripe)
    const prices = await getPrices();

    // Calculate yearly savings
    const calculateSavings = (monthlyPrice, yearlyPrice) => {
      if (!monthlyPrice || !yearlyPrice) return null;
      const monthlyAmount = monthlyPrice.amount || 0;
      const yearlyAmount = yearlyPrice.amount || 0;
      const annualMonthly = monthlyAmount * 12;
      const savings = annualMonthly - yearlyAmount;
      const savingsPercent = Math.round((savings / annualMonthly) * 100);
      return { savings, savingsPercent };
    };

    // Format response with calculated savings
    const response = {
      prices,
      savings: {
        nutritionOnly: calculateSavings(
          prices.NUTRITION_ONLY_MONTHLY,
          prices.NUTRITION_ONLY_YEARLY
        ),
        nutritionTraining: calculateSavings(
          prices.NUTRITION_TRAINING_MONTHLY,
          prices.NUTRITION_TRAINING_YEARLY
        ),
        selfLedTraining: calculateSavings(
          prices.SELF_LED_TRAINING_MONTHLY,
          prices.SELF_LED_TRAINING_YEARLY
        ),
        trainerFeedback: calculateSavings(
          prices.TRAINER_FEEDBACK_MONTHLY,
          prices.TRAINER_FEEDBACK_YEARLY
        )
      },
      cached: prices.cached,
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error fetching Stripe prices:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to fetch Stripe prices',
        timestamp: new Date().toISOString()
      })
    };
  }
};
