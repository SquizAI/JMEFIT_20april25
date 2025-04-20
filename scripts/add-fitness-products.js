// Script to add realistic fitness products to the database
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

async function addFitnessProducts() {
  try {
    console.log('Adding fitness products to database...');
    
    // Create fitness products
    const fitnessProducts = [
      {
        id: uuidv4(),
        name: 'Premium Fitness Membership',
        description: 'Full access to all gym facilities, classes, and personal training sessions. Includes nutrition consultation.',
        image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_premium_membership',
        active: true,
        metadata: {
          type: 'membership',
          duration: 'monthly',
          price: 9999, // $99.99
          features: [
            'Unlimited gym access',
            'All fitness classes',
            '2 personal training sessions/month',
            'Nutrition consultation'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Basic Fitness Membership',
        description: 'Access to gym facilities during standard hours. Basic fitness assessment included.',
        image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_basic_membership',
        active: true,
        metadata: {
          type: 'membership',
          duration: 'monthly',
          price: 4999, // $49.99
          features: [
            'Standard hours gym access',
            'Basic fitness assessment',
            'Access to cardio equipment',
            'Access to weight training area'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Personal Training Package',
        description: '10 sessions with a certified personal trainer. Customized workout plans and progress tracking.',
        image_url: 'https://images.unsplash.com/photo-1571019113968-90b1ab422f05?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_personal_training',
        active: true,
        metadata: {
          type: 'service',
          sessions: 10,
          price: 29999, // $299.99
          features: [
            '10 one-hour sessions',
            'Customized workout plan',
            'Progress tracking',
            'Nutritional guidance'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Nutrition Consultation',
        description: 'One-on-one consultation with a nutritionist. Includes personalized meal plans and follow-up session.',
        image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_nutrition',
        active: true,
        metadata: {
          type: 'service',
          sessions: 2,
          price: 14999, // $149.99
          features: [
            'Initial 90-minute consultation',
            'Personalized meal plan',
            '30-minute follow-up session',
            'Ongoing email support for 1 month'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Group Fitness Class Package',
        description: '20 classes including HIIT, yoga, spinning, and more. Valid for 3 months from purchase.',
        image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_group_classes',
        active: true,
        metadata: {
          type: 'package',
          classes: 20,
          validity: '3 months',
          price: 19999, // $199.99
          features: [
            '20 group fitness classes',
            'Access to all class types',
            'Valid for 3 months',
            'Online booking system'
          ]
        }
      },
      {
        id: uuidv4(),
        name: 'Fitness Assessment',
        description: 'Comprehensive fitness assessment including body composition, strength, flexibility, and cardiovascular health.',
        image_url: 'https://images.unsplash.com/photo-1573056019137-d8576a5a4175?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stripe_product_id: 'prod_fitness_assessment',
        active: true,
        metadata: {
          type: 'service',
          sessions: 1,
          price: 7999, // $79.99
          features: [
            'Body composition analysis',
            'Strength assessment',
            'Flexibility testing',
            'Cardiovascular fitness evaluation',
            'Personalized report'
          ]
        }
      }
    ];
    
    // Insert the fitness products into the database
    // First check if products with these stripe_product_ids already exist
    const stripeProductIds = fitnessProducts.map(p => p.stripe_product_id);
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('stripe_product_id')
      .in('stripe_product_id', stripeProductIds);
      
    if (fetchError) {
      console.error('Error checking existing products:', fetchError.message);
      return;
    }
    
    // Filter out products that already exist
    const existingIds = existingProducts.map(p => p.stripe_product_id);
    const newProducts = fitnessProducts.filter(p => !existingIds.includes(p.stripe_product_id));
    
    if (newProducts.length === 0) {
      console.log('All products already exist in the database.');
      const { data: allProducts, error: getAllError } = await supabase.from('products').select('*');
      if (getAllError) {
        console.error('Error fetching all products:', getAllError.message);
        return;
      }
      console.log(`Total products in database: ${allProducts.length}`);
      return;
    }
    
    // Insert only new products
    const { data, error } = await supabase
      .from('products')
      .insert(newProducts)
      .select();
    
    if (error) {
      console.error('Error adding fitness products:', error.message);
      return;
    }
    
    console.log(`${data.length} fitness products added/updated successfully!`);
    
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
      console.log(`- ${product.name}`);
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
addFitnessProducts();

// Export for ES modules
export {};
