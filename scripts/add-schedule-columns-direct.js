require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function addScheduleColumns() {
  console.log('📅 Adding schedule columns to campaigns table...\n');

  // Extract database credentials from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  // Parse the Supabase URL to get the project reference
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.error('❌ Could not parse Supabase URL');
    process.exit(1);
  }

  // Construct PostgreSQL connection string
  const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || '[YOUR_DB_PASSWORD]'}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;

  console.log('Project Reference:', projectRef);
  console.log('Attempting to connect to database...\n');

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Add the columns
    const sql = `
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;
    `;

    await client.query(sql);

    console.log('✅ Schedule columns added successfully!\n');
    console.log('Column details:');
    console.log('  - schedule_start: TIMESTAMP WITH TIME ZONE (nullable)');
    console.log('  - schedule_end: TIMESTAMP WITH TIME ZONE (nullable)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nNote: If connection failed, you may need to:');
    console.log('1. Add SUPABASE_DB_PASSWORD to your .env.local file');
    console.log('2. Get the password from: Supabase Dashboard > Project Settings > Database > Connection String\n');
  } finally {
    await client.end();
  }
}

addScheduleColumns();
