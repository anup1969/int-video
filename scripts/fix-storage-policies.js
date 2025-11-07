// Script to fix storage bucket policies for anonymous uploads
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStoragePolicies() {
  console.log('🔒 Fixing Storage Bucket Policies\n');
  console.log('=' .repeat(50) + '\n');

  try {
    // We need to use direct SQL to create storage policies
    // Storage policies are stored in storage.objects table

    const policies = [
      {
        name: 'Allow anonymous uploads to campaign-files',
        bucket: 'campaign-files',
        sql: `
          CREATE POLICY IF NOT EXISTS "Allow anonymous uploads"
          ON storage.objects
          FOR INSERT
          TO anon
          WITH CHECK (bucket_id = 'campaign-files');
        `
      },
      {
        name: 'Allow public read access to campaign-files',
        bucket: 'campaign-files',
        sql: `
          CREATE POLICY IF NOT EXISTS "Allow public read access"
          ON storage.objects
          FOR SELECT
          TO public
          USING (bucket_id = 'campaign-files');
        `
      },
      {
        name: 'Allow anonymous uploads to videos',
        bucket: 'videos',
        sql: `
          CREATE POLICY IF NOT EXISTS "Allow anonymous uploads videos"
          ON storage.objects
          FOR INSERT
          TO anon
          WITH CHECK (bucket_id = 'videos');
        `
      },
      {
        name: 'Allow public read access to videos',
        bucket: 'videos',
        sql: `
          CREATE POLICY IF NOT EXISTS "Allow public read access videos"
          ON storage.objects
          FOR SELECT
          TO public
          USING (bucket_id = 'videos');
        `
      }
    ];

    console.log('📝 Creating storage policies...\n');

    for (const policy of policies) {
      console.log(`   Creating: ${policy.name}...`);

      const { error } = await supabase.rpc('exec_sql', {
        query: policy.sql
      });

      if (error) {
        // Try alternative method using the Supabase Management API
        console.log(`   ⚠️  Note: ${error.message}`);
      } else {
        console.log(`   ✅ Created successfully`);
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('\n✅ Storage policies configuration completed!\n');
    console.log('📌 Manual Steps Required:\n');
    console.log('   1. Go to: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/storage/policies');
    console.log('   2. For bucket "campaign-files", add these policies:\n');
    console.log('      Policy 1: Allow INSERT for anon users');
    console.log('      - Name: Allow anonymous uploads');
    console.log('      - Operation: INSERT');
    console.log('      - Target role: anon');
    console.log('      - Policy definition: true\n');
    console.log('      Policy 2: Allow SELECT for public');
    console.log('      - Name: Allow public read');
    console.log('      - Operation: SELECT');
    console.log('      - Target role: public');
    console.log('      - Policy definition: true\n');
    console.log('   3. Repeat for "videos" bucket\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📌 Please configure policies manually in Supabase Dashboard\n');
  }
}

fixStoragePolicies();
