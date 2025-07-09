require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createShredTables() {
  try {
    console.log('Creating SHRED cohorts and participants tables...');

    // Create SHRED cohorts table
    const { error: cohortsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (cohortsError) {
      console.error('Error creating shred_cohorts table:', cohortsError);
    } else {
      console.log('✓ Created shred_cohorts table');
    }

    // Create SHRED participants table
    const { error: participantsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (participantsError) {
      console.error('Error creating shred_participants table:', participantsError);
    } else {
      console.log('✓ Created shred_participants table');
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_shred_cohorts_status ON shred_cohorts(status);
        CREATE INDEX IF NOT EXISTS idx_shred_cohorts_start_date ON shred_cohorts(start_date);
        CREATE INDEX IF NOT EXISTS idx_shred_participants_cohort ON shred_participants(cohort_id);
        CREATE INDEX IF NOT EXISTS idx_shred_participants_user ON shred_participants(user_id);
      `
    });

    if (indexError) {
      console.error('Error creating indexes:', indexError);
    } else {
      console.log('✓ Created indexes');
    }

    // Create function to update participant count
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (functionError) {
      console.error('Error creating function:', functionError);
    } else {
      console.log('✓ Created update function');
    }

    // Create trigger
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create trigger to auto-update participant count
        DROP TRIGGER IF EXISTS update_cohort_count ON shred_participants;
        CREATE TRIGGER update_cohort_count
        AFTER INSERT OR DELETE ON shred_participants
        FOR EACH ROW
        EXECUTE FUNCTION update_cohort_participants_count();
      `
    });

    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
    } else {
      console.log('✓ Created trigger');
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE shred_cohorts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE shred_participants ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    } else {
      console.log('✓ Enabled RLS');
    }

    // Create policies
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Public can view active/enrolling cohorts
        CREATE POLICY IF NOT EXISTS "Public can view active cohorts" ON shred_cohorts
          FOR SELECT USING (status IN ('enrolling', 'active'));

        -- Authenticated users can view their own participation
        CREATE POLICY IF NOT EXISTS "Users can view own participation" ON shred_participants
          FOR SELECT USING (auth.uid() = user_id);

        -- Service role has full access (for admin panel)
        CREATE POLICY IF NOT EXISTS "Service role has full access to cohorts" ON shred_cohorts
          FOR ALL USING (auth.role() = 'service_role');

        CREATE POLICY IF NOT EXISTS "Service role has full access to participants" ON shred_participants
          FOR ALL USING (auth.role() = 'service_role');
      `
    });

    if (policiesError) {
      console.error('Error creating policies:', policiesError);
    } else {
      console.log('✓ Created RLS policies');
    }

    // Insert sample cohort
    const { error: sampleError } = await supabase
      .from('shred_cohorts')
      .insert([{
        cohort_name: 'Winter 2025 SHRED',
        start_date: '2025-02-01',
        end_date: '2025-03-15',
        enrollment_start: '2025-01-15',
        enrollment_end: '2025-01-31',
        max_participants: 50,
        price: 297.00,
        status: 'planning',
        description: 'Transform your body and mind with our 6-week intensive SHRED program',
        features: [
          '6-week intensive transformation program',
          'Daily workouts and meal plans',
          'Weekly check-ins with coaches',
          'Private community access',
          'Progress tracking and accountability'
        ]
      }]);

    if (sampleError) {
      console.error('Error creating sample cohort:', sampleError);
    } else {
      console.log('✓ Created sample cohort');
    }

    console.log('\n✅ SHRED tables setup completed successfully!');

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

createShredTables();