// Script to add storage policies using service role key
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function addStoragePolicies() {
  console.log('🔒 Adding Storage Policies\n');
  console.log('=' .repeat(60) + '\n');

  const policies = [
    {
      name: 'Allow anonymous uploads to campaign-files',
      sql: `
        CREATE POLICY IF NOT EXISTS "anon_insert_campaign_files"
        ON storage.objects
        FOR INSERT
        TO anon
        WITH CHECK (bucket_id = 'campaign-files');
      `
    },
    {
      name: 'Allow public read from campaign-files',
      sql: `
        CREATE POLICY IF NOT EXISTS "public_select_campaign_files"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'campaign-files');
      `
    },
    {
      name: 'Allow anonymous uploads to videos',
      sql: `
        CREATE POLICY IF NOT EXISTS "anon_insert_videos"
        ON storage.objects
        FOR INSERT
        TO anon
        WITH CHECK (bucket_id = 'videos');
      `
    },
    {
      name: 'Allow public read from videos',
      sql: `
        CREATE POLICY IF NOT EXISTS "public_select_videos"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'videos');
      `
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const policy of policies) {
    console.log(`Creating: ${policy.name}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: policy.sql });

      if (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        failCount++;
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      failCount++;
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log(`\n📊 Results: ${successCount} successful, ${failCount} failed\n`);

  if (failCount > 0) {
    console.log('⚠️  Some policies could not be created programmatically.\n');
    console.log('This is a Supabase limitation. Manual setup is required.\n');
    console.log('Please visit:');
    console.log('https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/storage/policies\n');
  } else {
    console.log('✅ All policies created successfully!\n');
  }
}

addStoragePolicies();
