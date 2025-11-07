// Script to create storage buckets in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBucket(bucketName) {
  console.log(`🗄️  Creating ${bucketName} storage bucket...\n`);

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error(`❌ Error listing buckets:`, listError.message);
      return false;
    }

    const bucketExists = buckets.find(b => b.name === bucketName);

    if (bucketExists) {
      console.log(`✅ ${bucketName} bucket already exists!`);
      console.log(`   Bucket ID: ${bucketExists.id}`);
      console.log(`   Public: ${bucketExists.public}`);
      console.log(`   Created: ${bucketExists.created_at}\n`);
      return true;
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });

    if (error) {
      console.error(`❌ Error creating bucket:`, error.message);
      return false;
    }

    console.log(`✅ ${bucketName} storage bucket created successfully!`);
    console.log(`   Bucket name: ${bucketName}`);
    console.log(`   Public: Yes`);
    console.log(`   File size limit: 50MB\n`);

    // Verify bucket was created
    const { data: verifyBuckets } = await supabase.storage.listBuckets();
    const newBucket = verifyBuckets.find(b => b.name === bucketName);

    if (newBucket) {
      console.log('✅ Verification successful - bucket is accessible!\n');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function createAllBuckets() {
  console.log('📦 Setting up Supabase Storage Buckets\n');
  console.log('=' .repeat(50) + '\n');

  const bucketsToCreate = ['videos', 'campaign-files'];
  const results = [];

  for (const bucketName of bucketsToCreate) {
    const success = await createBucket(bucketName);
    results.push({ name: bucketName, success });
  }

  console.log('=' .repeat(50));
  console.log('\n📊 Summary:\n');

  results.forEach(({ name, success }) => {
    console.log(`   ${success ? '✅' : '❌'} ${name}`);
  });

  console.log('\n');
}

createAllBuckets();
