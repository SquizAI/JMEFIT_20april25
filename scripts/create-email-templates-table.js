import { supabase } from '../src/lib/supabase.js';

async function createEmailTemplatesTable() {
  console.log('Creating email_templates table...');
  
  try {
    // Note: This would normally be done through Supabase migrations
    // but since we don't have direct SQL access, we'll just check if the table exists
    const { data, error } = await supabase
      .from('email_templates')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.error('❌ Table email_templates does not exist.');
      console.log('Please create it through Supabase dashboard with the following structure:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    json_content JSONB,
    category VARCHAR(50) CHECK (category IN ('marketing', 'transactional', 'newsletter', 'notification')),
    is_template BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin users
CREATE POLICY "Admin users can view all email templates" ON email_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );
      `);
    } else if (error) {
      console.error('❌ Error checking table:', error.message);
    } else {
      console.log('✅ Table email_templates already exists!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  process.exit(0);
}

createEmailTemplatesTable(); 