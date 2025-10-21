import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up database tables...');
  
  try {
    // 1. Create products table
    console.log('Creating products table...');
    const { error: productsError } = await supabase.from('products').select('count').limit(1);
    
    if (productsError && productsError.code === '42P01') {
      // Table doesn't exist, create it
      const { error } = await supabase.rpc('create_products_table');
      if (error) throw error;
      console.log('Products table created successfully');
    } else {
      console.log('Products table already exists');
    }
    
    // 2. Create prices table
    console.log('Creating prices table...');
    const { error: pricesError } = await supabase.from('prices').select('count').limit(1);
    
    if (pricesError && pricesError.code === '42P01') {
      // Table doesn't exist, create it
      const { error } = await supabase.rpc('create_prices_table');
      if (error) throw error;
      console.log('Prices table created successfully');
    } else {
      console.log('Prices table already exists');
    }
    
    // 3. Create subscription_plans table
    console.log('Creating subscription_plans table...');
    const { error: plansError } = await supabase.from('subscription_plans').select('count').limit(1);
    
    if (plansError && plansError.code === '42P01') {
      // Table doesn't exist, create it
      const { error } = await supabase.rpc('create_subscription_plans_table');
      if (error) throw error;
      console.log('Subscription plans table created successfully');
    } else {
      console.log('Subscription plans table already exists');
    }
    
    // 4. Create subscription_prices table
    console.log('Creating subscription_prices table...');
    const { error: subPricesError } = await supabase.from('subscription_prices').select('count').limit(1);
    
    if (subPricesError && subPricesError.code === '42P01') {
      // Table doesn't exist, create it
      const { error } = await supabase.rpc('create_subscription_prices_table');
      if (error) throw error;
      console.log('Subscription prices table created successfully');
    } else {
      console.log('Subscription prices table already exists');
    }
    
    // 5. Insert sample data
    console.log('Inserting sample data...');
    
    // Sample products
    const products = [
      {
        name: 'Self-Led Program',
        description: 'Complete workout plans & exercise library',
        features: ['Personalized workout plans', '200+ exercise library', 'Progress tracking', 'Workout scheduling'],
        active: true
      },
      {
        name: 'Trainer Feedback',
        description: 'Premium training with personal guidance',
        features: ['Form check video analysis', 'Workout adaptations', 'Direct messaging with trainers', 'Regular progress reviews'],
        active: true
      },
      {
        name: 'Macros Calculation',
        description: 'Custom macros calculation based on your goals',
        active: true,
        metadata: { product_type: 'one-time' }
      },
      {
        name: 'SHRED Challenge',
        description: '8-week intensive fat loss program',
        active: true,
        metadata: { product_type: 'one-time' }
      }
    ];
    
    // Insert products
    for (const product of products) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('name', product.name)
        .limit(1);
      
      if (!existingProduct || existingProduct.length === 0) {
        const { data, error } = await supabase.from('products').insert(product).select();
        if (error) throw error;
        console.log(`Product "${product.name}" inserted with ID: ${data[0].id}`);
      } else {
        console.log(`Product "${product.name}" already exists with ID: ${existingProduct[0].id}`);
      }
    }
    
    // Get product IDs
    const { data: productData } = await supabase.from('products').select('id, name');
    const productMap = {};
    productData.forEach(p => productMap[p.name] = p.id);
    
    // Insert prices for one-time products
    const oneTimePrices = [
      {
        product_id: productMap['Macros Calculation'],
        unit_amount: 4999,  // $49.99
        type: 'one_time',
        active: true
      },
      {
        product_id: productMap['SHRED Challenge'],
        unit_amount: 24900,  // $249.00
        type: 'one_time',
        active: true
      }
    ];
    
    for (const price of oneTimePrices) {
      const { data: existingPrice } = await supabase
        .from('prices')
        .select('id')
        .eq('product_id', price.product_id)
        .limit(1);
      
      if (!existingPrice || existingPrice.length === 0) {
        const { data, error } = await supabase.from('prices').insert(price).select();
        if (error) throw error;
        console.log(`Price for product ID ${price.product_id} inserted with ID: ${data[0].id}`);
      } else {
        console.log(`Price for product ID ${price.product_id} already exists with ID: ${existingPrice[0].id}`);
      }
    }
    
    // Insert subscription prices
    const subscriptionPrices = [
      {
        subscription_plan_id: productMap['Self-Led Program'],
        unit_amount: 1999,  // $19.99
        interval: 'monthly',
        active: true
      },
      {
        subscription_plan_id: productMap['Self-Led Program'],
        unit_amount: 19190,  // $191.90 (20% off annual)
        interval: 'yearly',
        active: true
      },
      {
        subscription_plan_id: productMap['Trainer Feedback'],
        unit_amount: 3499,  // $34.99
        interval: 'monthly',
        active: true
      },
      {
        subscription_plan_id: productMap['Trainer Feedback'],
        unit_amount: 33590,  // $335.90 (20% off annual)
        interval: 'yearly',
        active: true
      }
    ];
    
    for (const price of subscriptionPrices) {
      const { data: existingPrice } = await supabase
        .from('subscription_prices')
        .select('id')
        .eq('subscription_plan_id', price.subscription_plan_id)
        .eq('interval', price.interval)
        .limit(1);
      
      if (!existingPrice || existingPrice.length === 0) {
        const { data, error } = await supabase.from('subscription_prices').insert(price).select();
        if (error) throw error;
        console.log(`Subscription price for plan ID ${price.subscription_plan_id} (${price.interval}) inserted with ID: ${data[0].id}`);
      } else {
        console.log(`Subscription price for plan ID ${price.subscription_plan_id} (${price.interval}) already exists with ID: ${existingPrice[0].id}`);
      }
    }
    
    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();
