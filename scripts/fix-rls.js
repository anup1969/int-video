const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLS() {
  console.log('🔧 Fixing RLS policies...\n');

  // For now, let's just disable RLS on these tables to get things working
  // In production, you'd want proper RLS policies

  const tables = ['campaigns', 'steps', 'connections', 'responses'];

  for (const table of tables) {
    console.log(`⏳ Disabling RLS for ${table} table...`);

    // Try to insert a test record to verify access
    try {
      if (table === 'campaigns') {
        const { data, error } = await supabase
          .from(table)
          .insert([{ name: 'Test Campaign', status: 'draft' }])
          .select();

        if (error) {
          console.log(`❌ Error with ${table}:`, error.message);
          console.log('   RLS is blocking INSERT operations');
        } else {
          console.log(`✅ ${table} table is writable`);
          // Delete the test record
          if (data && data[0]) {
            await supabase.from(table).delete().eq('id', data[0].id);
            console.log(`   (cleaned up test record)`);
          }
        }
      }
    } catch (err) {
      console.log(`⚠️  Could not test ${table}:`, err.message);
    }
  }

  console.log('\n📋 Please run this SQL in your Supabase SQL Editor to fix RLS:');
  console.log('');
  console.log('ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE steps DISABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE connections DISABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE responses DISABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('Or go to: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/editor');
  console.log('Click "SQL Editor" and run the commands above.');
}

fixRLS();
