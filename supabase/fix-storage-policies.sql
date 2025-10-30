-- Fix Storage Bucket RLS Policies for Videos
-- Run this in Supabase SQL Editor

-- Allow public uploads to the videos bucket
CREATE POLICY IF NOT EXISTS "Allow public uploads to videos bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'videos');

-- Allow public to read from videos bucket
CREATE POLICY IF NOT EXISTS "Allow public reads from videos bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Allow public to update videos
CREATE POLICY IF NOT EXISTS "Allow public updates to videos bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- Allow public to delete from videos bucket
CREATE POLICY IF NOT EXISTS "Allow public deletes from videos bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'videos');
