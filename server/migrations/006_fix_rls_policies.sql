-- Fix RLS policies for custom authentication (not using Supabase Auth)
-- This migration updates RLS policies to work with your custom auth system

-- Disable RLS on all tables (since we're using custom auth)
-- The backend server will handle all access control

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE badge_challenges DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that reference auth.uid()
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON auth_audit_logs;
DROP POLICY IF EXISTS "Service role can manage audit logs" ON auth_audit_logs;

-- Note: With RLS disabled, access control is handled by your backend
-- Make sure your backend properly validates user permissions before database operations

-- Grant necessary permissions to the anon role (used by your backend)
GRANT ALL ON users TO anon;
GRANT ALL ON user_sessions TO anon;
GRANT ALL ON auth_audit_logs TO anon;
GRANT ALL ON password_reset_tokens TO anon;
GRANT ALL ON email_verification_tokens TO anon;

-- Also grant permissions for sequences (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been disabled.';
  RAISE NOTICE 'Access control is now handled by your backend application.';
  RAISE NOTICE 'Make sure your backend validates user permissions!';
END $$;