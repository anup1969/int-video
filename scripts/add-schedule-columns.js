require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addScheduleColumns() {
  console.log('📅 Adding schedule columns to campaigns table...\n');

  try {
    // Note: Supabase JS client doesn't support DDL operations directly
    // We need to run SQL through the SQL editor in Supabase dashboard
    // or use the REST API with raw SQL

    console.log('⚠️  Please run the following SQL in your Supabase SQL Editor:\n');
    console.log('-----------------------------------------------------');
    console.log('ALTER TABLE campaigns');
    console.log('ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE,');
    console.log('ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;');
    console.log('-----------------------------------------------------\n');

    console.log('✅ Or, if you want to add them via API, use the following commands:\n');

    // Alternative: You can use pg client if you have database credentials
    console.log('Columns to add:');
    console.log('  - schedule_start: TIMESTAMP WITH TIME ZONE (nullable)');
    console.log('  - schedule_end: TIMESTAMP WITH TIME ZONE (nullable)');
    console.log('');
    console.log('These columns will store the campaign schedule in UTC.');
    console.log('The UI will display times in IST (Asia/Kolkata timezone).\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addScheduleColumns();
