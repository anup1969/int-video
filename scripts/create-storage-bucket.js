// Script to create videos storage bucket in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createVideosBucket() {
  console.log('🗄️  Creating videos storage bucket...\n');

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    const videosExists = buckets.find(b => b.name === 'videos');

    if (videosExists) {
      console.log('✅ Videos bucket already exists!');
      console.log(`   Bucket ID: ${videosExists.id}`);
      console.log(`   Public: ${videosExists.public}`);
      console.log(`   Created: ${videosExists.created_at}\n`);
      return;
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('videos', {
      public: true
    });

    if (error) {
      console.error('❌ Error creating bucket:', error.message);
      return;
    }

    console.log('✅ Videos storage bucket created successfully!');
    console.log('   Bucket name: videos');
    console.log('   Public: Yes\n');

    // Verify bucket was created
    const { data: verifyBuckets } = await supabase.storage.listBuckets();
    const newBucket = verifyBuckets.find(b => b.name === 'videos');

    if (newBucket) {
      console.log('✅ Verification successful - bucket is accessible!\n');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createVideosBucket();
