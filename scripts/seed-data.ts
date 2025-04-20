// Seed script to populate Supabase and Stripe with initial products
import { getServerStripe } from '../src/lib/stripe';
import { supabase } from '../src/lib/supabase';
import type { Database } from '../src/lib/database.types';

// Define types for our product
type ProductData = {
  name: string;
  description: string;
  active: boolean;
  image_url: string | null;
  metadata: Record<string, any>;
};

// Sample product data
const products: ProductData[] = [
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
async function createProductInStripe(product: ProductData): Promise<string> {
  try {
    const stripe = getServerStripe();
    
    // Format metadata for Stripe (convert objects to string values)
    const stripeMetadata: Record<string, string> = {};
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
  } catch (error: any) {
    console.error('Error creating product in Stripe:', error.message);
    throw error;
  }
}

/**
 * Create product in Supabase database
 */
async function createProductInDatabase(product: ProductData, stripeProductId: string) {
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
      } as any)
      .select()
      .single();
    
    if (error) {
      // Safely check for id property
      if (error && typeof error === 'object' && 'id' in error) {
        console.error(`Error with ID ${(error as any).id}:`, error);
      }
      throw error;
    }
    
    console.log(`Created database product: ${data?.id}`);
    return data || null;
  } catch (error: any) {
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
  } catch (error: any) {
    console.error('Seeding failed:', error);
  }
}

// Run the seed function
seedProducts();

// Export functions for importing in other files if needed
export { seedProducts, createProductInStripe, createProductInDatabase };
