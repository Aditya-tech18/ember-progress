-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;

-- Add RLS policies for post_images storage bucket
-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post_images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view post images (public bucket)
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post_images');

-- Allow users to delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post_images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own post images
CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post_images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update posts table to allow admins to delete any post
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Users and admins can delete posts" ON public.posts;

CREATE POLICY "Users and admins can delete posts"
ON public.posts FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.email IN ('tomacwin9961@gmail.com', 'prepixo.official@gmail.com')
  )
);