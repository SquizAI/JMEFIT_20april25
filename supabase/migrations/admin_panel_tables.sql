-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
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

-- Email Campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    html_content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipient_count INTEGER DEFAULT 0,
    open_rate DECIMAL(5,2) DEFAULT 0,
    click_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Email Recipients table
CREATE TABLE IF NOT EXISTS email_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked')),
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Log table for admin dashboard
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard Stats table for caching metrics
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL UNIQUE,
    metric_value JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

-- System Notifications table
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_recipients_campaign_id ON email_recipients(campaign_id);
CREATE INDEX idx_email_recipients_email ON email_recipients(email);
CREATE INDEX idx_admin_activity_log_user_id ON admin_activity_log(user_id);
CREATE INDEX idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_system_notifications_user_id ON system_notifications(user_id);
CREATE INDEX idx_system_notifications_read ON system_notifications(read);

-- Row Level Security (RLS) policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for email_templates (admin only)
CREATE POLICY "Admin users can view all email templates" ON email_templates
    FOR SELECT USING (auth.role() = 'admin' OR auth.role() = 'service_role');

CREATE POLICY "Admin users can create email templates" ON email_templates
    FOR INSERT WITH CHECK (auth.role() = 'admin' OR auth.role() = 'service_role');

CREATE POLICY "Admin users can update email templates" ON email_templates
    FOR UPDATE USING (auth.role() = 'admin' OR auth.role() = 'service_role');

CREATE POLICY "Admin users can delete email templates" ON email_templates
    FOR DELETE USING (auth.role() = 'admin' OR auth.role() = 'service_role');

-- Policies for email_campaigns (admin only)
CREATE POLICY "Admin users can view all email campaigns" ON email_campaigns
    FOR SELECT USING (auth.role() = 'admin' OR auth.role() = 'service_role');

CREATE POLICY "Admin users can create email campaigns" ON email_campaigns
    FOR INSERT WITH CHECK (auth.role() = 'admin' OR auth.role() = 'service_role');

CREATE POLICY "Admin users can update email campaigns" ON email_campaigns
    FOR UPDATE USING (auth.role() = 'admin' OR auth.role() = 'service_role');

-- Policies for admin_activity_log (admin read-only)
CREATE POLICY "Admin users can view activity logs" ON admin_activity_log
    FOR SELECT USING (auth.role() = 'admin' OR auth.role() = 'service_role');

CREATE POLICY "System can insert activity logs" ON admin_activity_log
    FOR INSERT WITH CHECK (true);

-- Policies for system_notifications
CREATE POLICY "Users can view their own notifications" ON system_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON system_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_activity_log (user_id, action, entity_type, entity_id, metadata)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', NOW()
        )
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for activity logging
CREATE TRIGGER log_email_template_activity
    AFTER INSERT OR UPDATE OR DELETE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

CREATE TRIGGER log_email_campaign_activity
    AFTER INSERT OR UPDATE OR DELETE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();