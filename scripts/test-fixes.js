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

async function testFixes() {
  console.log('🧪 Testing all fixes...\n');

  // Test 1: Check if blog_posts can be read without authentication
  console.log('1️⃣ Testing blog_posts public read access:');
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .limit(5);
    
    if (error) {
      console.error('❌ Blog posts query failed:', error.message);
    } else {
      console.log('✅ Blog posts query successful! Found', data?.length || 0, 'published posts');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // Test 2: Check orders table structure
  console.log('\n2️⃣ Testing orders table structure:');
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, total_amount, user_id, created_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Orders query failed:', error.message);
    } else {
      console.log('✅ Orders table structure is correct');
      if (data?.length > 0) {
        console.log('   Sample order:', {
          id: data[0].id,
          total_amount: data[0].total_amount,
          user_id: data[0].user_id
        });
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // Test 3: Check RLS policies on revenue_metrics
  console.log('\n3️⃣ Testing revenue_metrics RLS (should fail without auth):');
  try {
    const { data, error } = await supabase
      .from('revenue_metrics')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('✅ Revenue metrics correctly blocked for anonymous users:', error.message);
    } else {
      console.error('❌ Revenue metrics should not be accessible without auth!');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // Test 4: Check email_campaigns table
  console.log('\n4️⃣ Testing email_campaigns RLS (should fail without auth):');
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('✅ Email campaigns correctly blocked for anonymous users:', error.message);
    } else {
      console.error('❌ Email campaigns should not be accessible without auth!');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // Test 5: Test a simple user profile query
  console.log('\n5️⃣ Testing profiles table access:');
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('✅ Profiles correctly blocked for anonymous users:', error.message);
    } else {
      console.error('❌ Profiles should not be accessible without auth!');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  console.log('\n✨ All tests completed!');
}

testFixes(); 