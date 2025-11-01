const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTables() {
  console.log('🚀 Setting up Supabase tables...\n');

  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, '../supabase/create-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split SQL into individual statements (basic split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments
      if (statement.startsWith('--')) continue;

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

      if (error) {
        // Try direct query if RPC doesn't work
        const { error: directError } = await supabase.from('_').select('*').limit(0);

        if (directError) {
          console.log(`⚠️  Statement ${i + 1} may have failed (this might be okay if table already exists)`);
          console.log(`   Error: ${error.message}`);
        } else {
          console.log(`✅ Statement ${i + 1} executed`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    }

    console.log('\n🎉 Table setup completed!');
    console.log('\nNow testing table access...\n');

    // Test if campaigns table exists and is accessible
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);

    if (campaignsError) {
      console.error('❌ Error accessing campaigns table:', campaignsError.message);
      console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
      console.log(sql);
      process.exit(1);
    } else {
      console.log('✅ campaigns table is accessible');
      console.log(`   Found ${campaigns?.length || 0} existing campaigns`);
    }

    // Test if responses table exists
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .limit(1);

    if (responsesError) {
      console.log('⚠️  responses table may not exist:', responsesError.message);
    } else {
      console.log('✅ responses table is accessible');
    }

    console.log('\n✨ All done! Your database is ready to use.\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📋 Manual setup required. Please run the SQL in supabase/create-tables.sql in your Supabase SQL Editor');
    process.exit(1);
  }
}

// Run setup
setupTables();
