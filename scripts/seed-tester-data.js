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

    // 4. Create test cases for v1.6.0 with detailed UI checks
    console.log('Creating test cases for v1.6.0...');
    const testCases160 = [
      {
        version_id: version160.id,
        title: 'Check expandable row functionality',
        description: 'Test the expand/collapse functionality of version rows',
        category: 'ui-interaction',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Navigate to /tester', expected: 'Tester dashboard loads with version rows' },
          { step: 2, action: 'Check plus (+) icon visibility', expected: 'Plus icon visible on each version row' },
          { step: 3, action: 'Click plus icon on first version', expected: 'Row expands, icon changes to minus (-)' },
          { step: 4, action: 'Check expanded content', expected: 'Testing table with 4 columns visible' },
          { step: 5, action: 'Click minus icon', expected: 'Row collapses, content hidden' },
        ]
      },
      {
        version_id: version160.id,
        title: 'Check version summary display',
        description: 'Verify all summary information displays correctly in collapsed row',
        category: 'ui-display',
        priority: 'high',
        steps: [
          { step: 1, action: 'Navigate to /tester', expected: 'Dashboard loads' },
          { step: 2, action: 'Check version number display', expected: 'Version number visible (e.g., v1.6.0)' },
          { step: 3, action: 'Check release date format', expected: 'Date and time in IST format visible' },
          { step: 4, action: 'Check "About" section', expected: 'Short description of version visible' },
          { step: 5, action: 'Check status badge', expected: 'Status badge with correct color (testing/stable/deprecated)' },
        ]
      },
      {
        version_id: version160.id,
        title: 'Check tester notes textarea',
        description: 'Test the tester notes input field functionality',
        category: 'form-input',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Expand any version row', expected: 'Testing table appears' },
          { step: 2, action: 'Locate tester notes column', expected: 'Textarea input visible for each test' },
          { step: 3, action: 'Click inside textarea', expected: 'Cursor appears, field is focusable' },
          { step: 4, action: 'Type test notes', expected: 'Text appears as typed, no character limit issues' },
          { step: 5, action: 'Check textarea resizing', expected: 'Textarea accommodates multiple lines' },
        ]
      },
      {
        version_id: version160.id,
        title: 'Check status dropdown options',
        description: 'Verify status dropdown functionality and options',
        category: 'form-input',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Expand any version row', expected: 'Testing table appears' },
          { step: 2, action: 'Locate status dropdown', expected: 'Dropdown visible in Status column' },
          { step: 3, action: 'Click status dropdown', expected: 'Dropdown opens with options' },
          { step: 4, action: 'Check "Properly Working" option', expected: 'Option is selectable' },
          { step: 5, action: 'Check "Not Working" option', expected: 'Option is selectable' },
          { step: 6, action: 'Check "Partially Working" option', expected: 'Option is selectable' },
          { step: 7, action: 'Select an option', expected: 'Dropdown shows selected value' },
        ]
      },
      {
        version_id: version160.id,
        title: 'Check file upload functionality',
        description: 'Test document upload feature for test cases',
        category: 'file-upload',
        priority: 'high',
        steps: [
          { step: 1, action: 'Expand any version row', expected: 'Testing table appears' },
          { step: 2, action: 'Locate "Upload Docs" column', expected: 'File input button visible' },
          { step: 3, action: 'Click "Choose file" button', expected: 'File picker dialog opens' },
          { step: 4, action: 'Select an image/PDF file', expected: 'File name appears below input' },
          { step: 5, action: 'Check file indicator', expected: 'Green checkmark with filename shown' },
        ]
      },
      {
        version_id: version160.id,
        title: 'Check Save button functionality',
        description: 'Verify Save Test Results button works correctly',
        category: 'form-submission',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Expand a version row', expected: 'Testing table appears' },
          { step: 2, action: 'Fill in notes for one test', expected: 'Notes saved in field' },
          { step: 3, action: 'Select status from dropdown', expected: 'Status selected' },
          { step: 4, action: 'Scroll to bottom of expanded section', expected: 'Save button visible' },
          { step: 5, action: 'Click "Save Test Results" button', expected: 'Success alert appears' },
          { step: 6, action: 'Check form reset', expected: 'Form fields cleared after save' },
        ]
      },
      {
        version_id: version160.id,
        title: 'Check changelog display',
        description: 'Verify changelog shows correctly in expanded view',
        category: 'ui-display',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Expand a version row', expected: 'Expanded content visible' },
          { step: 2, action: 'Check "What\'s New" section', expected: 'Changelog box visible with white background' },
          { step: 3, action: 'Check feature icons', expected: 'Plus icons for features visible' },
          { step: 4, action: 'Check fix icons', expected: 'Wrench icons for fixes visible' },
          { step: 5, action: 'Check improvement icons', expected: 'Up arrow icons for improvements visible' },
        ]
      },
      {
        version_id: version160.id,
        title: 'Check test instructions display',
        description: 'Verify test instructions column shows all details',
        category: 'ui-display',
        priority: 'high',
        steps: [
          { step: 1, action: 'Expand a version row', expected: 'Testing table appears' },
          { step: 2, action: 'Check test title display', expected: 'Test number and title visible (e.g., "1. Test Name")' },
          { step: 3, action: 'Check description text', expected: 'Test description visible below title' },
          { step: 4, action: 'Check step-by-step instructions', expected: 'Numbered steps with actions visible' },
          { step: 5, action: 'Check text formatting', expected: 'Text is readable, properly sized' },
        ]
      },
      {
        version_id: version160.id,
        title: 'Check responsive layout',
        description: 'Test dashboard layout on different screen sizes',
        category: 'responsive',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Open dashboard on desktop (1920px)', expected: 'All columns visible, proper spacing' },
          { step: 2, action: 'Resize to tablet (768px)', expected: 'Layout adjusts, table scrolls horizontally if needed' },
          { step: 3, action: 'Check mobile view (375px)', expected: 'Rows stack vertically, still functional' },
          { step: 4, action: 'Check touch interactions', expected: 'Buttons and dropdowns work on touch' },
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
