// Script to set up storage bucket policies using Supabase client
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStoragePolicies() {
  console.log('🔒 Setting up Storage Bucket Policies\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // First, let's check current bucket settings
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    console.log('📦 Current buckets:\n');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name}`);
      console.log(`     Public: ${bucket.public}`);
      console.log(`     File size limit: ${bucket.file_size_limit || 'unlimited'}`);
      console.log(`     Allowed MIME types: ${bucket.allowed_mime_types?.join(', ') || 'all'}\n`);
    });

    console.log('=' .repeat(60));
    console.log('\n⚠️  IMPORTANT: Storage policies cannot be created via API.\n');
    console.log('You need to configure them manually in Supabase Dashboard:\n');
    console.log('🔗 Direct link: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/storage/policies\n');
    console.log('=' .repeat(60) + '\n');

    console.log('📋 STEP-BY-STEP INSTRUCTIONS:\n');

    console.log('1️⃣  Go to Storage Policies page:');
    console.log('   https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/storage/policies\n');

    console.log('2️⃣  For EACH bucket (campaign-files and videos), create 2 policies:\n');

    console.log('   📝 POLICY 1: Allow Anonymous Uploads');
    console.log('   ────────────────────────────────────');
    console.log('   - Click "New Policy" button');
    console.log('   - Click "For full customization" (or "Create a policy from scratch")');
    console.log('   - Policy Name: Allow anonymous uploads');
    console.log('   - Allowed operation: INSERT');
    console.log('   - Policy definition: Copy and paste this:');
    console.log('\n   true\n');
    console.log('   - Click "Review" then "Save policy"\n');

    console.log('   📝 POLICY 2: Allow Public Read');
    console.log('   ─────────────────────────────');
    console.log('   - Click "New Policy" button again');
    console.log('   - Click "For full customization"');
    console.log('   - Policy Name: Allow public read');
    console.log('   - Allowed operation: SELECT');
    console.log('   - Policy definition: Copy and paste this:');
    console.log('\n   true\n');
    console.log('   - Click "Review" then "Save policy"\n');

    console.log('3️⃣  Repeat step 2 for BOTH buckets:');
    console.log('   - campaign-files');
    console.log('   - videos\n');

    console.log('=' .repeat(60) + '\n');
    console.log('💡 TIP: The policy definition "true" means allow all operations\n');
    console.log('=' .repeat(60) + '\n');

    console.log('✅ After creating the policies, test by uploading a video recording!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupStoragePolicies();
