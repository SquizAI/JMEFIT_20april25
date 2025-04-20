// Seed script to populate Supabase and Stripe with initial products
import { getServerStripe } from '../src/lib/stripe.js';
import { supabase } from '../src/lib/supabase.js';

// Make sure your package.json includes: "type": "module"

// Sample product data
const products = [
  {
    name: 'Premium Membership',
    description: 'Access to all premium features and content',
    active: true,
    image_url: 'https://example.com/images/premium.jpg',
    metadata: {
      type: 'subscription',
      duration: 'monthly'
    }
  },
  {
    name: 'Pro Membership',
    description: 'Advanced features for professional users',
    active: true,
    image_url: 'https://example.com/images/pro.jpg',
    metadata: {
      type: 'subscription',
      duration: 'annual'
    }
  },
  {
    name: 'Basic Package',
    description: 'Essential features for new users',
    active: true,
    image_url: 'https://example.com/images/basic.jpg',
    metadata: {
      type: 'one-time',
      level: 'beginner'
    }
  }
];

/**
 * Create product in Stripe and return the Stripe product ID
 */
async function createProductInStripe(product) {
  try {
    const stripe = getServerStripe();
    
    // Format metadata for Stripe (convert objects to string values)
    const stripeMetadata = {};
    if (product.metadata && typeof product.metadata === 'object') {
      Object.entries(product.metadata).forEach(([key, value]) => {
        if (typeof value === 'string') {
          stripeMetadata[key] = value;
        } else if (value !== null && value !== undefined) {
          stripeMetadata[key] = String(value);
        }
      });
    }
    
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      active: product.active,
      images: product.image_url ? [product.image_url] : [],
      metadata: stripeMetadata
    });
    
    console.log(`Created Stripe product: ${stripeProduct.id}`);
    return stripeProduct.id;
  } catch (error) {
    console.error('Error creating product in Stripe:', error.message);
    throw error;
  }
}

/**
 * Create product in Supabase database
 */
async function createProductInDatabase(product, stripeProductId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        active: product.active,
        stripe_product_id: stripeProductId,
        metadata: product.metadata
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`Created database product: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Error creating product in database:', error.message);
    throw error;
  }
}

/**
 * Main function to seed products
 */
async function seedProducts() {
  console.log('Starting product seeding...');
  
  try {
    for (const product of products) {
      // First create in Stripe
      const stripeProductId = await createProductInStripe(product);
      
      // Then create in Supabase with the Stripe ID
      await createProductInDatabase(product, stripeProductId);
      
      console.log(`Successfully created product: ${product.name}`);
    }
    
    console.log('Product seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}

// Run the seed function
seedProducts();

// Add export for importing in other files if needed
export { seedProducts, createProductInStripe, createProductInDatabase };
