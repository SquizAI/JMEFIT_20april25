// Netlify serverless function to sync Stripe products with Supabase
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Initialize Stripe with API version
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required but was not provided in environment variables');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Lock to a specific API version for stability
  maxNetworkRetries: 3, // Automatically retry failed API calls
});

// Initialize Supabase
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables must be set');
}

// Create Supabase client with better timeout settings
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // No need to persist session for serverless function
  },
  global: {
    fetch: (url, options) => {
      // Set longer timeout for Supabase requests
      return fetch(url, {
        ...options,
        timeout: 30000, // 30 seconds timeout
      });
    },
  },
});

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST and GET methods
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  // Check for Stripe webhook events
  const isStripeWebhook = event.headers && 
    (event.headers['stripe-signature'] || event.headers['Stripe-Signature']);
  
  // If this is a Stripe webhook, process it differently
  if (isStripeWebhook && event.httpMethod === 'POST') {
    return await handleStripeWebhook(event, headers);
  }
  
  // Add a specific endpoint for webhook registration
  if (event.path === '/.netlify/functions/sync-products/register-webhook' && event.httpMethod === 'POST') {
    return await registerWebhook(headers);
  }

  try {
    console.log('Starting Stripe product synchronization with Supabase...');
    console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY ? 'is set' : 'is NOT set');
    console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? 'is set' : 'is NOT set');
    console.log('Supabase Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'is set' : 'is NOT set');
    
    // Verify Stripe API connectivity
    try {
      const balance = await stripe.balance.retrieve();
      console.log('Stripe API connection successful, balance available');
    } catch (stripeErr) {
      console.error('Stripe API connection failed:', stripeErr.message);
      throw new Error('Failed to connect to Stripe API');
    }
    
    // Verify Supabase API connectivity
    try {
      const { data: test, error: testError } = await supabase.from('products').select('count');
      if (testError) throw testError;
      console.log('Supabase API connection successful, counted', test.length, 'products');
    } catch (supabaseErr) {
      console.error('Supabase API connection failed:', supabaseErr.message);
      throw new Error('Failed to connect to Supabase API');
    }
    
    // List of specific product IDs to sync
    const productIds = [
      'prod_SKFZTSQzWRzlDY',
      'prod_SKFZCf3jJcOY2r',
      'prod_SKFZ9bT2D7uuwg',
      'prod_SKFYozPo80X30O',
      'prod_SKFYIDF5hBEx3o',
      'prod_SKFYTOlWTNVH7o'
    ];

    console.log(`Targeting ${productIds.length} specific products for sync`);
    
    // Initialize array to store products
    const stripeProducts = [];
    
    // Fetch each product individually to ensure we get the ones we want
    for (const productId of productIds) {
      try {
        const product = await stripe.products.retrieve(productId, {
          expand: ['default_price']
        });
        
        if (product.active) {
          stripeProducts.push(product);
          console.log(`Retrieved product: ${product.name} (${product.id})`);
        } else {
          console.log(`Skipping inactive product: ${product.id}`);
        }
      } catch (err) {
        console.error(`Error retrieving product ${productId}:`, err.message);
      }
    }

    console.log(`Successfully retrieved ${stripeProducts.length} active products from Stripe`);
    
    const results = {
      products: [],
      prices: []
    };
    
    // For each product, retrieve all its prices
    for (const product of stripeProducts) {
      console.log(`===== Processing product: ${product.name} =====`);
      
      // Check if product exists in Supabase
      const { data: existingProduct, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('stripe_product_id', product.id)
        .maybeSingle();
      
      if (productError) {
        console.error(`Error checking for product ${product.name}:`, productError);
        continue;
      }
      
      console.log(`Product ${product.name} exists in Supabase: ${!!existingProduct}`);
      
      let productId;
      let productAction;
      
      if (!existingProduct) {
        // Insert new product - removed image field to match existing schema
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            name: product.name,
            description: product.description || '',
            stripe_product_id: product.id,
            active: product.active,
            metadata: product.metadata
          })
          .select()
          .single();
        
        if (insertError) {
          console.error(`Error inserting product ${product.name}:`, insertError);
          continue;
        }
        
        productId = newProduct.id;
        productAction = 'created';
        results.products.push({
          name: product.name,
          action: 'created',
          id: productId
        });
        console.log(`Created new product in Supabase: ${product.name}`);
      } else {
        // Update existing product - removed image field to match existing schema
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: product.name,
            description: product.description || '',
            active: product.active,
            metadata: product.metadata,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_product_id', product.id);
        
        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError);
          continue;
        }
        
        productId = existingProduct.id;
        productAction = 'updated';
        results.products.push({
          name: product.name,
          action: 'updated',
          id: productId
        });
        console.log(`Updated existing product in Supabase: ${product.name}`);
      }
      
      // Retrieve all prices for this product
      const { data: stripePrices } = await stripe.prices.list({
        product: product.id,
      });
      
      console.log(`Product: ${product.name} has ${stripePrices.length} prices`);
      
      // Now sync all prices for this product
      for (const price of stripePrices) {
        // Determine the correct interval based on price data
        let interval;
        if (price.recurring) {
          interval = price.recurring.interval; // This will be 'month' or 'year'
          console.log(`${product.name}: Using recurring interval: ${interval}`);
        } else {
          // For JMEFIT products, we'll use exact price matching to determine interval
          const amount = price.unit_amount / 100;
          console.log(`${product.name}: Non-recurring price, amount: $${amount}`);
          
          // IMPORTANT: Hardcode prices more accurately matching Stripe prices
          if (product.name === 'Nutrition Only') {
            if (amount >= 170 && amount <= 180) {
              interval = 'month'; // Monthly ~$179 price
              console.log(`${product.name}: Setting $${amount} as monthly price`);
            } else if (amount >= 1700 && amount <= 1800) {
              interval = 'year'; // Yearly ~$1718.40 price
              console.log(`${product.name}: Setting $${amount} as yearly price`);
            } else {
              interval = amount < 200 ? 'month' : 'year';
              console.log(`${product.name}: Falling back on amount < 200 check: $${amount} → ${interval}`);
            }
          } else if (product.name === 'Nutrition & Training') {
            if (amount >= 240 && amount <= 250) {
              interval = 'month'; // Monthly ~$249 price
              console.log(`${product.name}: Setting $${amount} as monthly price`);
            } else if (amount >= 2300 && amount <= 2400) {
              interval = 'year'; // Yearly ~$2390.40 price
              console.log(`${product.name}: Setting $${amount} as yearly price`);
            } else {
              interval = amount < 300 ? 'month' : 'year';
              console.log(`${product.name}: Falling back on amount < 300 check: $${amount} → ${interval}`);
            }
          } else if (product.name === 'Self-Led Training Program') {
            if (amount >= 19 && amount <= 25) {
              interval = 'month'; // Monthly ~$24.99 price
              console.log(`${product.name}: Setting $${amount} as monthly price`);
            } else if (amount >= 230 && amount <= 240) {
              interval = 'year'; // Yearly ~$239.90 price
              console.log(`${product.name}: Setting $${amount} as yearly price`);
            } else {
              interval = amount < 30 ? 'month' : 'year';
              console.log(`${product.name}: Falling back on amount < 30 check: $${amount} → ${interval}`);
            }
          } else if (product.name === 'Trainer Feedback Program') {
            if (amount >= 30 && amount <= 50) {
              interval = 'month'; // Monthly ~$49.99 price
              console.log(`${product.name}: Setting $${amount} as monthly price`);
            } else if (amount >= 430 && amount <= 440) {
              interval = 'year'; // Yearly ~$431.90 price
              console.log(`${product.name}: Setting $${amount} as yearly price`);
            } else {
              interval = amount < 100 ? 'month' : 'year';
              console.log(`${product.name}: Falling back on amount < 100 check: $${amount} → ${interval}`);
            }
          } else if (product.name === 'SHRED with JMEFit' || product.name.includes('SHRED')) {
            // SHRED product is a one-time purchase at $297.00
            if (amount >= 290 && amount <= 300) {
              interval = 'one-time';
              console.log(`${product.name}: Setting as one-time product with price $${amount}`);
            } else {
              interval = 'one-time';
              console.log(`${product.name}: Setting as one-time product with price $${amount}`);
            }
          } else {
            // For other products (One-Time Macros, etc.)
            interval = 'one-time';
            console.log(`${product.name}: Setting as one-time product with price $${amount}`);
          }
        }
        
        console.log(`Processing price for ${product.name}: ${price.unit_amount/100} ${price.currency} (${interval})`);

        // Insert or update price in Supabase
        const priceData = {
          id: price.id,
          product_id: product.id,
          active: price.active,
          unit_amount: price.unit_amount,
          currency: price.currency,
          interval,
          stripe_price_id: price.id
        };
        
        console.log(`SYNCING PRICE: ${product.name} - $${price.unit_amount/100} ${price.currency} (${interval})`);
        
        // Check if price exists
        const { data: existingPrice, error: priceError } = await supabase
          .from('prices')
          .select('*')
          .eq('stripe_price_id', price.id)
          .maybeSingle();
        
        if (priceError || !existingPrice) {
          // Insert new price - removed metadata field to match existing schema
          const { error: insertPriceError } = await supabase
            .from('prices')
            .insert(priceData);
          
          if (insertPriceError) {
            console.error(`Error inserting price for ${product.name}:`, insertPriceError);
          } else {
            results.prices.push({
              product_name: product.name,
              action: 'created',
              amount: price.unit_amount/100,
              currency: price.currency,
              interval: interval
            });
            console.log(`Created new price in Supabase for ${product.name}: ${price.unit_amount/100} ${price.currency} (${interval})`);
          }
        } else {
          // Update existing price - removed metadata field to match existing schema
          const { error: updatePriceError } = await supabase
            .from('prices')
            .update(priceData)
            .eq('stripe_price_id', price.id);
          
          if (updatePriceError) {
            console.error(`Error updating price for ${product.name}:`, updatePriceError);
            continue;
          }
          
          results.prices.push({
            product_name: product.name,
            action: 'updated',
            amount: price.unit_amount/100,
            currency: price.currency,
            interval: interval
          });
          console.log(`Updated existing price in Supabase for ${product.name}: ${price.unit_amount/100} ${price.currency} (${interval})`);
        }
      }
    }
    
    console.log('Stripe product synchronization completed successfully.');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Stripe products and prices synchronized with Supabase',
        summary: {
          products_processed: results.products.length,
          prices_processed: results.prices.length
        },
        details: results
      })
    };
  } catch (error) {
    console.error('Error synchronizing Stripe products:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'Error synchronizing Stripe products with Supabase' 
      })
    };
  }
};

/**
 * Handle Stripe webhook events
 * This function processes webhook events from Stripe to automatically sync product changes
 */
async function handleStripeWebhook(event, headers) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook secret is not configured' })
    };
  }
  
  try {
    // Get the signature from the headers
    const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    
    if (!signature) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing Stripe signature' })
      };
    }
    
    // Verify the event
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      webhookSecret
    );
    
    console.log(`Received Stripe webhook event: ${stripeEvent.type}`);
    
    // Process different event types
    switch (stripeEvent.type) {
      case 'product.created':
      case 'product.updated':
      case 'product.deleted':
        await handleProductEvent(stripeEvent.data.object);
        break;
      case 'price.created':
      case 'price.updated':
      case 'price.deleted':
        await handlePriceEvent(stripeEvent.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }
}

/**
 * Handle product events from Stripe
 */
async function handleProductEvent(product) {
  console.log(`Processing product event for ${product.id} (${product.name})`);
  
  try {
    if (product.deleted) {
      // Handle product deletion
      const { error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('stripe_product_id', product.id);
      
      if (error) throw error;
      console.log(`Marked product ${product.id} as inactive`);
    } else {
      // Handle product creation or update
      const { data: existingProduct, error: queryError } = await supabase
        .from('products')
        .select('*')
        .eq('stripe_product_id', product.id)
        .maybeSingle();
      
      if (queryError) throw queryError;
      
      const productData = {
        name: product.name,
        description: product.description,
        image_url: product.images && product.images.length > 0 ? product.images[0] : null,
        stripe_product_id: product.id,
        active: product.active,
        metadata: product.metadata || {}
      };
      
      if (!existingProduct) {
        // Insert new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        
        if (insertError) throw insertError;
        console.log(`Created new product: ${product.name}`);
      } else {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('stripe_product_id', product.id);
        
        if (updateError) throw updateError;
        console.log(`Updated product: ${product.name}`);
      }
    }
  } catch (error) {
    console.error(`Error handling product event: ${error.message}`);
    throw error;
  }
}
/**
 * Handle price events from Stripe
 */
async function handlePriceEvent(price) {
  console.log(`Processing price event for ${price.id}`);
  
  try {
    // Get the associated product
    const product = await stripe.products.retrieve(price.product);
    
    // Determine the interval based on price data
    let interval = 'one-time';
    if (price.recurring) {
      interval = price.recurring.interval;
    } else if (product.name.toLowerCase().includes('month')) {
      interval = 'month';
    } else if (product.name.toLowerCase().includes('year')) {
      interval = 'year';
    }
    
    // Special case handling for specific products
    if (product.name === 'Self-Led Training Program') {
      const amount = price.unit_amount / 100;
      if (amount >= 15 && amount <= 30) {
        interval = 'month';
        console.log(`${product.name}: Setting $${amount} as monthly price`);
      } else if (amount >= 190 && amount <= 240) {
        interval = 'year';
        console.log(`${product.name}: Setting $${amount} as yearly price`);
      }
    } else if (product.name === 'Trainer Feedback Program') {
      const amount = price.unit_amount / 100;
      if (amount >= 30 && amount <= 50) {
        interval = 'month';
        console.log(`${product.name}: Setting $${amount} as monthly price`);
      } else if (amount >= 430 && amount <= 440) {
        interval = 'year';
        console.log(`${product.name}: Setting $${amount} as yearly price`);
      }
    }
    
    if (price.active === false) {
      // Handle price deactivation
      const { error } = await supabase
        .from('prices')
        .update({ active: false })
        .eq('stripe_price_id', price.id);
      
      if (error) throw error;
      console.log(`Marked price ${price.id} as inactive`);
    } else {
      // Check if price exists
      const { data: existingPrice, error: queryError } = await supabase
        .from('prices')
        .select('*')
        .eq('stripe_price_id', price.id)
        .maybeSingle();
      
      if (queryError) throw queryError;
      
      const priceData = {
        product_id: price.product,
        active: price.active,
        unit_amount: price.unit_amount,
        currency: price.currency,
        interval,
        stripe_price_id: price.id
      };
      
      if (!existingPrice) {
        // Insert new price
        const { error: insertError } = await supabase
          .from('prices')
          .insert([priceData]);
        
        if (insertError) throw insertError;
        console.log(`Created new price: ${price.unit_amount/100} ${price.currency} (${interval})`);
      } else {
        // Update existing price
        const { error: updateError } = await supabase
          .from('prices')
          .update(priceData)
          .eq('stripe_price_id', price.id);
        
        if (updateError) throw updateError;
        console.log(`Updated price: ${price.unit_amount/100} ${price.currency} (${interval})`);
      }
    }
  } catch (error) {
    console.error(`Error handling price event: ${error.message}`);
    throw error;
  }
}

/**
 * Register a webhook with Stripe
 */
async function registerWebhook(headers) {
  try {
    const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://jmefit.com';
    const webhookUrl = `${baseUrl}/.netlify/functions/sync-products`;
    
    // Create a webhook endpoint in Stripe
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'product.created',
        'product.updated',
        'product.deleted',
        'price.created',
        'price.updated',
        'price.deleted'
      ],
      description: 'JMEFIT Supabase Sync Webhook'
    });
    
    console.log(`Created webhook endpoint: ${webhookEndpoint.id}`);
    console.log(`Webhook secret: ${webhookEndpoint.secret}`);
    console.log('IMPORTANT: Save the webhook secret in your environment variables as STRIPE_WEBHOOK_SECRET');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Webhook registered successfully',
        webhookId: webhookEndpoint.id,
        webhookUrl: webhookUrl,
        secret: webhookEndpoint.secret
      })
    };
  } catch (error) {
    console.error(`Error registering webhook: ${error.message}`);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Error registering webhook'
      })
    };
  }
}
