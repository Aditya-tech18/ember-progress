-- =====================================================
-- PREPIXO MENTORSHIP PLATFORM - DATABASE SCHEMA
-- =====================================================
-- This schema supports the complete mentorship feature
-- including mentor profiles, applications, sessions, and chat
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MENTOR APPLICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Academic Information
  exam_expertise TEXT[] NOT NULL, -- ['JEE', 'NEET', 'CUET', 'NDA', 'Boards']
  college_name TEXT NOT NULL,
  course TEXT NOT NULL,
  display_college_publicly BOOLEAN DEFAULT true,
  
  -- Profile Information
  tagline TEXT NOT NULL,
  achievements TEXT NOT NULL, -- Multiline achievements
  about_me TEXT NOT NULL,
  
  -- Verification Documents (Supabase Storage URLs)
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

-- Create indexes for faster queries
CREATE INDEX idx_mentor_applications_user_id ON mentor_applications(user_id);
CREATE INDEX idx_mentor_applications_status ON mentor_applications(status);
CREATE INDEX idx_mentor_applications_created_at ON mentor_applications(created_at DESC);

-- =====================================================
-- 2. MENTOR PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES mentor_applications(id),
  
  -- Profile Information
  full_name TEXT NOT NULL,
  profile_photo_url TEXT,
  tagline TEXT NOT NULL,
  achievements TEXT NOT NULL,
  about_me TEXT NOT NULL,
  
  -- Academic Information (Optional display)
  college_name TEXT,
  course TEXT,
  display_college BOOLEAN DEFAULT true,
  
  -- Expertise
  exam_expertise TEXT[] NOT NULL,
  expertise_tags TEXT[], -- ['Physics', 'Maths', 'Strategy', 'Mock Analysis']
  
  -- Media Gallery (Array of image URLs)
  media_urls TEXT[],
  
  -- Profile Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT true,
  
  -- Statistics
  total_sessions INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX idx_mentor_profiles_exam_expertise ON mentor_profiles USING GIN(exam_expertise);
CREATE INDEX idx_mentor_profiles_active ON mentor_profiles(is_active);
CREATE INDEX idx_mentor_profiles_rating ON mentor_profiles(rating DESC);

-- =====================================================
-- 3. MENTOR SERVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  
  -- Service Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 99), -- Minimum ₹99
  duration_minutes INTEGER, -- Optional duration
  
  -- Service Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_mentor_services_mentor_id ON mentor_services(mentor_id);
CREATE INDEX idx_mentor_services_active ON mentor_services(is_active);
CREATE INDEX idx_mentor_services_price ON mentor_services(price ASC);

-- =====================================================
-- 4. MENTOR SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES mentor_services(id),
  
  -- Payment Information
  payment_amount INTEGER NOT NULL,
  payment_id TEXT, -- Razorpay payment ID
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Session Details
  session_status TEXT DEFAULT 'pending' CHECK (session_status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  meeting_link TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Feedback
  student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
  student_review TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_mentor_sessions_student_id ON mentor_sessions(student_id);
CREATE INDEX idx_mentor_sessions_mentor_id ON mentor_sessions(mentor_id);
CREATE INDEX idx_mentor_sessions_status ON mentor_sessions(session_status);
CREATE INDEX idx_mentor_sessions_created_at ON mentor_sessions(created_at DESC);

-- =====================================================
-- 5. MENTOR CHATS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mentor_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
  
  -- Message Information
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT,
  
  -- Attachments (Images/Files)
  attachment_url TEXT,
  attachment_type TEXT CHECK (attachment_type IN ('image', 'file', NULL)),
  
  -- Message Status
  is_read BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_mentor_chats_session_id ON mentor_chats(session_id);
CREATE INDEX idx_mentor_chats_sender_id ON mentor_chats(sender_id);
CREATE INDEX idx_mentor_chats_created_at ON mentor_chats(created_at ASC);

-- =====================================================
-- 6. ADMIN CHAT MESSAGES TABLE (For Application Review)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_application_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES mentor_applications(id) ON DELETE CASCADE,
  
  -- Message Information
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'applicant')),
  message_text TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_admin_chats_application_id ON admin_application_chats(application_id);
CREATE INDEX idx_admin_chats_created_at ON admin_application_chats(created_at ASC);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE mentor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_application_chats ENABLE ROW LEVEL SECURITY;

-- Mentor Applications Policies
CREATE POLICY "Users can view their own applications"
  ON mentor_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON mentor_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications"
  ON mentor_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admin can view all applications
CREATE POLICY "Admins can view all applications"
  ON mentor_applications FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('tomacwin9961@gmail.com', 'prepixo.official@gmail.com', 'rituchaubey1984@gmail.com')
    )
  );

-- Admin can update applications
CREATE POLICY "Admins can update applications"
  ON mentor_applications FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('tomacwin9961@gmail.com', 'prepixo.official@gmail.com', 'rituchaubey1984@gmail.com')
    )
  );

-- Mentor Profiles Policies
CREATE POLICY "Anyone can view approved mentor profiles"
  ON mentor_profiles FOR SELECT
  USING (is_active = true AND is_verified = true);

CREATE POLICY "Mentors can view their own profile"
  ON mentor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can update their own profile"
  ON mentor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can delete their own profile"
  ON mentor_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON mentor_profiles FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('tomacwin9961@gmail.com', 'prepixo.official@gmail.com', 'rituchaubey1984@gmail.com')
    )
  );

-- Mentor Services Policies
CREATE POLICY "Anyone can view active services"
  ON mentor_services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Mentors can manage their own services"
  ON mentor_services FOR ALL
  USING (mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid()));

-- Sessions Policies
CREATE POLICY "Students can view their own sessions"
  ON mentor_sessions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Mentors can view their sessions"
  ON mentor_sessions FOR SELECT
  USING (mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can create sessions"
  ON mentor_sessions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants can update session details"
  ON mentor_sessions FOR UPDATE
  USING (
    student_id = auth.uid() OR 
    mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
  );

-- Chat Policies
CREATE POLICY "Participants can view session chats"
  ON mentor_chats FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM mentor_sessions 
      WHERE student_id = auth.uid() 
      OR mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON mentor_chats FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    session_id IN (
      SELECT id FROM mentor_sessions 
      WHERE student_id = auth.uid() 
      OR mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
    )
  );

-- Admin Chat Policies
CREATE POLICY "Applicants and admins can view application chats"
  ON admin_application_chats FOR SELECT
  USING (
    application_id IN (SELECT id FROM mentor_applications WHERE user_id = auth.uid())
    OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('tomacwin9961@gmail.com', 'prepixo.official@gmail.com', 'rituchaubey1984@gmail.com')
    )
  );

CREATE POLICY "Applicants and admins can send messages"
  ON admin_application_chats FOR INSERT
  WITH CHECK (
    (sender_role = 'applicant' AND application_id IN (SELECT id FROM mentor_applications WHERE user_id = auth.uid()))
    OR
    (sender_role = 'admin' AND auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('tomacwin9961@gmail.com', 'prepixo.official@gmail.com', 'rituchaubey1984@gmail.com')
    ))
  );

-- =====================================================
-- 8. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_mentor_applications_updated_at BEFORE UPDATE ON mentor_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentor_profiles_updated_at BEFORE UPDATE ON mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentor_services_updated_at BEFORE UPDATE ON mentor_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentor_sessions_updated_at BEFORE UPDATE ON mentor_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create mentor profile after application approval
CREATE OR REPLACE FUNCTION create_mentor_profile_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO mentor_profiles (
      user_id,
      application_id,
      full_name,
      tagline,
      achievements,
      about_me,
      college_name,
      course,
      display_college,
      exam_expertise,
      is_active,
      is_verified
    ) VALUES (
      NEW.user_id,
      NEW.id,
      NEW.full_name,
      NEW.tagline,
      NEW.achievements,
      NEW.about_me,
      NEW.college_name,
      NEW.course,
      NEW.display_college_publicly,
      NEW.exam_expertise,
      true,
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create profile on approval
CREATE TRIGGER create_profile_on_application_approval
  AFTER UPDATE ON mentor_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_mentor_profile_on_approval();

-- =====================================================
-- 9. STORAGE BUCKETS (Run these in Supabase Dashboard)
-- =====================================================
-- Create these buckets in Supabase Storage:
-- 1. mentor-verification-docs (private)
-- 2. mentor-profile-images (public)
-- 3. mentor-media (public)
-- 4. chat-attachments (private)

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================
