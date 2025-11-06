require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedData() {
  console.log('🌱 Seeding tester dashboard data...\n');

  try {
    // 1. Create version 1.5.0 (Password Protection)
    console.log('Creating version 1.5.0...');
    const { data: version150, error: v150Error } = await supabase
      .from('versions')
      .insert({
        version_number: '1.5.0',
        title: 'Password Protection Feature',
        description: 'Added password protection for campaigns with auto-generation and session management',
        status: 'stable',
        changelog: [
          { type: 'feature', description: 'Password protection for campaigns' },
          { type: 'feature', description: 'Auto-generated readable passwords (e.g., happy-cloud-42)' },
          { type: 'feature', description: 'Password management in builder settings' },
          { type: 'feature', description: 'Password entry screen for viewers' },
          { type: 'improvement', description: 'Session storage for password validation' },
        ],
        known_issues: []
      })
      .select()
      .single();

    if (v150Error) throw v150Error;
    console.log('✅ Version 1.5.0 created\n');

    // 2. Create version 1.6.0 (Tester Dashboard - current)
    console.log('Creating version 1.6.0...');
    const { data: version160, error: v160Error } = await supabase
      .from('versions')
      .insert({
        version_number: '1.6.0',
        title: 'Tester Dashboard & QA System',
        description: 'Comprehensive testing dashboard for version tracking, test cases, and QA reporting',
        status: 'testing',
        changelog: [
          { type: 'feature', description: 'Tester dashboard at /tester' },
          { type: 'feature', description: 'Version history and changelog display' },
          { type: 'feature', description: 'Test case management' },
          { type: 'feature', description: 'Test report submission and viewing' },
          { type: 'feature', description: 'Pass rate statistics and analytics' },
        ],
        known_issues: [
          'Test report submission form not yet implemented',
          'Screenshot upload functionality pending'
        ]
      })
      .select()
      .single();

    if (v160Error) throw v160Error;
    console.log('✅ Version 1.6.0 created\n');

    // 3. Create test cases for v1.5.0
    console.log('Creating test cases for v1.5.0...');
    const testCases150 = [
      {
        version_id: version150.id,
        title: 'Enable password protection in builder',
        description: 'Verify that password protection can be enabled and configured in campaign builder',
        category: 'authentication',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open campaign in builder', expected: 'Builder loads successfully' },
          { step: 2, action: 'Click Settings (gear icon)', expected: 'Settings modal opens' },
          { step: 3, action: 'Click "Enable Password"', expected: 'Password is auto-generated' },
          { step: 4, action: 'Click "Copy" button', expected: 'Password copied to clipboard' },
          { step: 5, action: 'Click "Save" to save campaign', expected: 'Campaign saved with password' },
        ]
      },
      {
        version_id: version150.id,
        title: 'Password entry screen for viewers',
        description: 'Verify that viewers see password entry screen for protected campaigns',
        category: 'authentication',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open protected campaign URL in incognito window', expected: 'Password entry screen appears' },
          { step: 2, action: 'Enter incorrect password', expected: 'Error message displayed' },
          { step: 3, action: 'Enter correct password', expected: 'Campaign loads successfully' },
          { step: 4, action: 'Refresh page', expected: 'Campaign loads without password prompt (session stored)' },
        ]
      },
      {
        version_id: version150.id,
        title: 'Manage password from dashboard',
        description: 'Verify password can be managed from dashboard campaign settings',
        category: 'campaign-management',
        priority: 'high',
        steps: [
          { step: 1, action: 'Go to dashboard', expected: 'Dashboard loads with campaigns' },
          { step: 2, action: 'Click Settings (gear icon) on campaign card', expected: 'Settings modal opens' },
          { step: 3, action: 'Click "Enable Password"', expected: 'Password is generated' },
          { step: 4, action: 'Click "Generate New"', expected: 'New password is generated' },
          { step: 5, action: 'Click "Save Settings"', expected: 'Password saved successfully' },
        ]
      }
    ];

    const { error: tc150Error } = await supabase
      .from('test_cases')
      .insert(testCases150);

    if (tc150Error) throw tc150Error;
    console.log('✅ Test cases for v1.5.0 created\n');

    // 4. Create test cases for v1.6.0
    console.log('Creating test cases for v1.6.0...');
    const testCases160 = [
      {
        version_id: version160.id,
        title: 'Access tester dashboard',
        description: 'Verify tester dashboard is accessible and displays correctly',
        category: 'dashboard',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Navigate to /tester', expected: 'Tester dashboard loads' },
          { step: 2, action: 'Check stats cards', expected: 'Version count, active version, tests, pass rate displayed' },
          { step: 3, action: 'Check tabs', expected: 'All 4 tabs visible: Versions, Test Cases, Reports, Submit' },
        ]
      },
      {
        version_id: version160.id,
        title: 'View version history',
        description: 'Verify version history displays with changelog',
        category: 'dashboard',
        priority: 'high',
        steps: [
          { step: 1, action: 'Go to tester dashboard', expected: 'Dashboard loads' },
          { step: 2, action: 'Click "Versions & Changelog" tab', expected: 'Version list appears' },
          { step: 3, action: 'Check version details', expected: 'Version number, title, status, changelog visible' },
        ]
      },
      {
        version_id: version160.id,
        title: 'View test cases',
        description: 'Verify test cases display with steps',
        category: 'dashboard',
        priority: 'high',
        steps: [
          { step: 1, action: 'Go to tester dashboard', expected: 'Dashboard loads' },
          { step: 2, action: 'Click "Test Cases" tab', expected: 'Test cases list appears' },
          { step: 3, action: 'Check test case details', expected: 'Title, priority, category, steps visible' },
        ]
      }
    ];

    const { error: tc160Error } = await supabase
      .from('test_cases')
      .insert(testCases160);

    if (tc160Error) throw tc160Error;
    console.log('✅ Test cases for v1.6.0 created\n');

    // 5. Create some sample test reports
    console.log('Creating sample test reports...');
    const { data: allTestCases } = await supabase
      .from('test_cases')
      .select('*');

    const sampleReports = [];

    // Pass reports for v1.5.0 tests
    allTestCases
      .filter(tc => tc.version_id === version150.id)
      .forEach(tc => {
        sampleReports.push({
          test_case_id: tc.id,
          version_id: version150.id,
          tester_name: 'QA Team',
          status: 'pass',
          notes: 'All steps completed successfully',
          browser: 'Chrome 120',
          device: 'Desktop'
        });
      });

    // Some reports for v1.6.0 (mix of pass/fail)
    const v160Tests = allTestCases.filter(tc => tc.version_id === version160.id);
    if (v160Tests.length > 0) {
      sampleReports.push({
        test_case_id: v160Tests[0].id,
        version_id: version160.id,
        tester_name: 'QA Team',
        status: 'pass',
        notes: 'Dashboard loads correctly',
        browser: 'Chrome 120',
        device: 'Desktop'
      });

      if (v160Tests.length > 1) {
        sampleReports.push({
          test_case_id: v160Tests[1].id,
          version_id: version160.id,
          tester_name: 'Beta Tester',
          status: 'pass',
          notes: 'Version history displays well',
          browser: 'Firefox 121',
          device: 'Desktop'
        });
      }
    }

    const { error: reportError } = await supabase
      .from('test_reports')
      .insert(sampleReports);

    if (reportError) throw reportError;
    console.log('✅ Sample test reports created\n');

    console.log('========================================');
    console.log('✅ Tester dashboard data seeded successfully!');
    console.log('========================================');
    console.log('\nYou can now view the tester dashboard at:');
    console.log('http://localhost:3002/tester');
    console.log('\nOr on production:');
    console.log('https://int-video.vercel.app/tester\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedData();
