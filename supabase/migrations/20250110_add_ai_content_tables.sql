-- Create table for AI-generated content
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'blog', 'social', 'other')),
    prompt TEXT NOT NULL,
    generated_content JSONB NOT NULL,
    metadata JSONB,
    model_used VARCHAR(100),
    generation_time_ms INTEGER,
    tokens_used INTEGER,
    cost_cents INTEGER,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_ai_content_type ON ai_generated_content(type);
CREATE INDEX idx_ai_content_user_id ON ai_generated_content(user_id);
CREATE INDEX idx_ai_content_created_at ON ai_generated_content(created_at DESC);

-- Add AI fields to existing tables
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generation_id UUID REFERENCES ai_generated_content(id),
ADD COLUMN IF NOT EXISTS generation_metadata JSONB;

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generation_id UUID REFERENCES ai_generated_content(id),
ADD COLUMN IF NOT EXISTS generation_metadata JSONB;

-- Create table for AI generation templates/prompts
CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'blog', 'social', 'other')),
    prompt_template TEXT NOT NULL,
    variables JSONB,
    tone VARCHAR(50),
    length VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for AI generation history/analytics
CREATE TABLE IF NOT EXISTS public.ai_generation_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    total_generations INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    average_generation_time_ms INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ai_analytics_date_type_model ON ai_generation_analytics(date, type, model);

-- Enable RLS
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_generated_content
CREATE POLICY "Users can view their own AI content" ON ai_generated_content
    FOR SELECT USING (auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

CREATE POLICY "Users can create AI content" ON ai_generated_content
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can manage all AI content" ON ai_generated_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

-- RLS Policies for ai_prompt_templates
CREATE POLICY "Anyone can view active templates" ON ai_prompt_templates
    FOR SELECT USING (is_active = true OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

CREATE POLICY "Admin users can manage templates" ON ai_prompt_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

-- RLS Policies for ai_generation_analytics
CREATE POLICY "Admin users can view analytics" ON ai_generation_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

CREATE POLICY "System can insert analytics" ON ai_generation_analytics
    FOR INSERT WITH CHECK (true);

-- Function to track AI generation
CREATE OR REPLACE FUNCTION track_ai_generation(
    p_type VARCHAR,
    p_model VARCHAR,
    p_tokens INTEGER,
    p_cost_cents INTEGER,
    p_generation_time_ms INTEGER,
    p_success BOOLEAN
) RETURNS void AS $$
BEGIN
    INSERT INTO ai_generation_analytics (
        date,
        type,
        model,
        total_generations,
        total_tokens,
        total_cost_cents,
        average_generation_time_ms,
        success_rate
    ) VALUES (
        CURRENT_DATE,
        p_type,
        p_model,
        1,
        p_tokens,
        p_cost_cents,
        p_generation_time_ms,
        CASE WHEN p_success THEN 100 ELSE 0 END
    )
    ON CONFLICT (date, type, model) DO UPDATE SET
        total_generations = ai_generation_analytics.total_generations + 1,
        total_tokens = ai_generation_analytics.total_tokens + EXCLUDED.total_tokens,
        total_cost_cents = ai_generation_analytics.total_cost_cents + EXCLUDED.total_cost_cents,
        average_generation_time_ms = (
            (ai_generation_analytics.average_generation_time_ms * ai_generation_analytics.total_generations + EXCLUDED.average_generation_time_ms) 
            / (ai_generation_analytics.total_generations + 1)
        ),
        success_rate = (
            (ai_generation_analytics.success_rate * ai_generation_analytics.total_generations + EXCLUDED.success_rate) 
            / (ai_generation_analytics.total_generations + 1)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION track_ai_generation TO authenticated;
GRANT EXECUTE ON FUNCTION track_ai_generation TO service_role; 