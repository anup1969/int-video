const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uwzzdxroqqynmqkmwlpk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3enpkeHJvcXF5bm1xa213bHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU4NjAxNywiZXhwIjoyMDc3MTYyMDE3fQ.EFwNdaOoUTUSmoEitGZaH64b8UqJiW99j9rLRi5b5iU'
);

async function setupStoragePolicy() {
  console.log('Setting up storage policies for campaign-files bucket...');

  // Create policies using SQL
  const policies = [
    {
      name: 'Allow public uploads',
      sql: `
        INSERT INTO storage.policies (name, bucket_id, definition)
        SELECT 'Allow public uploads', 'campaign-files', '{"operation": "INSERT", "role": "anon"}'
        WHERE NOT EXISTS (
          SELECT 1 FROM storage.policies WHERE name = 'Allow public uploads' AND bucket_id = 'campaign-files'
        );
      `
    }
  ];

  // Test if we can upload with service key
  console.log('Testing upload with service key...');
  const testBuffer = Buffer.from('test audio upload policy');
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('campaign-files')
    .upload('test-upload-' + Date.now() + '.txt', testBuffer, {
      contentType: 'text/plain',
      upsert: false
    });

  if (uploadError) {
    console.error('Service key upload failed:', uploadError.message);
  } else {
    console.log('Service key upload successful:', uploadData.path);
    // Clean up
    await supabase.storage.from('campaign-files').remove([uploadData.path]);
    console.log('Test file cleaned up');
  }

  // Check bucket public status
  const { data: bucket } = await supabase.storage.getBucket('campaign-files');
  console.log('Bucket public:', bucket.public);
  console.log('Bucket file size limit:', bucket.file_size_limit / 1024 / 1024, 'MB');

  console.log('\nIMPORTANT: You need to create a storage policy in Supabase Dashboard:');
  console.log('1. Go to Storage > Policies');
  console.log('2. For bucket "campaign-files", add policy:');
  console.log('   - Name: Allow anonymous uploads');
  console.log('   - Operation: INSERT');
  console.log('   - Target roles: anon');
  console.log('   - Policy: true');
}

setupStoragePolicy();
