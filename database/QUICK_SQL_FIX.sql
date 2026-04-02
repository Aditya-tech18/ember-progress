-- ============================================
-- QUICK SUPABASE SETUP FOR MENTOR APPLICATIONS
-- ============================================
-- Copy this entire script and run it in Supabase SQL Editor
-- This will fix the "Could not find table" error

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE MENTOR_APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.mentor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Academic Information
  exam_expertise TEXT[] NOT NULL,
  college_name TEXT NOT NULL,
  course TEXT NOT NULL,
  display_college_publicly BOOLEAN DEFAULT true,
  
  -- Profile Information
  tagline TEXT NOT NULL,
  achievements TEXT NOT NULL,
  about_me TEXT NOT NULL,
  
  -- Verification Documents URLs
  college_id_url TEXT NOT NULL,
  exam_result_url TEXT NOT NULL,
  
  -- Application Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mentor_applications_user_id ON mentor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_status ON mentor_applications(status);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_created_at ON mentor_applications(created_at DESC);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE mentor_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON mentor_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create applications" ON mentor_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending applications
CREATE POLICY "Users can update pending applications" ON mentor_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all applications
CREATE POLICY "Admins can view all" ON mentor_applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('tomacwin9961@gmail.com', 'prepixo.official@gmail.com', 'rituchaubey1984@gmail.com')
    )
  );

-- Admins can update any application
CREATE POLICY "Admins can update all" ON mentor_applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('tomacwin9961@gmail.com', 'prepixo.official@gmail.com', 'rituchaubey1984@gmail.com')
    )
  );

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mentor_applications_updated_at 
  BEFORE UPDATE ON mentor_applications
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFY TABLE CREATION
-- ============================================
SELECT 'mentor_applications table created successfully!' as message;
SELECT COUNT(*) as total_applications FROM mentor_applications;

-- ============================================
-- DONE! 
-- ============================================
-- Now try submitting the application form again.
-- It should work! ✅
