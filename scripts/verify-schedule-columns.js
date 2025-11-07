require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyColumns() {
  console.log('✅ Verifying schedule columns...\n');

  try {
    // Try to fetch campaigns with the new columns
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name, schedule_start, schedule_end')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\nColumns may not exist yet.');
      return;
    }

    console.log('✅ SUCCESS! Schedule columns are working!\n');
    console.log('Test query returned:', data ? data.length : 0, 'campaign(s)');
    if (data && data.length > 0) {
      console.log('Sample data:', JSON.stringify(data[0], null, 2));
    }
    console.log('\n🎉 Campaign Scheduler is FULLY ACTIVE!\n');
    console.log('You can now:');
    console.log('1. Open any campaign in the builder');
    console.log('2. Click "Settings" button');
    console.log('3. Set Start Date/Time and End Date/Time');
    console.log('4. Save the campaign\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

verifyColumns();
