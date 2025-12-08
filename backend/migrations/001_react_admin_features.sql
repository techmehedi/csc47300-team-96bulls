-- AI Interviewer - Database Migration for React Admin Features
-- Run this SQL in your Supabase SQL Editor

-- 1. Add soft delete columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Create admin_users table for admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin1', 'admin2')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. Add role column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- 6. Insert sample admin users (replace with your actual user IDs)
-- First, create test admin accounts via Supabase Auth Dashboard or signup
-- Then insert their IDs here:

-- Example:
-- INSERT INTO admin_users (user_id, role)
-- VALUES 
--   ('your-admin1-user-id', 'admin1'),
--   ('your-admin2-user-id', 'admin2')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- 7. Create RLS (Row Level Security) policies if needed
-- Note: Adjust these based on your security requirements

-- Allow admins to view all users
-- CREATE POLICY "Admins can view all users" ON users
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM admin_users
--       WHERE admin_users.user_id = auth.uid()
--     )
--   );

-- 8. Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant permissions (if using service role key, this may not be needed)
-- GRANT ALL ON admin_users TO authenticated;
-- GRANT ALL ON users TO authenticated;
-- GRANT ALL ON sessions TO authenticated;

-- Migration complete!
-- Next steps:
-- 1. Create admin user accounts via Supabase Auth
-- 2. Insert their user_ids into admin_users table with appropriate roles
-- 3. Test admin login and CRUD operations

SELECT 'Migration completed successfully!' AS status;
