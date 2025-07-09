-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_template ON email_templates(is_template);
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view all email templates" ON email_templates;
DROP POLICY IF EXISTS "Admin users can create email templates" ON email_templates;
DROP POLICY IF EXISTS "Admin users can update email templates" ON email_templates;
DROP POLICY IF EXISTS "Admin users can delete email templates" ON email_templates;

-- Create RLS policies for admin users
CREATE POLICY "Admin users can view all email templates" ON email_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

CREATE POLICY "Admin users can create email templates" ON email_templates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

CREATE POLICY "Admin users can update email templates" ON email_templates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

CREATE POLICY "Admin users can delete email templates" ON email_templates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, json_content, category, is_template)
VALUES 
  -- Welcome Email Template
  ('Welcome to JMEFIT', 'Welcome to Your Fitness Journey!', 
   '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to JMEFIT!</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">Welcome to JMEFIT!</h1><p>We''re excited to have you join our fitness community. Get ready to transform your life with personalized training and nutrition guidance.</p><div style="text-align: center; margin: 20px 0;"><a href="https://jmefit.com" style="display: inline-block; padding: 12px 24px; background-color: #6B46C1; color: white; text-decoration: none; border-radius: 8px;">Get Started</a></div></div></body></html>',
   '{"blocks":[{"id":"1","type":"header","content":{"text":"Welcome to JMEFIT!"},"styles":{}},{"id":"2","type":"text","content":{"text":"We''re excited to have you join our fitness community. Get ready to transform your life with personalized training and nutrition guidance."},"styles":{}},{"id":"3","type":"button","content":{"text":"Get Started","url":"https://jmefit.com"},"styles":{}},{"id":"4","type":"divider","content":{},"styles":{}},{"id":"5","type":"social","content":{},"styles":{}}]}',
   'transactional', true),
   
  -- Promotional Email with Discount
  ('Special Offer', 'Exclusive Discount Inside!',
   '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Special Offer from JMEFIT</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">Special Offer Just for You!</h1><p>As a valued member of our community, we''re offering you an exclusive discount on your next program.</p><div style="margin: 30px 0; text-align: center;"><div style="background: linear-gradient(135deg, #f3e7ff 0%, #ffe0f7 100%); border: 2px dashed #9333ea; border-radius: 12px; padding: 30px; max-width: 400px; margin: 0 auto;"><div style="color: #7c3aed; font-size: 14px; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Exclusive Offer</div><div style="color: #6b21a8; font-size: 36px; font-weight: bold; margin-bottom: 10px; font-family: monospace; letter-spacing: 2px;">SAVE20</div><div style="color: #374151; font-size: 16px; margin-bottom: 5px;">Save 20% on any program</div><div style="color: #6b7280; font-size: 14px; margin-top: 10px;">Valid until Dec 31, 2024</div></div></div></div></body></html>',
   '{"blocks":[{"id":"1","type":"header","content":{"text":"Special Offer Just for You!"},"styles":{}},{"id":"2","type":"text","content":{"text":"As a valued member of our community, we''re offering you an exclusive discount on your next program."},"styles":{}},{"id":"3","type":"discount","content":{"code":"SAVE20","description":"Save 20% on any program","expiry":"Valid until Dec 31, 2024"},"styles":{}},{"id":"4","type":"button","content":{"text":"Shop Now","url":"https://jmefit.com/pricing"},"styles":{}},{"id":"5","type":"text","content":{"text":"Use the code at checkout to apply your discount. Don''t miss out!"},"styles":{}}]}',
   'marketing', true),
   
  -- Newsletter Template
  ('Monthly Update', 'JMEFIT Monthly Newsletter',
   '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>JMEFIT Monthly Update</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">JMEFIT Monthly Update</h1><div style="text-align: center; margin: 20px 0;"><img src="https://jmefit.com/images/JMEFIT_hero_mirrored.png" alt="Newsletter Header" style="max-width: 100%;"></div><p>Check out what''s new this month at JMEFIT...</p><div style="text-align: center; margin: 20px 0;"><a href="https://jmefit.com/blog" style="display: inline-block; padding: 12px 24px; background-color: #6B46C1; color: white; text-decoration: none; border-radius: 8px;">Read More</a></div></div></body></html>',
   '{"blocks":[{"id":"1","type":"header","content":{"text":"JMEFIT Monthly Update"},"styles":{}},{"id":"2","type":"image","content":{"url":"https://jmefit.com/images/JMEFIT_hero_mirrored.png","alt":"Newsletter Header"},"styles":{}},{"id":"3","type":"text","content":{"text":"Check out what''s new this month at JMEFIT..."},"styles":{}},{"id":"4","type":"button","content":{"text":"Read More","url":"https://jmefit.com/blog"},"styles":{}}]}',
   'newsletter', true),
   
  -- Class Reminder
  ('Class Reminder', 'Your Class is Tomorrow!',
   '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Class Reminder</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">Your Class is Tomorrow!</h1><p>Don''t forget about your upcoming class tomorrow at 9:00 AM.</p><div style="text-align: center; margin: 20px 0;"><a href="https://jmefit.com/schedule" style="display: inline-block; padding: 12px 24px; background-color: #6B46C1; color: white; text-decoration: none; border-radius: 8px;">View Schedule</a></div></div></body></html>',
   '{"blocks":[{"id":"1","type":"header","content":{"text":"Your Class is Tomorrow!"},"styles":{}},{"id":"2","type":"text","content":{"text":"Don''t forget about your upcoming class tomorrow at 9:00 AM."},"styles":{}},{"id":"3","type":"button","content":{"text":"View Schedule","url":"https://jmefit.com/schedule"},"styles":{}}]}',
   'notification', true),
   
  -- Thank You Email
  ('Thank You', 'Thank You for Your Purchase!',
   '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Thank You</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">Thank You for Your Purchase!</h1><p>We appreciate your trust in JMEFIT. Your journey to a healthier, stronger you starts now!</p><p>Our team is here to support you every step of the way. If you have any questions, don''t hesitate to reach out.</p><hr style="border: 1px solid #e0e0e0; margin: 20px 0;"><div style="text-align: center; padding: 20px;"><a href="#" style="margin: 0 10px;">📘 Facebook</a><a href="#" style="margin: 0 10px;">🐦 Twitter</a><a href="#" style="margin: 0 10px;">📷 Instagram</a></div></div></body></html>',
   '{"blocks":[{"id":"1","type":"header","content":{"text":"Thank You for Your Purchase!"},"styles":{}},{"id":"2","type":"text","content":{"text":"We appreciate your trust in JMEFIT. Your journey to a healthier, stronger you starts now!"},"styles":{}},{"id":"3","type":"text","content":{"text":"Our team is here to support you every step of the way. If you have any questions, don''t hesitate to reach out."},"styles":{}},{"id":"4","type":"divider","content":{},"styles":{}},{"id":"5","type":"social","content":{},"styles":{}}]}',
   'transactional', true)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to service role for RLS bypass (if needed)
GRANT ALL ON TABLE email_templates TO service_role; 