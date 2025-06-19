-- JMEFIT Marketing Automation Database Schema
-- This extends the existing Supabase schema with marketing automation tables

-- Create prospects table for lead management
CREATE TABLE IF NOT EXISTS prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    
    -- Lead source tracking
    lead_source TEXT NOT NULL, -- 'website_form', 'quiz', 'social_media', 'referral', 'advertisement'
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    
    -- Demographic data for ICP scoring
    age INTEGER,
    gender TEXT, -- 'female', 'male', 'non_binary', 'prefer_not_to_say'
    location_city TEXT,
    location_state TEXT,
    location_country TEXT DEFAULT 'US',
    annual_income_range TEXT, -- 'under_25k', '25k_35k', '35k_50k', '50k_75k', '75k_100k', 'over_100k'
    
    -- Fitness & nutrition goals
    fitness_goals TEXT[], -- ['weight_loss', 'muscle_building', 'general_fitness', 'strength', 'endurance', 'nutrition_guidance']
    experience_level TEXT, -- 'complete_beginner', 'beginner', 'intermediate', 'advanced'
    previous_programs TEXT[], -- List of programs they've tried
    current_workout_frequency INTEGER, -- Days per week
    nutrition_knowledge_level TEXT, -- 'none', 'basic', 'intermediate', 'advanced'
    
    -- Lifestyle factors
    time_availability INTEGER, -- Minutes per day for fitness
    preferred_workout_time TEXT, -- 'morning', 'afternoon', 'evening', 'flexible'
    equipment_access TEXT[], -- ['gym', 'home_basic', 'home_full', 'outdoor', 'bodyweight_only']
    dietary_restrictions TEXT[], -- ['none', 'vegetarian', 'vegan', 'gluten_free', 'keto', 'paleo', 'allergies']
    
    -- Social media data (from OAuth or manual collection)
    social_data JSONB DEFAULT '{}', -- Instagram/Facebook profile data
    social_media_handles JSONB DEFAULT '{}', -- {'instagram': '@handle', 'facebook': 'profile_id'}
    
    -- ICP scoring and segmentation
    icp_score INTEGER DEFAULT 0,
    icp_factors TEXT[], -- Array of factors that contributed to score
    segment TEXT, -- 'hot', 'warm', 'cold'
    recommended_product TEXT, -- 'nutrition_training', 'nutrition_only', 'self_led', 'trainer_feedback'
    
    -- Engagement tracking
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    last_email_open TIMESTAMP WITH TIME ZONE,
    last_email_click TIMESTAMP WITH TIME ZONE,
    quiz_completion_date TIMESTAMP WITH TIME ZONE,
    quiz_results JSONB DEFAULT '{}',
    
    -- Conversion tracking
    conversion_status TEXT DEFAULT 'prospect', -- 'prospect', 'trial', 'customer', 'churned'
    first_purchase_date TIMESTAMP WITH TIME ZONE,
    first_purchase_product TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0,
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    
    -- Communication preferences
    email_opt_in BOOLEAN DEFAULT true,
    sms_opt_in BOOLEAN DEFAULT false,
    communication_frequency TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
    timezone TEXT DEFAULT 'America/New_York',
    
    -- Automation tracking
    active_sequence TEXT, -- Current email sequence they're in
    sequence_step INTEGER DEFAULT 0,
    last_sequence_email TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email sequences table for automation
CREATE TABLE IF NOT EXISTS email_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    sequence_type TEXT NOT NULL, -- 'hot_lead', 'warm_lead', 'cold_lead', 'post_purchase', 'reactivation'
    email_number INTEGER NOT NULL, -- 1, 2, 3, etc.
    email_template TEXT NOT NULL, -- Template identifier
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement tracking
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'sent', 'delivered', 'failed', 'cancelled'
    
    -- Metadata
    subject_line TEXT,
    personalizations JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead magnets table for tracking downloads
CREATE TABLE IF NOT EXISTS lead_magnets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    magnet_type TEXT NOT NULL, -- 'macro_calculator', 'workout_pdf', 'nutrition_guide', 'meal_templates'
    magnet_title TEXT NOT NULL,
    download_url TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social media integrations table
CREATE TABLE IF NOT EXISTS social_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'instagram', 'facebook', 'tiktok', 'youtube'
    platform_user_id TEXT NOT NULL,
    username TEXT,
    follower_count INTEGER,
    following_count INTEGER,
    post_count INTEGER,
    bio TEXT,
    verified BOOLEAN DEFAULT false,
    
    -- Fitness-related metrics
    fitness_post_count INTEGER DEFAULT 0,
    last_fitness_post_date TIMESTAMP WITH TIME ZONE,
    engagement_rate DECIMAL(5,2), -- Percentage
    
    -- Profile data
    profile_data JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation events table for tracking
CREATE TABLE IF NOT EXISTS automation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'email_sent', 'email_opened', 'quiz_completed', 'product_viewed', 'purchase_made'
    event_data JSONB DEFAULT '{}',
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Associated records
    email_sequence_id UUID REFERENCES email_sequences(id),
    product_id TEXT, -- Reference to Stripe product
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
CREATE INDEX IF NOT EXISTS idx_prospects_segment ON prospects(segment);
CREATE INDEX IF NOT EXISTS idx_prospects_icp_score ON prospects(icp_score);
CREATE INDEX IF NOT EXISTS idx_prospects_conversion_status ON prospects(conversion_status);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at);

CREATE INDEX IF NOT EXISTS idx_email_sequences_prospect_id ON email_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_scheduled_for ON email_sequences(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON email_sequences(status);

CREATE INDEX IF NOT EXISTS idx_lead_magnets_prospect_id ON lead_magnets(prospect_id);
CREATE INDEX IF NOT EXISTS idx_social_integrations_prospect_id ON social_integrations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_automation_events_prospect_id ON automation_events(prospect_id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prospects_updated_at
    BEFORE UPDATE ON prospects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for ICP scoring (can be called from n8n)
CREATE OR REPLACE FUNCTION calculate_icp_score(
    prospect_age INTEGER,
    prospect_gender TEXT,
    prospect_income TEXT,
    prospect_goals TEXT[],
    prospect_experience TEXT,
    social_follower_count INTEGER DEFAULT 0,
    fitness_post_count INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Age scoring
    IF prospect_age BETWEEN 30 AND 45 THEN
        score := score + 25;
    ELSIF prospect_age BETWEEN 25 AND 30 OR prospect_age BETWEEN 45 AND 55 THEN
        score := score + 15;
    ELSIF prospect_age < 25 OR prospect_age > 55 THEN
        score := score + 5;
    END IF;
    
    -- Gender scoring
    IF prospect_gender = 'female' THEN
        score := score + 20;
    ELSIF prospect_gender = 'non_binary' THEN
        score := score + 10;
    ELSIF prospect_gender = 'male' THEN
        score := score + 5;
    END IF;
    
    -- Income scoring
    IF prospect_income IN ('50k_75k', '75k_100k', 'over_100k') THEN
        score := score + 15;
    ELSIF prospect_income IN ('35k_50k') THEN
        score := score + 10;
    END IF;
    
    -- Goals scoring
    IF 'weight_loss' = ANY(prospect_goals) AND 'muscle_building' = ANY(prospect_goals) THEN
        score := score + 20;
    ELSIF 'weight_loss' = ANY(prospect_goals) THEN
        score := score + 15;
    ELSIF 'nutrition_guidance' = ANY(prospect_goals) THEN
        score := score + 15;
    END IF;
    
    -- Experience level scoring
    IF prospect_experience = 'beginner' THEN
        score := score + 15;
    ELSIF prospect_experience = 'intermediate' THEN
        score := score + 10;
    END IF;
    
    -- Social media scoring
    IF social_follower_count > 100 THEN
        score := score + 5;
    END IF;
    
    IF fitness_post_count > 5 THEN
        score := score + 10;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Create function to determine recommended product based on ICP score
CREATE OR REPLACE FUNCTION get_recommended_product(icp_score INTEGER, goals TEXT[])
RETURNS TEXT AS $$
BEGIN
    IF icp_score >= 70 THEN
        -- Hot leads - recommend premium
        IF 'nutrition_guidance' = ANY(goals) AND 'muscle_building' = ANY(goals) THEN
            RETURN 'nutrition_training';
        ELSE
            RETURN 'nutrition_only';
        END IF;
    ELSIF icp_score >= 40 THEN
        -- Warm leads - start with mid-tier
        RETURN 'self_led';
    ELSE
        -- Cold leads - start with entry level
        RETURN 'one_time_macros';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO prospects (
    email, first_name, last_name, lead_source, age, gender, 
    fitness_goals, experience_level, icp_score, segment
) VALUES 
    ('sarah.test@example.com', 'Sarah', 'Johnson', 'quiz', 34, 'female', 
     ARRAY['weight_loss', 'muscle_building'], 'beginner', 75, 'hot'),
    ('mike.test@example.com', 'Mike', 'Chen', 'website_form', 28, 'male', 
     ARRAY['general_fitness'], 'intermediate', 35, 'cold'),
    ('jenny.test@example.com', 'Jenny', 'Williams', 'social_media', 41, 'female', 
     ARRAY['weight_loss', 'nutrition_guidance'], 'beginner', 65, 'warm')
ON CONFLICT (email) DO NOTHING;

-- Create views for easy data analysis
CREATE OR REPLACE VIEW prospect_segments AS
SELECT 
    segment,
    COUNT(*) as count,
    AVG(icp_score) as avg_score,
    COUNT(CASE WHEN conversion_status = 'customer' THEN 1 END) as converted_count,
    ROUND(
        COUNT(CASE WHEN conversion_status = 'customer' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 
        2
    ) as conversion_rate
FROM prospects 
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY segment;

CREATE OR REPLACE VIEW email_performance AS
SELECT 
    sequence_type,
    email_number,
    COUNT(*) as sent_count,
    COUNT(opened_at) as open_count,
    COUNT(clicked_at) as click_count,
    ROUND(COUNT(opened_at)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as open_rate,
    ROUND(COUNT(clicked_at)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as click_rate
FROM email_sequences 
WHERE status = 'sent' AND sent_at >= NOW() - INTERVAL '30 days'
GROUP BY sequence_type, email_number
ORDER BY sequence_type, email_number; 