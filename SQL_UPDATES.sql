-- Run these in Supabase SQL Editor

-- 1. Update existing approved mentors with default ratings
UPDATE mentor_profiles 
SET 
  rating = 4.5,
  total_reviews = 7,
  total_sessions = 0
WHERE is_verified = true AND (rating IS NULL OR rating = 0);

-- 2. Add profile_photo_url column if missing
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 3. Verify chaubeyaditya729@gmail.com user ID
SELECT id, email FROM auth.users WHERE email = 'chaubeyaditya729@gmail.com';

-- 4. Check if this user has mentor profile (replace USER_ID with result from above)
-- SELECT * FROM mentor_profiles WHERE user_id = 'REPLACE_WITH_USER_ID';

-- 5. Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('mentor_profiles', 'mentor_sessions', 'mentor_services', 'mentor_chats')
ORDER BY table_name;
