-- User Management Tables
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- Add tags and notes to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Email Campaign Analytics Tables
CREATE TABLE IF NOT EXISTS public.email_campaign_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    spam_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_metrics_campaign_id ON email_campaign_metrics(campaign_id);

-- Financial Analytics Tables
CREATE TABLE IF NOT EXISTS public.revenue_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_date DATE NOT NULL,
    mrr DECIMAL(10, 2) DEFAULT 0,
    arr DECIMAL(10, 2) DEFAULT 0,
    new_mrr DECIMAL(10, 2) DEFAULT 0,
    churned_mrr DECIMAL(10, 2) DEFAULT 0,
    expansion_mrr DECIMAL(10, 2) DEFAULT 0,
    contraction_mrr DECIMAL(10, 2) DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    churned_customers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_revenue_metrics_date ON revenue_metrics(metric_date);

CREATE TABLE IF NOT EXISTS public.payment_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Management Tables
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image VARCHAR(500),
    author_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'draft',
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);

CREATE TABLE IF NOT EXISTS public.media_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Workflow Tables
CREATE TABLE IF NOT EXISTS public.automation_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_config JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflow_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_config JSONB,
    delay_minutes INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support System Tables
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number SERIAL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'normal',
    category VARCHAR(50),
    assigned_to UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);

-- Inventory Management Tables
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    sku VARCHAR(100) UNIQUE,
    current_stock INTEGER DEFAULT 0,
    reserved_stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_sku ON inventory(sku);

-- Advanced Scheduling Tables
CREATE TABLE IF NOT EXISTS public.class_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL,
    instructor_id UUID REFERENCES auth.users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(255),
    recurrence_rule TEXT,
    is_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_class_schedules_start_time ON class_schedules(start_time);
CREATE INDEX idx_class_schedules_instructor ON class_schedules(instructor_id);

-- Security & Compliance Tables
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Enable RLS on all tables
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create admin-only RLS policies for all tables
DO $$
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'user_activities',
        'email_campaign_metrics',
        'revenue_metrics',
        'payment_analytics',
        'blog_posts',
        'media_library',
        'automation_workflows',
        'workflow_actions',
        'support_tickets',
        'inventory',
        'class_schedules',
        'audit_logs'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Drop existing policies if they exist
        EXECUTE format('DROP POLICY IF EXISTS "Admin users can view %I" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Admin users can create %I" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Admin users can update %I" ON %I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Admin users can delete %I" ON %I', table_name, table_name);
        
        -- Create new policies
        EXECUTE format('
            CREATE POLICY "Admin users can view %I" ON %I
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND (auth.users.raw_user_meta_data->>''role'' = ''admin'' 
                         OR auth.users.raw_user_meta_data->>''is_admin'' = ''true'')
                )
            )', table_name, table_name);
            
        EXECUTE format('
            CREATE POLICY "Admin users can create %I" ON %I
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND (auth.users.raw_user_meta_data->>''role'' = ''admin'' 
                         OR auth.users.raw_user_meta_data->>''is_admin'' = ''true'')
                )
            )', table_name, table_name);
            
        EXECUTE format('
            CREATE POLICY "Admin users can update %I" ON %I
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND (auth.users.raw_user_meta_data->>''role'' = ''admin'' 
                         OR auth.users.raw_user_meta_data->>''is_admin'' = ''true'')
                )
            )', table_name, table_name);
            
        EXECUTE format('
            CREATE POLICY "Admin users can delete %I" ON %I
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND (auth.users.raw_user_meta_data->>''role'' = ''admin'' 
                         OR auth.users.raw_user_meta_data->>''is_admin'' = ''true'')
                )
            )', table_name, table_name);
    END LOOP;
END $$; 

-- Financial Reports Tables
CREATE TABLE IF NOT EXISTS revenue_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL,
  mrr DECIMAL(10,2) DEFAULT 0,
  arr DECIMAL(10,2) DEFAULT 0,
  new_mrr DECIMAL(10,2) DEFAULT 0,
  churned_mrr DECIMAL(10,2) DEFAULT 0,
  expansion_mrr DECIMAL(10,2) DEFAULT 0,
  contraction_mrr DECIMAL(10,2) DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(metric_date)
);

CREATE TABLE IF NOT EXISTS payment_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2),
  status TEXT,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Content Management Tables
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  categories TEXT[],
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Automated Workflows Tables
CREATE TABLE IF NOT EXISTS automation_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'draft',
  trigger JSONB,
  conditions JSONB,
  actions JSONB,
  stats JSONB DEFAULT '{"enrolled": 0, "completed": 0, "conversion_rate": 0, "revenue_generated": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS cart_recovery_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  abandoned_carts INTEGER DEFAULT 0,
  recovered_carts INTEGER DEFAULT 0,
  recovery_rate DECIMAL(5,2) DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  revenue_recovered DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Customer Support Tables
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  assigned_to UUID,
  satisfaction_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS faq_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Advanced Scheduling Tables
CREATE TABLE IF NOT EXISTS instructors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  bio TEXT,
  specialties TEXT[],
  rating DECIMAL(3,2) DEFAULT 5.0,
  photo_url TEXT,
  availability JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS fitness_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES instructors(id),
  type TEXT DEFAULT 'in-person',
  location TEXT,
  zoom_link TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  capacity INTEGER DEFAULT 20,
  enrolled INTEGER DEFAULT 0,
  recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  price DECIMAL(10,2) DEFAULT 25.00,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add RLS policies for all tables
ALTER TABLE revenue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_classes ENABLE ROW LEVEL SECURITY;

-- Create admin policies
CREATE POLICY "Admins can manage all data" ON revenue_metrics FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON payment_analytics FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON blog_posts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON media_library FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON automation_workflows FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON cart_recovery_analytics FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON support_tickets FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON ticket_messages FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON faq_items FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON instructors FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all data" ON fitness_classes FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Public read policies where appropriate
CREATE POLICY "Public can read published posts" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public can read FAQs" ON faq_items FOR SELECT USING (true);
CREATE POLICY "Public can read classes" ON fitness_classes FOR SELECT USING (status = 'scheduled');
CREATE POLICY "Public can read instructors" ON instructors FOR SELECT USING (true); 