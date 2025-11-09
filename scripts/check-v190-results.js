require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkV190Results() {
  const { data: version } = await supabase
    .from('versions')
    .select('id, version_number, title, status')
    .eq('version_number', '1.9.0')
    .single();

  if (!version) {
    console.log('Version 1.9.0 not found');
    return;
  }

  console.log('\n📊 Version 1.9.0 - ' + version.title);
  console.log('Status: ' + version.status);
  console.log('');

  const { data: reports } = await supabase
    .from('test_reports')
    .select('*, test_cases(*)')
    .eq('version_id', version.id)
    .order('created_at', { ascending: false });

  if (!reports || reports.length === 0) {
    console.log('❌ No test reports found for v1.9.0 yet.\n');
    return;
  }

  console.log('Total Reports: ' + reports.length);
  console.log('');

  const reportsByTestCase = {};
  reports.forEach(r => {
    if (!reportsByTestCase[r.test_case_id]) {
      reportsByTestCase[r.test_case_id] = r;
    }
  });

  let passCount = 0;
  let failCount = 0;
  let blockedCount = 0;

  console.log('Test Results:\n');
  Object.values(reportsByTestCase).forEach(r => {
    const statusIcon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${r.test_cases.title}`);
    if (r.notes) console.log(`   Notes: ${r.notes}`);

    if (r.status === 'pass') passCount++;
    else if (r.status === 'fail') failCount++;
    else if (r.status === 'blocked') blockedCount++;
  });

  console.log('\n========================================');
  console.log('📊 SUMMARY');
  console.log('========================================');
  console.log('✅ Pass: ' + passCount);
  console.log('❌ Fail: ' + failCount);
  console.log('⚠️  Blocked: ' + blockedCount);
  console.log('📈 Pass Rate: ' + ((passCount / Object.keys(reportsByTestCase).length) * 100).toFixed(1) + '%');
  console.log('========================================\n');
}

checkV190Results();
