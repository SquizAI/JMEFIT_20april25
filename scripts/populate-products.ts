/**
 * Product Population Script
 * 
 * This script populates the Supabase database with initial product data.
 * It creates one-time products and subscription plans with their respective prices.
 */

import { createProduct, updateProduct } from '../src/lib/api/products';
import { createSubscriptionPlan, createSubscriptionPrice } from '../src/lib/api/subscriptions';

/**
 * One-time Products
 */
async function createOneTimeProducts() {
  console.log('Creating one-time products...');
  
  // Macros Calculation
  const macrosProduct = await createProduct({
    name: 'Macros Calculation',
    description: 'Custom macro calculations tailored to your goals and body composition',
    imageUrl: '/images/macros-calculation.jpg',
    metadata: {
      display_order: 1,
      color: '#4F46E5', // Indigo
      icon: 'calculator',
      featured: true,
      product_type: 'one-time'
    }
  });
  
  console.log('Created Macros Calculation product:', macrosProduct.id);
  
  // SHRED Challenge
  const shredProduct = await createProduct({
    name: 'SHRED Challenge',
    description: '8-week transformation challenge with personalized nutrition and training',
    imageUrl: '/images/shred-challenge.jpg',
    metadata: {
      display_order: 2,
      color: '#EF4444', // Red
      icon: 'fire',
      featured: true,
      product_type: 'one-time'
    }
  });
  
  console.log('Created SHRED Challenge product:', shredProduct.id);
  
  return {
    macrosProduct,
    shredProduct
  };
}

/**
 * Subscription Products
 */
async function createSubscriptionProducts() {
  console.log('Creating subscription products...');
  
  // Nutrition Only
  const nutritionPlan = await createSubscriptionPlan({
    name: 'Nutrition Only',
    description: 'Custom nutrition planning and coaching',
    features: [
      'Custom macro calculations',
      'Personalized meal plans',
      'Weekly check-ins with coach',
      'Recipe database access',
      'Nutrition education materials'
    ],
    metadata: {
      display_order: 1,
      color: '#10B981', // Emerald
      icon: 'apple',
      featured: true
    }
  });
  
  console.log('Created Nutrition Only plan:', nutritionPlan.id);
  
  // Nutrition & Training
  const nutritionTrainingPlan = await createSubscriptionPlan({
    name: 'Nutrition & Training',
    description: 'Comprehensive nutrition and workout programming',
    features: [
      'All features from Nutrition Only',
      'Custom workout programming',
      'Form check videos',
      'Weekly progress tracking',
      'Private community access'
    ],
    metadata: {
      display_order: 2,
      color: '#8B5CF6', // Purple
      icon: 'dumbbell',
      featured: true
    }
  });
  
  console.log('Created Nutrition & Training plan:', nutritionTrainingPlan.id);
  
  // Self-Led Training
  const selfLedPlan = await createSubscriptionPlan({
    name: 'Self-Led Training',
    description: 'Access to workout library and basic tracking',
    features: [
      'Workout library access',
      'Basic progress tracking',
      'Exercise technique guides',
      'Monthly workout templates'
    ],
    metadata: {
      display_order: 3,
      color: '#F59E0B', // Amber
      icon: 'chart',
      featured: true
    }
  });
  
  console.log('Created Self-Led Training plan:', selfLedPlan.id);
  
  // Trainer Feedback
  const trainerFeedbackPlan = await createSubscriptionPlan({
    name: 'Trainer Feedback',
    description: 'Get form checks and feedback from professional trainers',
    features: [
      'Form check video reviews',
      'Exercise technique correction',
      'Monthly program adjustments',
      'Personalized progress recommendations'
    ],
    metadata: {
      display_order: 4,
      color: '#EC4899', // Pink
      icon: 'video',
      featured: true
    }
  });
  
  console.log('Created Trainer Feedback plan:', trainerFeedbackPlan.id);
  
  return {
    nutritionPlan,
    nutritionTrainingPlan,
    selfLedPlan,
    trainerFeedbackPlan
  };
}

/**
 * Create prices for one-time products
 */
async function createOneTimePrices(products: any) {
  console.log('Creating prices for one-time products...');
  
  // For Macros Calculation - $99
  const macrosPriceRes = await fetch('/api/prices/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: products.macrosProduct.id,
      price: 9900, // $99.00 in cents
      currency: 'usd',
      metadata: {
        product_type: 'one-time'
      }
    }),
  });
  
  // For SHRED Challenge - $249
  const shredPriceRes = await fetch('/api/prices/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: products.shredProduct.id,
      price: 24900, // $249.00 in cents
      currency: 'usd',
      metadata: {
        product_type: 'one-time'
      }
    }),
  });
  
  console.log('Created prices for one-time products');
}

/**
 * Create prices for subscription products
 */
async function createSubscriptionPrices(subscriptionPlans: any) {
  console.log('Creating prices for subscription products...');
  
  // Nutrition Only
  // Monthly - $149
  await createSubscriptionPrice({
    planId: subscriptionPlans.nutritionPlan.id,
    amount: 14900, // $149.00 in cents
    interval: 'month',
    metadata: {
      display_name: 'Monthly'
    }
  });
  
  // Yearly - $1430 (save 20%)
  await createSubscriptionPrice({
    planId: subscriptionPlans.nutritionPlan.id,
    amount: 143000, // $1430.00 in cents
    interval: 'year',
    metadata: {
      display_name: 'Yearly (Save 20%)'
    }
  });
  
  // Nutrition & Training
  // Monthly - $199
  await createSubscriptionPrice({
    planId: subscriptionPlans.nutritionTrainingPlan.id,
    amount: 19900, // $199.00 in cents
    interval: 'month',
    metadata: {
      display_name: 'Monthly'
    }
  });
  
  // Yearly - $1910 (save 20%)
  await createSubscriptionPrice({
    planId: subscriptionPlans.nutritionTrainingPlan.id,
    amount: 191000, // $1910.00 in cents
    interval: 'year',
    metadata: {
      display_name: 'Yearly (Save 20%)'
    }
  });
  
  // Self-Led Training
  // Monthly - $19.99
  await createSubscriptionPrice({
    planId: subscriptionPlans.selfLedPlan.id,
    amount: 1999, // $19.99 in cents
    interval: 'month',
    metadata: {
      display_name: 'Monthly'
    }
  });
  
  // Yearly - $191.90 (save 20%)
  await createSubscriptionPrice({
    planId: subscriptionPlans.selfLedPlan.id,
    amount: 19190, // $191.90 in cents
    interval: 'year',
    metadata: {
      display_name: 'Yearly (Save 20%)'
    }
  });
  
  // Trainer Feedback
  // Monthly - $34.99
  await createSubscriptionPrice({
    planId: subscriptionPlans.trainerFeedbackPlan.id,
    amount: 3499, // $34.99 in cents
    interval: 'month',
    metadata: {
      display_name: 'Monthly'
    }
  });
  
  // Yearly - $335.90 (save 20%)
  await createSubscriptionPrice({
    planId: subscriptionPlans.trainerFeedbackPlan.id,
    amount: 33590, // $335.90 in cents
    interval: 'year',
    metadata: {
      display_name: 'Yearly (Save 20%)'
    }
  });
  
  console.log('Created prices for subscription products');
}

/**
 * Main function to execute the script
 */
async function main() {
  try {
    // Create one-time products
    const oneTimeProducts = await createOneTimeProducts();
    
    // Create subscription products
    const subscriptionPlans = await createSubscriptionProducts();
    
    // Create prices for one-time products
    await createOneTimePrices(oneTimeProducts);
    
    // Create prices for subscription products
    await createSubscriptionPrices(subscriptionPlans);
    
    console.log('Database populated successfully!');
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

// Run the script
main();
