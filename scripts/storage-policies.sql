-- Storage Policies for Anonymous Uploads
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/sql

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access videos" ON storage.objects;

-- Policy 1: Allow anonymous users to INSERT (upload) files to campaign-files bucket
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'campaign-files');

-- Policy 2: Allow public read access to campaign-files bucket
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'campaign-files');

-- Policy 3: Allow anonymous users to INSERT (upload) files to videos bucket
CREATE POLICY "Allow anonymous uploads videos"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'videos');

-- Policy 4: Allow public read access to videos bucket
CREATE POLICY "Allow public read access videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Verify policies were created
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;
