require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBlogCategories() {
  try {
    console.log('Creating blog categories table...');

    // Create blog categories table
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create blog categories table
        CREATE TABLE IF NOT EXISTS blog_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          slug VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    });

    if (categoriesError) {
      console.error('Error creating blog_categories table:', categoriesError);
    } else {
      console.log('✓ Created blog_categories table');
    }

    // Create index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
      `
    });

    if (indexError) {
      console.error('Error creating index:', indexError);
    } else {
      console.log('✓ Created index');
    }

    // Insert default categories
    const defaultCategories = [
      { name: 'Fitness Tips', slug: 'fitness-tips', description: 'Expert fitness advice and workout tips' },
      { name: 'Nutrition', slug: 'nutrition', description: 'Healthy eating guides and meal planning' },
      { name: 'Success Stories', slug: 'success-stories', description: 'Client transformations and testimonials' },
      { name: 'Workouts', slug: 'workouts', description: 'Exercise routines and training programs' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Wellness, mindset, and healthy living' },
      { name: 'Recipes', slug: 'recipes', description: 'Healthy recipes and meal ideas' },
      { name: 'News', slug: 'news', description: 'JMEFit updates and announcements' }
    ];

    for (const category of defaultCategories) {
      const { error } = await supabase
        .from('blog_categories')
        .upsert(category, { onConflict: 'slug' });
      
      if (error) {
        console.error(`Error inserting category ${category.name}:`, error);
      } else {
        console.log(`✓ Created category: ${category.name}`);
      }
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
        
        -- Public can view categories
        CREATE POLICY IF NOT EXISTS "Public can view categories" ON blog_categories
          FOR SELECT USING (true);
        
        -- Service role has full access
        CREATE POLICY IF NOT EXISTS "Service role has full access" ON blog_categories
          FOR ALL USING (auth.role() = 'service_role');
      `
    });

    if (rlsError) {
      console.error('Error setting up RLS:', rlsError);
    } else {
      console.log('✓ Set up RLS policies');
    }

    console.log('\n✅ Blog categories setup completed successfully!');

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

createBlogCategories();