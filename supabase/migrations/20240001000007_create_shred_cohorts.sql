-- Create SHRED cohorts table
CREATE TABLE IF NOT EXISTS shred_cohorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  enrollment_start DATE NOT NULL,
  enrollment_end DATE NOT NULL,
  max_participants INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 297.00,
  status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'enrolling', 'active', 'completed')),
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create SHRED participants table
CREATE TABLE IF NOT EXISTS shred_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES shred_cohorts(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, cohort_id)
);

-- Create indexes
CREATE INDEX idx_shred_cohorts_status ON shred_cohorts(status);
CREATE INDEX idx_shred_cohorts_start_date ON shred_cohorts(start_date);
CREATE INDEX idx_shred_participants_cohort ON shred_participants(cohort_id);
CREATE INDEX idx_shred_participants_user ON shred_participants(user_id);

-- Create function to update current_participants count
CREATE OR REPLACE FUNCTION update_cohort_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE shred_cohorts 
    SET current_participants = current_participants + 1
    WHERE id = NEW.cohort_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE shred_cohorts 
    SET current_participants = current_participants - 1
    WHERE id = OLD.cohort_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update participant count
CREATE TRIGGER update_cohort_count
AFTER INSERT OR DELETE ON shred_participants
FOR EACH ROW
EXECUTE FUNCTION update_cohort_participants_count();

-- Add RLS policies
ALTER TABLE shred_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred_participants ENABLE ROW LEVEL SECURITY;

-- Public can view active/enrolling cohorts
CREATE POLICY "Public can view active cohorts" ON shred_cohorts
  FOR SELECT USING (status IN ('enrolling', 'active'));

-- Authenticated users can view their own participation
CREATE POLICY "Users can view own participation" ON shred_participants
  FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access (for admin panel)
CREATE POLICY "Service role has full access to cohorts" ON shred_cohorts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to participants" ON shred_participants
  FOR ALL USING (auth.role() = 'service_role');