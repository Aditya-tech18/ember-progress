
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  application_id UUID,
  
  full_name TEXT NOT NULL,
  profile_photo_url TEXT,
  tagline TEXT NOT NULL,
  achievements TEXT NOT NULL,
  about_me TEXT NOT NULL,
  
  college_name TEXT,
  course TEXT,
  display_college BOOLEAN DEFAULT true,
  
  exam_expertise TEXT[] NOT NULL,
  expertise_tags TEXT[],
  
  media_urls TEXT[],
  
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT true,
  
  total_sessions INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_exam_expertise ON mentor_profiles USING GIN(exam_expertise);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_active ON mentor_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_rating ON mentor_profiles(rating DESC);

ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active mentors" ON mentor_profiles;
CREATE POLICY "Public can view active mentors"
ON mentor_profiles FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Mentors can update own profiles" ON mentor_profiles;
CREATE POLICY "Mentors can update own profiles"
ON mentor_profiles FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Admins can insert profiles" ON mentor_profiles;
CREATE POLICY "Admins can insert profiles"
ON mentor_profiles FOR INSERT
WITH CHECK (true);

-- Also create mentor_services table
CREATE TABLE IF NOT EXISTS mentor_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price_inr DECIMAL(10,2) NOT NULL,
  
  service_type TEXT CHECK (service_type IN ('doubt_solving', 'mock_analysis', 'strategy_session', 'full_guidance')),
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_services_mentor_id ON mentor_services(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_services_active ON mentor_services(is_active);

ALTER TABLE mentor_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active services" ON mentor_services;
CREATE POLICY "Public can view active services"
ON mentor_services FOR SELECT
USING (is_active = true);
