require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeSQL() {
  console.log('🔒 Executing SQL to add password column...\n');

  try {
    // Try to execute raw SQL using RPC function
    // Note: This requires a custom RPC function in Supabase
    const sql = `
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS password TEXT;
    `;

    console.log('Attempting to execute SQL...');
    console.log(sql);

    // Method 1: Try using pg client if available
    const pg = require('pg');

    // Parse the Supabase URL to get database connection details
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1];

    // Construct database URL
    // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;

    if (!dbPassword) {
      console.log('\n⚠️  SUPABASE_DB_PASSWORD not found in .env.local');
      console.log('\nTo add the database password:');
      console.log('1. Go to Supabase Dashboard → Settings → Database');
      console.log('2. Copy the database password');
      console.log('3. Add to .env.local: SUPABASE_DB_PASSWORD=your_password');
      console.log('\nOR run this SQL manually in Supabase SQL Editor:');
      console.log('-----------------------------------------------------');
      console.log('ALTER TABLE campaigns');
      console.log('ADD COLUMN IF NOT EXISTS password TEXT;');
      console.log('-----------------------------------------------------\n');
      return;
    }

    const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;

    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected to database\n');

    const result = await client.query(sql);
    console.log('✅ SQL executed successfully!\n');

    await client.end();

    // Verify the column was added
    console.log('Verifying column was added...');
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, password')
      .limit(1);

    if (error) {
      console.log('⚠️  Verification warning:', error.message);
    } else {
      console.log('✅ Password column verified and accessible!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log('-----------------------------------------------------');
    console.log('ALTER TABLE campaigns');
    console.log('ADD COLUMN IF NOT EXISTS password TEXT;');
    console.log('-----------------------------------------------------\n');
  }
}

executeSQL();
