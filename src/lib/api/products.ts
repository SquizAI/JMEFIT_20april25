import { supabase } from '../supabase';
import type { Database } from '../database.types';
// Server-side Stripe operations moved to Netlify functions

export type Product = Database['public']['Tables']['products']['Row'];
export type Price = Database['public']['Tables']['prices']['Row'];

/**
 * Get all active products with their prices
 */
export async function getProducts() {
  try {
    // First get all active products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true as any)
      .order('created_at', { ascending: false });
    
    if (productsError) {
      console.error('Database error details:', {
        message: productsError.message || 'Unknown error',
        code: productsError.code || 'Unknown code',
        details: productsError.details || 'No details'
      });
      throw new Error(`Database error: ${productsError.message || 'Unknown error'}`);
    }
    
    // If no products, return empty array
    if (!products || products.length === 0) return [];
    
    // For each product, get its prices separately
    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        const { data: prices, error: pricesError } = await supabase
          .from('prices')
          .select('*')
          .eq('product_id', product.id);
        
        if (pricesError) console.error('Error fetching prices for product', product.id, pricesError);
        
        return {
          ...product,
          prices: prices || []
        };
      })
    );

    return productsWithPrices;
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

/**
 * Get a single product with its prices
 */
export async function getProduct(id: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        prices (*)
      `)
      .eq('id', id as any)
      .single();

    if (error) {
      // Log error details in a type-safe way
      console.error('Database error details:', {
        message: error.message || 'Unknown error',
        code: error.code || 'Unknown code',
        details: error.details || 'No details'
      });
      throw new Error(`Database error: ${error.message || 'Unknown error'}`);
    }
    return data || null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

/**
 * Create a new product in our database (Stripe operations handled by Netlify functions)
 */
export async function createProduct({
  name,
  description,
  imageUrl,
  metadata = {} as Record<string, any>
}: {
  name: string;
  description?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}) {
  try {
    // Create product in our database (Stripe operations handled by Netlify functions)
    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        description,
        image_url: imageUrl,
        metadata,
        active: true
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Update a product in both Stripe and our database
 */
export async function updateProduct(
  id: string,
  {
    name = '',
    description,
    imageUrl,
    active,
    metadata = {} as Record<string, string | number | boolean>
  }: {
    name?: string;
    description?: string;
    imageUrl?: string;
    active?: boolean;
    metadata?: Record<string, string | number | boolean>;
  }
) {
  try {
    // Get current product to get Stripe ID
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id as any)
      .single();

    if (fetchError) {
      console.error('Error fetching product:', {
        message: fetchError.message || 'Unknown error',
        code: fetchError.code || 'Unknown code',
        details: fetchError.details || 'No details'
      });
      throw new Error(`Product not found: ${fetchError.message || 'Unknown error'}`);
    }
    
    if (!currentProduct) throw new Error('Product not found');
    
    // Update in Stripe if we have a Stripe ID
    if (currentProduct && 'stripe_product_id' in currentProduct && currentProduct.stripe_product_id) {
      const stripe = getServerStripe();
      
      // Type assertion for Stripe API
      const stripeMetadata: Record<string, string> = {};
      if (metadata && typeof metadata === 'object') {
        Object.entries(metadata).forEach(([key, value]) => {
          if (typeof value === 'string') {
            stripeMetadata[key] = value;
          } else if (value !== null && value !== undefined) {
            stripeMetadata[key] = String(value);
          }
        });
      }
      
      // Update the Stripe product with validated parameters
      const updateParams: Record<string, any> = {};
      
      if (active !== undefined) updateParams.active = active;
      if (Object.keys(stripeMetadata).length > 0) updateParams.metadata = stripeMetadata;
      
      if (name) updateParams.name = name;
      if (description) updateParams.description = description;
      if (imageUrl) updateParams.images = [imageUrl];
      
      await stripe.products.update(currentProduct.stripe_product_id, updateParams);
    }

    // Update in our database
    // Prepare update data, filter out undefined values
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (active !== undefined) updateData.active = active;
    if (metadata !== undefined) updateData.metadata = metadata;
    
    // Only proceed with update if we have data to update
    if (Object.keys(updateData).length === 0) {
      // If no fields to update, just return the current product
      return currentProduct;
    }
    
    // Use type assertion to handle Supabase typings
    const { data, error } = await supabase
      .from('products')
      .update(updateData as any)
      .eq('id', id as any)
      .select()
      .single();

    if (error) {
      // Log error details in a type-safe way
      console.error('Database error details:', {
        message: error.message || 'Unknown error',
        code: error.code || 'Unknown code',
        details: error.details || 'No details'
      });
      throw new Error(`Database error: ${error.message || 'Unknown error'}`);
    }
    return data || null;
  } catch (error) {
    console.error('Error updating product:', 
      error instanceof Error ? error.message : 'Unknown error');
    throw error instanceof Error ? error : new Error('Unknown error updating product');
  }
}

/**
 * Sync a product from Stripe to our database
 */
export async function syncProductFromStripe(stripeProductId: string) {
  const stripe = getServerStripe();
  
  try {
    if (!stripeProductId) {
      throw new Error('stripeProductId is required');
    }

    // Get product from Stripe
    const stripeProduct = await stripe.products.retrieve(stripeProductId);
  
    // Check if product already exists in our database
    const { data: existingProduct, error: existingProductError } = await supabase
      .from('products')
      .select('*')
      .eq('stripe_product_id', stripeProductId as any)
      .single();

    // Only proceed with update if we have a valid existing product
    if (!existingProductError && existingProduct) {
      // We need to ensure we have a valid object with the required fields
      const productId = typeof existingProduct === 'object' && existingProduct !== null && 'id' in existingProduct ? (existingProduct as { id: string }).id : null;
      
      if (!productId) {
        console.error('Invalid product object, missing ID');
        throw new Error('Invalid product object');
      }
      // Update existing product
      const { data, error } = await supabase
        .from('products')
        .update({
          name: stripeProduct.name,
          description: stripeProduct.description,
          image_url: stripeProduct.images?.[0] || null,
          active: stripeProduct.active,
          metadata: stripeProduct.metadata
        } as any)
        .eq('id', productId as any)
        .select()
        .single();

      if (error) throw error;
      return data || null;
    } else {
      // Create new product
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: stripeProduct.name,
          description: stripeProduct.description,
          image_url: stripeProduct.images?.[0] || null,
          stripe_product_id: stripeProductId,
          active: stripeProduct.active,
          metadata: stripeProduct.metadata || {}
        } as any)
        .select()
        .single();

    if (error) {
      // Log error details in a type-safe way
      console.error('Database error details:', {
        message: error.message || 'Unknown error',
        code: error.code || 'Unknown code',
        details: error.details || 'No details'
      });
      throw new Error(`Database error: ${error.message || 'Unknown error'}`);
    }
    return data || null;
  }
  } catch (error) {
    console.error('Error syncing product from Stripe:', error);
    throw error;
  }
}