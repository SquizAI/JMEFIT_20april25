import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBlogRLS() {
  try {
    console.log('Fixing blog_posts RLS policies...');
    
    // First, check if policies already exist
    const { data: existingPolicies } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT policyname 
          FROM pg_policies 
          WHERE tablename = 'blog_posts' 
          AND schemaname = 'public';
        `
      });
    
    console.log('Existing policies:', existingPolicies);
    
    // Drop existing policies if they exist
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
        DROP POLICY IF EXISTS "Admins can manage all blog posts" ON blog_posts;
      `
    });
    
    if (dropError) {
      console.error('Error dropping policies:', dropError);
    }
    
    // Create new policies
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Allow anyone to read published blog posts
        CREATE POLICY "Anyone can view published blog posts" 
          ON blog_posts FOR SELECT 
          USING (status = 'published');
        
        -- Allow admins to manage all blog posts
        CREATE POLICY "Admins can manage all blog posts"
          ON blog_posts FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM auth.users
              WHERE id = auth.uid() 
              AND raw_user_meta_data->>'is_admin' = 'true'
            )
          );
      `
    });
    
    if (createError) {
      console.error('Error creating policies:', createError);
      process.exit(1);
    }
    
    console.log('✅ Successfully fixed blog_posts RLS policies');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the fix
fixBlogRLS(); 