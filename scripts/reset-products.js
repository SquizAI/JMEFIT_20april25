// Script to reset products table and add only JmeFit products
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Configure dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetProducts() {
  try {
    console.log('Resetting products table...');
    
    // Delete all products
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('Error deleting all products:', deleteError.message);
      // Continue anyway
    } else {
      console.log('All products deleted successfully.');
    }
    
    // Create JmeFit products
    const jmefitProducts = [
      {
        id: uuidv4(),
        name: 'Nutrition Only - Monthly',
        description: 'Custom nutrition plan, guidance & anytime support. 3-month minimum commitment.',
        image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_nutrition_only_monthly',
        active: true,
        metadata: {
          type: 'subscription',
          duration: 'monthly',
          price: 14900, // $149.00
          commitment: '3-month',
          features: [
            'Personalized macro calculations',
            'Weekly check-ins and adjustments',
            'Custom meal planning guidance',
            '24/7 chat support with Jaime'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Nutrition Only - Yearly',
        description: 'Custom nutrition plan, guidance & anytime support with 20% discount. 3-month minimum commitment.',
        image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_nutrition_only_yearly',
        active: true,
        metadata: {
          type: 'subscription',
          duration: 'yearly',
          price: 119200, // $1,192.00 yearly ($119.20/month × 10 months)
          monthly_equivalent: 11920, // $119.20
          commitment: '3-month',
          features: [
            'Personalized macro calculations',
            'Weekly check-ins and adjustments',
            'Custom meal planning guidance',
            '24/7 chat support with Jaime',
            'Save $357.60 per year'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Nutrition & Training - Monthly',
        description: 'Complete transformation package with nutrition and custom workouts. 3-month minimum commitment.',
        image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_nutrition_training_monthly',
        active: true,
        metadata: {
          type: 'subscription',
          duration: 'monthly',
          price: 19900, // $199.00
          commitment: '3-month',
          features: [
            'Everything in Nutrition Only',
            'Customized training program',
            'Form check videos & feedback',
            'Premium app features'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Nutrition & Training - Yearly',
        description: 'Complete transformation package with nutrition and custom workouts with 20% discount. 3-month minimum commitment.',
        image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_nutrition_training_yearly',
        active: true,
        metadata: {
          type: 'subscription',
          duration: 'yearly',
          price: 159200, // $1,592.00 yearly ($159.20/month × 10 months)
          monthly_equivalent: 15920, // $159.20
          commitment: '3-month',
          features: [
            'Everything in Nutrition Only',
            'Customized training program',
            'Form check videos & feedback',
            'Premium app features',
            'Save $477.60 per year'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'One-Time Macros Calculation',
        description: 'Complete macro calculation with comprehensive guides.',
        image_url: 'https://images.unsplash.com/photo-1598136490941-30d885318abd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_macros_calculation',
        active: true,
        metadata: {
          type: 'one-time',
          price: 4900, // $49.00
          features: [
            'Complete macro calculation',
            'Comprehensive guides'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Self-Led Training - Monthly',
        description: 'Complete app access with monthly workout plans.',
        image_url: 'https://images.unsplash.com/photo-1571019113968-90b1ab422f05?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_self_led_monthly',
        active: true,
        metadata: {
          type: 'subscription',
          duration: 'monthly',
          price: 1999, // $19.99
          features: [
            'Full access to JmeFit app',
            'New monthly workout plans (3-5 days)',
            'Structured progressions',
            'Exercise video library',
            'Detailed workout logging',
            'Cancel anytime'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Self-Led Training - Yearly',
        description: 'Complete app access with monthly workout plans with 20% discount.',
        image_url: 'https://images.unsplash.com/photo-1571019113968-90b1ab422f05?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_self_led_yearly',
        active: true,
        metadata: {
          type: 'subscription',
          duration: 'yearly',
          price: 19188, // $191.88 yearly ($15.99/month × 12 months)
          monthly_equivalent: 1599, // $15.99
          features: [
            'Full access to JmeFit app',
            'New monthly workout plans (3-5 days)',
            'Structured progressions',
            'Exercise video library',
            'Detailed workout logging',
            'Cancel anytime',
            'Save $47.98 per year'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Trainer Feedback - Monthly',
        description: 'Personal guidance & form checks.',
        image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_trainer_feedback_monthly',
        active: true,
        metadata: {
          type: 'subscription',
          duration: 'monthly',
          price: 3499, // $34.99
          features: [
            'Everything in Self-Led plan',
            'Form check video reviews',
            'Direct messaging with Jaime',
            'Workout adaptations & swaps',
            'Access to previous workouts',
            'Premium support access',
            'Cancel anytime'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Trainer Feedback - Yearly',
        description: 'Personal guidance & form checks with 20% discount.',
        image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_trainer_feedback_yearly',
        active: true,
        metadata: {
          type: 'subscription',
          duration: 'yearly',
          price: 33588, // $335.88 yearly ($27.99/month × 12 months)
          monthly_equivalent: 2799, // $27.99
          features: [
            'Everything in Self-Led plan',
            'Form check video reviews',
            'Direct messaging with Jaime',
            'Workout adaptations & swaps',
            'Access to previous workouts',
            'Premium support access',
            'Cancel anytime',
            'Save $83.98 per year'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'SHRED with JmeFit!',
        description: 'This 6-week, kick-start challenge is designed not only to build muscle, lose fat & gain strength simultaneously, but to also teach you how to eat for life, all while living life!',
        image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_shred_challenge',
        active: true,
        metadata: {
          type: 'one-time',
          price: 24900, // $249.00
          duration: '6-week',
          features: [
            'Custom Macros - Personalized fat loss macros',
            'Maintenance calories for body recomp',
            'Sample meal plan with snacks',
            'Interactive check-in with Jaime',
            'Progress tracking & adjustments',
            'Comprehensive tracking guides',
            'Educational content & tips',
            'Free MyPTHub App access included',
            'Track workouts & nutrition',
            'Direct Q&A with Jaime',
            '5 workouts per week with progressive overload',
            'Home and gym options',
            'Updates after 4 weeks'
          ]
        }
      }
    ];
    
    // Insert the JmeFit products into the database
    const { data, error } = await supabase
      .from('products')
      .insert(jmefitProducts)
      .select();
    
    if (error) {
      console.error('Error adding JmeFit products:', error.message);
      return;
    }
    
    console.log(`${data.length} JmeFit products added successfully!`);
    
    // Verify by getting all products
    const { data: allProducts, error: getAllProductsError } = await supabase
      .from('products')
      .select('*');
    
    if (getAllProductsError) {
      console.error('Error fetching products:', getAllProductsError.message);
      return;
    }
    
    console.log(`\nTotal products in database: ${allProducts.length}`);
    console.log('Product names:');
    allProducts.forEach(product => {
      const price = product.metadata?.price 
        ? `$${(product.metadata.price / 100).toFixed(2)}` 
        : 'Price not set';
      console.log(`- ${product.name} (${price})`);
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
resetProducts();

// Export for ES modules
export {};
