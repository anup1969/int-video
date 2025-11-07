require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchTestReports() {
  console.log('📊 Fetching QC reports for v1.6.0...\n');

  try {
    // Get v1.6.0 version
    const { data: version, error: versionError } = await supabase
      .from('versions')
      .select('*')
      .eq('version_number', '1.6.0')
      .single();

    if (versionError) throw versionError;

    console.log('Version:', version.version_number, '-', version.title);
    console.log('Status:', version.status);
    console.log('Release Date:', new Date(version.release_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    console.log('\n========================================\n');

    // Get all test cases for this version
    const { data: testCases, error: tcError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('version_id', version.id)
      .order('created_at', { ascending: true });

    if (tcError) throw tcError;

    // Get all test reports for this version
    const { data: reports, error: reportsError } = await supabase
      .from('test_reports')
      .select('*')
      .eq('version_id', version.id)
      .order('created_at', { ascending: false });

    if (reportsError) throw reportsError;

    console.log(`📝 Total Test Cases: ${testCases.length}`);
    console.log(`📋 Total Test Reports Submitted: ${reports.length}\n`);
    console.log('========================================\n');

    // Map reports by test case
    const reportsByTestCase = {};
    reports.forEach(report => {
      if (!reportsByTestCase[report.test_case_id]) {
        reportsByTestCase[report.test_case_id] = [];
      }
      reportsByTestCase[report.test_case_id].push(report);
    });

    // Display each test case with its results
    testCases.forEach((tc, index) => {
      console.log(`\n📌 Test Case #${index + 1}: ${tc.title}`);
      console.log(`   Category: ${tc.category || 'N/A'}`);
      console.log(`   Priority: ${tc.priority || 'N/A'}`);
      console.log(`   Description: ${tc.description || 'N/A'}`);

      const tcReports = reportsByTestCase[tc.id] || [];

      if (tcReports.length === 0) {
        console.log(`   ⚠️  Status: NOT TESTED YET`);
      } else {
        const latestReport = tcReports[0]; // Most recent
        console.log(`\n   ✅ Latest Test Result:`);
        console.log(`      Tester: ${latestReport.tester_name}`);
        console.log(`      Status: ${latestReport.status.toUpperCase()}`);
        console.log(`      Notes: ${latestReport.notes || 'No notes'}`);
        console.log(`      Browser: ${latestReport.browser || 'N/A'}`);
        console.log(`      Device: ${latestReport.device || 'N/A'}`);
        console.log(`      Tested At: ${new Date(latestReport.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

        if (latestReport.screenshots && latestReport.screenshots.length > 0) {
          console.log(`      📎 Screenshots: ${latestReport.screenshots.length} file(s)`);
          latestReport.screenshots.forEach((url, i) => {
            console.log(`         ${i + 1}. ${url}`);
          });
        }

        if (latestReport.bug_description) {
          console.log(`      🐛 Bug Description: ${latestReport.bug_description}`);
        }

        if (latestReport.severity) {
          console.log(`      ⚠️  Severity: ${latestReport.severity}`);
        }

        if (tcReports.length > 1) {
          console.log(`\n      📊 Total runs for this test: ${tcReports.length}`);
        }
      }

      console.log('\n   ---');
    });

    // Summary statistics
    console.log('\n\n========================================');
    console.log('📊 SUMMARY STATISTICS');
    console.log('========================================\n');

    const testedCount = Object.keys(reportsByTestCase).length;
    const untestedCount = testCases.length - testedCount;

    console.log(`Total Test Cases: ${testCases.length}`);
    console.log(`Tested: ${testedCount}`);
    console.log(`Not Tested: ${untestedCount}\n`);

    // Count by status
    const statusCounts = { pass: 0, fail: 0, blocked: 0, skip: 0 };
    reports.forEach(report => {
      if (statusCounts.hasOwnProperty(report.status)) {
        statusCounts[report.status]++;
      }
    });

    console.log('Status Breakdown (all runs):');
    console.log(`  ✅ Pass (Properly Working): ${statusCounts.pass}`);
    console.log(`  ❌ Fail (Not Working): ${statusCounts.fail}`);
    console.log(`  ⚠️  Blocked (Partially Working): ${statusCounts.blocked}`);
    console.log(`  ⏭️  Skip: ${statusCounts.skip}\n`);

    // Latest status for each test case
    const latestStatuses = { pass: 0, fail: 0, blocked: 0, skip: 0, untested: untestedCount };
    testCases.forEach(tc => {
      const tcReports = reportsByTestCase[tc.id];
      if (tcReports && tcReports.length > 0) {
        const latestStatus = tcReports[0].status;
        if (latestStatuses.hasOwnProperty(latestStatus)) {
          latestStatuses[latestStatus]++;
        }
      }
    });

    console.log('Current Status (latest result per test):');
    console.log(`  ✅ Pass: ${latestStatuses.pass}`);
    console.log(`  ❌ Fail: ${latestStatuses.fail}`);
    console.log(`  ⚠️  Blocked: ${latestStatuses.blocked}`);
    console.log(`  ⏭️  Skip: ${latestStatuses.skip}`);
    console.log(`  ⚪ Not Tested: ${latestStatuses.untested}\n`);

    const passRate = testedCount > 0 ? ((latestStatuses.pass / testedCount) * 100).toFixed(1) : 0;
    console.log(`📈 Pass Rate: ${passRate}% (${latestStatuses.pass}/${testedCount} tested cases passing)\n`);

    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error fetching test reports:', error);
  }
}

fetchTestReports();
