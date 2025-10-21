import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDBErrors() {
  console.log('🔍 Diagnosing Database Errors...\n');

  // Test 1: Check table existence and basic queries
  console.log('1️⃣ Testing basic table access:');
  
  const tables = [
    'profiles',
    'orders',
    'subscriptions',
    'blog_posts',
    'revenue_metrics',
    'payment_analytics',
    'email_campaigns',
    'email_campaign_metrics'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Accessible (${data?.length || 0} rows)`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }

  console.log('\n2️⃣ Testing problematic queries:');

  // Test orders query with user_id filter
  try {
    console.log('\nTesting orders with user_id filter:');
    // First get a user ID
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (users && users.length > 0) {
      const userId = users[0].id;
      
      // Test the problematic query
      const { data, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('user_id', userId);
      
      if (error) {
        console.log(`❌ Orders query error: ${error.message}`);
      } else {
        console.log(`✅ Orders query successful: ${data?.length || 0} orders found`);
      }
    }
  } catch (e) {
    console.log(`❌ Orders test failed: ${e.message}`);
  }

  // Test email campaigns with foreign key
  try {
    console.log('\nTesting email_campaigns query:');
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*, email_campaign_metrics(*)');
    
    if (error) {
      console.log(`❌ Email campaigns foreign key error: ${error.message}`);
      console.log('   Trying without foreign key...');
      
      const { data: campaigns, error: campaignsError } = await supabase
        .from('email_campaigns')
        .select('*')
        .limit(5);
      
      if (campaignsError) {
        console.log(`❌ Email campaigns basic query error: ${campaignsError.message}`);
      } else {
        console.log(`✅ Email campaigns basic query successful: ${campaigns?.length || 0} campaigns`);
      }
    } else {
      console.log(`✅ Email campaigns with metrics successful`);
    }
  } catch (e) {
    console.log(`❌ Email campaigns test failed: ${e.message}`);
  }

  // Test date range queries
  try {
    console.log('\nTesting orders with date range:');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed');
    
    if (error) {
      console.log(`❌ Date range query error: ${error.message}`);
    } else {
      console.log(`✅ Date range query successful: ${data?.length || 0} orders`);
    }
  } catch (e) {
    console.log(`❌ Date range test failed: ${e.message}`);
  }

  console.log('\n3️⃣ Checking RLS policies:');
  
  // Test as anonymous user (should fail for protected tables)
  const protectedTables = [
    'revenue_metrics',
    'payment_analytics',
    'email_campaigns'
  ];

  for (const table of protectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('denied')) {
        console.log(`✅ ${table}: RLS properly denying anonymous access`);
      } else if (error) {
        console.log(`⚠️  ${table}: Error but not RLS - ${error.message}`);
      } else {
        console.log(`❌ ${table}: RLS not configured (anonymous can read)`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log('- Check if tables exist in your Supabase project');
  console.log('- Verify RLS policies are properly configured');
  console.log('- Ensure foreign key relationships are set up correctly');
  console.log('- Use proper Supabase query syntax for filters');
}

// Run diagnostics
diagnoseDBErrors(); 