-- Fix Storage Bucket RLS Policies for Videos
-- Run this in Supabase SQL Editor

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public uploads to videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from videos bucket" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow public uploads to videos bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public reads from videos bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

CREATE POLICY "Allow public updates to videos bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public deletes from videos bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'videos');
