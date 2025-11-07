require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addScheduleColumns() {
  console.log('📅 Adding schedule columns to campaigns table...\n');

  try {
    // Use Supabase's RPC to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;
      `
    });

    if (error) {
      // If RPC doesn't exist, try direct approach by updating a test record
      console.log('⚠️  RPC method not available. Using alternative approach...\n');

      // Check if columns exist by trying to select them
      const { data: testData, error: testError } = await supabase
        .from('campaigns')
        .select('schedule_start, schedule_end')
        .limit(1);

      if (testError && testError.message.includes('column')) {
        console.log('❌ Columns do not exist yet.\n');
        console.log('Please run the following SQL in your Supabase SQL Editor:\n');
        console.log('-----------------------------------------------------');
        console.log('ALTER TABLE campaigns');
        console.log('ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE,');
        console.log('ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;');
        console.log('-----------------------------------------------------\n');
      } else if (!testError) {
        console.log('✅ Schedule columns already exist or were successfully added!\n');
        console.log('Column details:');
        console.log('  - schedule_start: TIMESTAMP WITH TIME ZONE (nullable)');
        console.log('  - schedule_end: TIMESTAMP WITH TIME ZONE (nullable)\n');
      }
    } else {
      console.log('✅ Schedule columns added successfully!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addScheduleColumns();
