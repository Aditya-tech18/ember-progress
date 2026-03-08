# Supabase Database Setup Instructions

## Step 1: Run SQL Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **SQL Editor**
3. Copy the entire content from `/app/database/mentorship_schema.sql`
4. Paste and click **RUN**

## Step 2: Create Storage Buckets

Go to **Storage** section and create these buckets:

### 1. mentor-verification-docs
- **Name:** mentor-verification-docs
- **Public:** NO (Private)
- **Allowed MIME types:** image/*, application/pdf

### 2. mentor-profile-images
- **Name:** mentor-profile-images
- **Public:** YES
- **Allowed MIME types:** image/*

### 3. mentor-media
- **Name:** mentor-media
- **Public:** YES
- **Allowed MIME types:** image/*

### 4. chat-attachments
- **Name:** chat-attachments
- **Public:** NO (Private)
- **Allowed MIME types:** image/*, application/pdf, application/*, text/*

## Step 3: Storage Policies

For each bucket, add these policies:

### mentor-verification-docs
```sql
-- Allow authenticated users to upload their verification docs
CREATE POLICY "Users can upload verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mentor-verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own docs and admins to view all
CREATE POLICY "Users and admins can view docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mentor-verification-docs' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid() IN (
      SELECT id FROM auth.users WHERE email IN ('tomacwin9961@gmail.com', 'prepixo.official@gmail.com', 'rituchaubey1984@gmail.com')
    )
  )
);
```

### mentor-profile-images
```sql
-- Allow mentors to upload profile images
CREATE POLICY "Mentors can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mentor-profile-images');

-- Public read access
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mentor-profile-images');

-- Mentors can update their images
CREATE POLICY "Mentors can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mentor-profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### mentor-media
```sql
-- Same as mentor-profile-images
CREATE POLICY "Mentors can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mentor-media');

CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mentor-media');
```

### chat-attachments
```sql
-- Session participants can upload
CREATE POLICY "Participants can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Session participants can view
CREATE POLICY "Participants can view attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');
```

## Done!

Your database is now ready for the mentorship platform.
