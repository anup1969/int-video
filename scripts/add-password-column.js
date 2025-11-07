require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addPasswordColumn() {
  console.log('🔒 Adding password column to campaigns table...\n');

  try {
    // First, let's try to get any campaign to test with
    const { data: campaigns, error: fetchError } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);

    if (fetchError) {
      console.error('Error fetching campaigns:', fetchError);
      return;
    }

    if (campaigns && campaigns.length > 0) {
      // Try to update with password field - this will tell us if column exists
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          password: null
        })
        .eq('id', campaigns[0].id)
        .select();

      if (error) {
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          console.log('❌ Password column does not exist yet.\n');
          console.log('Please run this SQL in Supabase SQL Editor:');
          console.log('-----------------------------------------------------');
          console.log('ALTER TABLE campaigns');
          console.log('ADD COLUMN IF NOT EXISTS password TEXT;');
          console.log('');
          console.log('-- Add comment to describe the column');
          console.log("COMMENT ON COLUMN campaigns.password IS 'Optional password for campaign protection. NULL means no password protection.';");
          console.log('-----------------------------------------------------');
          console.log('\nAfter running the SQL, run this script again to verify.\n');
        } else {
          console.error('Unexpected error:', error);
        }
      } else {
        console.log('✅ Password column already exists or was successfully added!\n');
        console.log('Verified by successfully updating a test campaign.');

        // Verify the column by selecting it
        const { data: verifyData, error: verifyError } = await supabase
          .from('campaigns')
          .select('id, password')
          .limit(1);

        if (!verifyError && verifyData) {
          console.log('✅ Column verification successful - password column is accessible.\n');
        }
      }
    } else {
      console.log('⚠️  No campaigns found to test with.');
      console.log('\nPlease run this SQL in Supabase SQL Editor:');
      console.log('-----------------------------------------------------');
      console.log('ALTER TABLE campaigns');
      console.log('ADD COLUMN IF NOT EXISTS password TEXT;');
      console.log('');
      console.log('-- Add comment to describe the column');
      console.log("COMMENT ON COLUMN campaigns.password IS 'Optional password for campaign protection. NULL means no password protection.';");
      console.log('-----------------------------------------------------');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addPasswordColumn();
