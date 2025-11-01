const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

async function executeSQLFix() {
  console.log('🔧 Executing SQL fix to recreate tables with correct schema...\n');

  // Read the SQL fix file
  const sqlFile = path.join(__dirname, '../supabase/complete-fix.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  // Split into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  // Use direct HTTP API with service role key to bypass RLS
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comment-only statements
    if (statement.trim().startsWith('--')) continue;

    console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: statement })
      });

      if (!response.ok) {
        // Try alternative approach using pg_query
        const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/pg_query`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response2.ok) {
          // Use pg connection string if available, otherwise use raw SQL execution
          const { createClient } = require('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          });

          // Try using raw SQL execution
          const { error } = await supabase.rpc('exec_sql', { sql: statement });

          if (error && !error.message.includes('already exists')) {
            console.log(`⚠️  Statement may have failed: ${error.message}`);
          } else {
            console.log(`✅ Statement ${i + 1} executed`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1} error (may be okay): ${err.message}`);
    }
  }

  console.log('\n🧪 Testing database access...\n');

  // Test if we can now insert a campaign
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('campaigns')
    .insert([{ name: 'Test Campaign', status: 'draft' }])
    .select();

  if (error) {
    console.error('❌ Still cannot insert into campaigns:', error.message);
    console.log('\n📋 Please run the SQL manually in Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].split('//')[1]}/editor`);
    console.log('\nSQL to run:');
    console.log(sqlContent);
    process.exit(1);
  } else {
    console.log('✅ Successfully inserted test campaign!');
    // Clean up test data
    if (data && data[0]) {
      await supabase.from('campaigns').delete().eq('id', data[0].id);
      console.log('✅ Cleaned up test data');
    }
    console.log('\n🎉 Database is now properly configured!');
    console.log('\n✨ You can now create campaigns at: https://int-video.vercel.app/dashboard\n');
  }
}

executeSQLFix().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
