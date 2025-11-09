require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdHocReports() {
  const { data: reports } = await supabase
    .from('ad_hoc_reports')
    .select('*, versions(version_number, title)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!reports || reports.length === 0) {
    console.log('\n❌ No ad-hoc reports found yet.\n');
    return;
  }

  console.log('\n📋 Ad-Hoc Bug/Suggestion Reports:\n');
  console.log('Total Reports: ' + reports.length + '\n');
  console.log('========================================\n');

  reports.forEach((r, i) => {
    const typeIcon = r.report_type === 'bug' ? '🐛' : r.report_type === 'suggestion' ? '💡' : '⬆️';
    const statusIcon = r.status === 'open' ? '🔵' : r.status === 'resolved' ? '✅' : '⚠️';

    console.log('#' + (i + 1) + ' ' + typeIcon + ' ' + r.title);
    console.log('   Type: ' + r.report_type.toUpperCase());
    console.log('   Version: v' + r.versions.version_number + ' - ' + r.versions.title);
    if (r.severity) console.log('   Severity: ' + r.severity.toUpperCase());
    console.log('   Status: ' + statusIcon + ' ' + r.status);
    console.log('   Tester: ' + r.tester_name);
    console.log('   Browser: ' + r.browser + ' | Device: ' + r.device);
    console.log('   Description: ' + r.description);
    if (r.steps_to_reproduce) {
      console.log('   Steps to Reproduce:');
      console.log('   ' + r.steps_to_reproduce);
    }
    if (r.screenshots && r.screenshots.length > 0) {
      console.log('   Screenshots: ' + r.screenshots.length + ' file(s)');
      r.screenshots.forEach((s, idx) => console.log('      ' + (idx + 1) + '. ' + s));
    }
    if (r.developer_notes) {
      console.log('   Developer Notes: ' + r.developer_notes);
    }
    console.log('   Created: ' + new Date(r.created_at).toLocaleString('en-IN'));
    console.log('');
  });

  console.log('========================================\n');
}

checkAdHocReports();
