// Automated Database Setup Script
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('🗄️  Setting up database tables...\n');

  try {
    // Read the SQL file
    const sqlPath = './supabase/setup.sql';
    const fullSQL = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded successfully');
    console.log('📊 Attempting to execute SQL statements...\n');

    // Try to use Supabase SQL execution via RPC
    // Note: This requires the SQL to be executed via Supabase dashboard
    // But let's try creating tables programmatically instead

    console.log('⚠️  Direct SQL execution not supported via JS client.');
    console.log('📋 Creating tables programmatically...\n');

    // Check if tables already exist by trying to query them
    console.log('1️⃣  Checking campaigns table...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);

    if (!campaignsError) {
      console.log('   ✅ campaigns table already exists');
    } else if (campaignsError.code === 'PGRST116' || campaignsError.message.includes('does not exist')) {
      console.log('   ❌ campaigns table does not exist');
      console.log('   ℹ️  Table needs to be created via SQL Editor');
    } else {
      console.log('   ⚠️  Error:', campaignsError.message);
    }

    console.log('\n2️⃣  Checking steps table...');
    const { data: steps, error: stepsError } = await supabase
      .from('steps')
      .select('id')
      .limit(1);

    if (!stepsError) {
      console.log('   ✅ steps table already exists');
    } else if (stepsError.code === 'PGRST116' || stepsError.message.includes('does not exist')) {
      console.log('   ❌ steps table does not exist');
      console.log('   ℹ️  Table needs to be created via SQL Editor');
    } else {
      console.log('   ⚠️  Error:', stepsError.message);
    }

    console.log('\n3️⃣  Checking connections table...');
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('id')
      .limit(1);

    if (!connectionsError) {
      console.log('   ✅ connections table already exists');
    } else if (connectionsError.code === 'PGRST116' || connectionsError.message.includes('does not exist')) {
      console.log('   ❌ connections table does not exist');
      console.log('   ℹ️  Table needs to be created via SQL Editor');
    } else {
      console.log('   ⚠️  Error:', connectionsError.message);
    }

    console.log('\n' + '='.repeat(60));

    if (!campaignsError && !stepsError && !connectionsError) {
      console.log('✅ DATABASE SETUP COMPLETE!');
      console.log('   All 3 tables exist and are accessible.\n');
      return true;
    } else {
      console.log('⚠️  MANUAL SETUP REQUIRED');
      console.log('\n📋 Please follow these steps:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk');
      console.log('   2. Click "SQL Editor" in the left sidebar');
      console.log('   3. Click "New query"');
      console.log('   4. Open file: supabase/setup.sql');
      console.log('   5. Copy all contents and paste into SQL Editor');
      console.log('   6. Click "Run" (or press Ctrl+Enter)');
      console.log('   7. Wait ~10 seconds for completion\n');
      console.log('   Or run this command in your terminal:');
      console.log('   > type supabase\\setup.sql | clip');
      console.log('   (This copies the SQL to your clipboard)\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

setupDatabase();
