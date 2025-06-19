/**
 * Stripe Products Utility
 * 
 * This module contains the product catalog and utility functions for working
 * with Stripe pricing and products.
 */

// Define the types for our price structure
interface PriceOption {
  amount: number;
  id: string;
  savings?: number;
}

interface SubscriptionPrices {
  month: PriceOption;
  year: PriceOption;
}

interface OneTimePrices {
  one_time: PriceOption;
}

type ProductPrices = SubscriptionPrices | OneTimePrices;

interface Product {
  name: string;
  description: string;
  features: string[];
  prices: ProductPrices;
}

type ProductCatalog = {
  [key: string]: Product;
};

// Define product catalog with pricing information
export const STRIPE_PRODUCTS: ProductCatalog = {
  'NUTRITION_ONLY': {
    name: 'Nutrition Only',
    description: 'Custom nutrition plan tailored to your goals',
    features: [
      'Personalized nutrition plan',
      'Macros calculation',
      'Meal planning guide',
      'Monthly adjustments'
    ],
    prices: {
      month: {
        amount: 17900, // $179 in cents - MATCHES STRIPE
        id: 'price_1RPb3HG00IiCtQkDK6blELBN'
      },
      year: {
        amount: 171840, // $1718.40 in cents - MATCHES STRIPE
        id: 'price_1RPb3NG00IiCtQkDRzrvSEOk',
        savings: 20
      }
    }
  },
  'NUTRITION_TRAINING': {
    name: 'Nutrition & Training Program',
    description: 'Our most popular program includes nutrition and training',
    features: [
      'Personalized nutrition plan',
      'Custom workout programming',
      'Weekly check-ins and adjustments',
      'Access to mobile app',
      'Form check videos'
    ],
    prices: {
      month: {
        amount: 24900, // $249 in cents - MATCHES STRIPE
        id: 'price_1RPq65G00IiCtQkDvWPGX09T'
      },
      year: {
        amount: 239040, // $2390.40 in cents - MATCHES STRIPE
        id: 'price_1RPq60G00IiCtQkDhEj1vQBr',
        savings: 20
      }
    }
  },
  'SELF_LED_TRAINING': {
    name: 'Self-Led Training Program',
    description: 'Workout plans you can follow on your own',
    features: [
      'Workout programming based on goals',
      'Video exercise guides',
      'Progress tracking',
      'Access to mobile app'
    ],
    prices: {
      month: {
        amount: 2499, // $24.99 in cents - MATCHES STRIPE
        id: 'price_1RPb3rG00IiCtQkDWSMYE6VP'
      },
      year: {
        amount: 23990, // $239.90 in cents - MATCHES STRIPE
        id: 'price_1RPb3wG00IiCtQkDGn5dPucz',
        savings: 20
      }
    }
  },
  'TRAINER_FEEDBACK': {
    name: 'Trainer Feedback Program',
    description: 'Get personalized coaching feedback on your workouts',
    features: [
      'Form check videos',
      'Weekly feedback',
      'Program adjustments',
      'Direct trainer access'
    ],
    prices: {
      month: {
        amount: 4999, // $49.99 in cents - MATCHES STRIPE
        id: 'price_1RPpiBG00IiCtQkDBBgajsyo'
      },
      year: {
        amount: 43190, // $431.90 in cents - MATCHES STRIPE
        id: 'price_1RPb4CG00IiCtQkDWk5SOKce',
        savings: 20
      }
    }
  },
  'SHRED_CHALLENGE': {
    name: 'SHRED Challenge',
    description: '8-week program to lose fat and build lean muscle',
    features: [
      'Complete 8-week program',
      'Nutrition guide',
      'Daily workouts',
      'Community support'
    ],
    prices: {
      one_time: {
        amount: 29700, // $297 in cents - MATCHES STRIPE
        id: 'price_1RPq5RG00IiCtQkD94kNa9AQ'
      }
    }
  },
  'ONE_TIME_MACROS': {
    name: 'One-Time Macros Calculation',
    description: 'Get your customized macro targets based on your goals',
    features: [
      'Personalized macro targets',
      'Nutritional guidelines',
      'PDF guide',
      'One-time purchase'
    ],
    prices: {
      one_time: {
        amount: 9900, // $99 in cents - MATCHES STRIPE
        id: 'price_1RPq5aG00IiCtQkD30r2Csua'
      }
    }
  }
};

/**
 * Get the price amount for a product and interval
 */
export const getPriceAmount = (productKey: string, interval?: string): number => {
  const product = STRIPE_PRODUCTS[productKey];
  if (!product) {
    console.error(`Product not found: ${productKey}`);
    return 0;
  }
  
  // One-time products
  if ('one_time' in product.prices) {
    return product.prices.one_time.amount;
  }
  
  // Subscription products
  const subscriptionPrices = product.prices as SubscriptionPrices;
  if (!interval || interval === 'month') {
    // Default to monthly if no interval specified
    return subscriptionPrices.month?.amount || 0;
  }
  
  if (interval === 'year') {
    return subscriptionPrices.year?.amount || 0;
  }
  
  return 0;
};

/**
 * Get the Stripe price ID for a product and interval
 */
export const getPriceId = (productKey: string, interval?: string): string => {
  const product = STRIPE_PRODUCTS[productKey];
  if (!product) {
    console.error(`Product not found: ${productKey}`);
    return '';
  }
  
  // One-time products
  if ('one_time' in product.prices) {
    return product.prices.one_time.id;
  }
  
  // Subscription products
  if (!interval) {
    // Default to monthly if no interval specified
    return (product.prices as SubscriptionPrices).month?.id || '';
  }
  
  return (product.prices as SubscriptionPrices)[interval as keyof SubscriptionPrices]?.id || '';
};

/**
 * Format a price amount for display
 */
export const formatPrice = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount / 100); // Convert cents to dollars
}; 