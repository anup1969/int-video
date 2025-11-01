const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function executeSQLFix() {
  console.log('🔧 Connecting directly to PostgreSQL database...\n');

  // Supabase connection details
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl.split('.')[0].split('//')[1];

  // Construct PostgreSQL connection string
  // Supabase uses: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
  console.log('⚠️  To execute this fix, we need the database password.');
  console.log('   Please go to: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/settings/database');
  console.log('   And copy the connection string or password.\n');

  console.log('Alternatively, run this SQL directly in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/sql/new\n');

  // Read the SQL fix file
  const sqlFile = path.join(__dirname, '../supabase/complete-fix.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  console.log('Copy and paste this SQL:');
  console.log('═'.repeat(80));
  console.log(sqlContent);
  console.log('═'.repeat(80));
  console.log('\nAfter running the SQL, the dashboard will work!');
}

executeSQLFix().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
