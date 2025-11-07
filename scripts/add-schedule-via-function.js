require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addScheduleColumns() {
  console.log('📅 Adding schedule columns to campaigns table...\n');

  try {
    // Create a test update to trigger column creation if it works
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
      // Try to update with schedule fields - this will tell us if columns exist
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          schedule_start: null,
          schedule_end: null
        })
        .eq('id', campaigns[0].id)
        .select();

      if (error) {
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          console.log('❌ Columns do not exist yet.\n');
          console.log('Creating columns using API endpoint...\n');

          // Try using the PostgREST schema endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              query: `
                ALTER TABLE campaigns
                ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;
              `
            })
          });

          console.log('Response status:', response.status);
          const result = await response.text();
          console.log('Response:', result);

          if (response.ok) {
            console.log('\n✅ Columns added successfully!');
          } else {
            console.log('\n⚠️  Could not add columns via API.');
            console.log('\nPlease run this SQL in Supabase SQL Editor:');
            console.log('-----------------------------------------------------');
            console.log('ALTER TABLE campaigns');
            console.log('ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE,');
            console.log('ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;');
            console.log('-----------------------------------------------------');
          }
        } else {
          console.error('Unexpected error:', error);
        }
      } else {
        console.log('✅ Schedule columns already exist or were successfully added!\n');
        console.log('Verified by successfully updating a test campaign.');
      }
    } else {
      console.log('⚠️  No campaigns found to test with.');
      console.log('\nPlease run this SQL in Supabase SQL Editor:');
      console.log('-----------------------------------------------------');
      console.log('ALTER TABLE campaigns');
      console.log('ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE,');
      console.log('ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;');
      console.log('-----------------------------------------------------');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addScheduleColumns();
