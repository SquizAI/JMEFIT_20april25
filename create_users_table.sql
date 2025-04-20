-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  stripe_customer_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create an index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert sample users
INSERT INTO users (email, first_name, last_name, stripe_customer_id, metadata)
VALUES 
  ('user1@example.com', 'John', 'Doe', 'cus_sample1', '{"role": "customer"}'::jsonb),
  ('user2@example.com', 'Jane', 'Smith', 'cus_sample2', '{"role": "customer"}'::jsonb),
  ('admin@example.com', 'Admin', 'User', 'cus_admin', '{"role": "admin"}'::jsonb)
ON CONFLICT (email) DO UPDATE 
SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
