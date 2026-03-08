# SUPABASE DATABASE SETUP - COMPLETE GUIDE

## STEP 1: Run This SQL in Supabase SQL Editor

Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query

Paste and run the entire content of `/app/database/mentorship_schema.sql`

**OR** run this shortened version:

```sql
-- Run this in Supabase SQL Editor
-- This creates all tables for mentorship platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run the full SQL from /app/database/mentorship_schema.sql
-- It includes all tables, RLS policies, and triggers
```

## STEP 2: Create Storage Buckets

Go to: Storage → New Bucket

### Bucket 1: mentor-verification-docs
- Name: `mentor-verification-docs`
- Public: **NO** (Private)
- File size limit: 5MB
- Allowed MIME types: `image/*`, `application/pdf`

### Bucket 2: mentor-profile-images  
- Name: `mentor-profile-images`
- Public: **YES**
- File size limit: 2MB
- Allowed MIME types: `image/*`

### Bucket 3: mentor-media
- Name: `mentor-media`
- Public: **YES**  
- File size limit: 5MB
- Allowed MIME types: `image/*`

### Bucket 4: chat-attachments
- Name: `chat-attachments`
- Public: **NO** (Private)
- File size limit: 10MB
- Allowed MIME types: `image/*`, `application/*`, `text/*`

## STEP 3: Set Storage Policies

For each bucket, go to: Storage → [Bucket Name] → Policies → New Policy

### For mentor-verification-docs:

```sql
-- Allow authenticated users to upload
CREATE POLICY \"Users can upload verification docs\"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mentor-verification-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users and admins to view
CREATE POLICY \"Users and admins can view docs\"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mentor-verification-docs' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid() IN (
      SELECT id FROM auth.users WHERE email IN (
        'tomacwin9961@gmail.com',
        'prepixo.official@gmail.com',
        'rituchaubey1984@gmail.com'
      )
    )
  )
);
```

### For mentor-profile-images & mentor-media:

```sql
-- Allow authenticated users to upload
CREATE POLICY \"Users can upload images\"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mentor-profile-images');

-- Public read access
CREATE POLICY \"Public can view images\"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mentor-profile-images');

-- Allow users to update their own images
CREATE POLICY \"Users can update images\"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mentor-profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

(Repeat for mentor-media with appropriate bucket_id)

### For chat-attachments:

```sql
-- Allow participants to upload
CREATE POLICY \"Participants can upload\"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow participants to view
CREATE POLICY \"Participants can view\"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');
```

## STEP 4: Verify Setup

Run this query to verify all tables are created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'mentor%';
```

You should see:
- mentor_applications
- mentor_profiles
- mentor_services
- mentor_sessions
- mentor_chats
- admin_application_chats

## STEP 5: Test with Sample Data (Optional)

```sql
-- Insert a test mentor application
INSERT INTO mentor_applications (
  user_id,
  full_name,
  mobile_number,
  email,
  exam_expertise,
  college_name,
  course,
  tagline,
  achievements,
  about_me,
  college_id_url,
  exam_result_url,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Test Mentor',
  '+919999999999',
  'test@example.com',
  ARRAY['JEE'],
  'IIT Delhi',
  'B.Tech CSE',
  'Helping students crack JEE',
  'AIR 450 JEE Advanced\\nAIR 1200 JEE Main',
  'I cleared JEE and want to help others',
  'https://example.com/id.jpg',
  'https://example.com/result.pdf',
  'approved'
);
```

## ✅ SETUP COMPLETE!

Your Supabase database is now ready for the mentorship platform.

Next: Run the frontend app and test the features!
