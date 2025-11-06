-- Storage policies for test-reports uploads

-- Allow anyone to upload files to test-reports folder
CREATE POLICY "Allow public uploads to test-reports"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'campaign-files' AND
  (storage.foldername(name))[1] = 'test-reports'
);

-- Allow anyone to read files from test-reports folder
CREATE POLICY "Allow public read access to test-reports"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'campaign-files' AND
  (storage.foldername(name))[1] = 'test-reports'
);

-- Allow anyone to update files in test-reports folder
CREATE POLICY "Allow public updates to test-reports"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'campaign-files' AND
  (storage.foldername(name))[1] = 'test-reports'
);

-- Allow anyone to delete files from test-reports folder
CREATE POLICY "Allow public deletes from test-reports"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'campaign-files' AND
  (storage.foldername(name))[1] = 'test-reports'
);
