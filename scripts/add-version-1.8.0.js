require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion180() {
  console.log('🚀 Adding version 1.8.0...\n');

  try {
    // 1. Create version 1.8.0
    console.log('Creating version 1.8.0...');
    const { data: version180, error: v180Error } = await supabase
      .from('versions')
      .insert({
        version_number: '1.8.0',
        title: 'Ad-Hoc Bug & Suggestion Reporting System',
        description: 'Testers can now report bugs and suggestions they discover during testing, beyond the predefined test cases',
        status: 'testing',
        changelog: [
          { type: 'feature', description: 'Floating orange "+" button for quick access to report submission' },
          { type: 'feature', description: 'Ad-hoc report modal with comprehensive form (Bug/Suggestion/Improvement)' },
          { type: 'feature', description: 'Report type selection: Bug, Suggestion, or Improvement' },
          { type: 'feature', description: 'Severity levels for bugs (Critical, High, Medium, Low)' },
          { type: 'feature', description: 'Steps to reproduce field for detailed bug reports' },
          { type: 'feature', description: 'Screenshot upload support for visual documentation' },
          { type: 'feature', description: 'Database table for ad-hoc reports with status tracking' },
          { type: 'improvement', description: 'Lighter modal overlay (20% opacity) for better readability' },
          { type: 'improvement', description: 'Browser and device detection for better debugging context' },
        ],
        known_issues: []
      })
      .select()
      .single();

    if (v180Error) throw v180Error;
    console.log('✅ Version 1.8.0 created\n');

    // 2. Create test cases for v1.8.0
    console.log('Creating test cases for v1.8.0...');
    const testCases180 = [
      {
        version_id: version180.id,
        title: 'Test floating report button visibility',
        description: 'Verify that the orange floating button appears on the tester dashboard',
        category: 'ui-display',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open the tester dashboard at /tester', expected: 'Page loads successfully' },
          { step: 2, action: 'Look at the bottom right corner of the page', expected: 'Orange circular button with "+" icon is visible' },
          { step: 3, action: 'Scroll up and down the page', expected: 'Button stays fixed in position (floating)' },
          { step: 4, action: 'Hover over the button', expected: 'Tooltip appears: "Report Bug or Suggestion"' },
        ]
      },
      {
        version_id: version180.id,
        title: 'Test report modal opening and closing',
        description: 'Verify that clicking the button opens the report modal',
        category: 'ui-interaction',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Click the orange floating "+" button', expected: 'Modal opens with form' },
          { step: 2, action: 'Check modal overlay background', expected: 'Light gray overlay (not too dark, readable)' },
          { step: 3, action: 'Check modal header', expected: 'Shows "Report Bug or Suggestion" with bug icon' },
          { step: 4, action: 'Click the X button in top right', expected: 'Modal closes' },
          { step: 5, action: 'Open modal again and click Cancel button', expected: 'Modal closes' },
        ]
      },
      {
        version_id: version180.id,
        title: 'Test bug report submission',
        description: 'Submit a complete bug report and verify it saves',
        category: 'form-submission',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Click floating "+" button', expected: 'Modal opens' },
          { step: 2, action: 'Select a version from dropdown', expected: 'Version selected' },
          { step: 3, action: 'Choose "Bug" as report type', expected: 'Bug selected, severity field appears' },
          { step: 4, action: 'Select "High" severity', expected: 'High severity selected' },
          { step: 5, action: 'Enter title: "Test bug report"', expected: 'Title entered' },
          { step: 6, action: 'Enter description: "This is a test bug"', expected: 'Description entered' },
          { step: 7, action: 'Enter steps to reproduce (optional)', expected: 'Steps entered' },
          { step: 8, action: 'Click Submit Report button', expected: 'Success message appears, modal closes' },
        ]
      },
      {
        version_id: version180.id,
        title: 'Test suggestion submission',
        description: 'Submit a suggestion and verify severity field is hidden',
        category: 'form-submission',
        priority: 'high',
        steps: [
          { step: 1, action: 'Open report modal', expected: 'Modal opens' },
          { step: 2, action: 'Select a version', expected: 'Version selected' },
          { step: 3, action: 'Choose "Suggestion" as report type', expected: 'Suggestion selected' },
          { step: 4, action: 'Check if severity field is visible', expected: 'Severity field NOT visible (only for bugs)' },
          { step: 5, action: 'Enter title and description', expected: 'Fields filled' },
          { step: 6, action: 'Click Submit Report', expected: 'Success message, modal closes' },
        ]
      },
      {
        version_id: version180.id,
        title: 'Test screenshot upload',
        description: 'Upload a screenshot with a bug report',
        category: 'file-upload',
        priority: 'high',
        steps: [
          { step: 1, action: 'Open report modal', expected: 'Modal opens' },
          { step: 2, action: 'Fill in version, type, title, description', expected: 'Required fields filled' },
          { step: 3, action: 'Click "Choose file" for screenshot', expected: 'File picker opens' },
          { step: 4, action: 'Select an image file', expected: 'File uploads, green checkmark appears with filename' },
          { step: 5, action: 'Click X button next to uploaded file', expected: 'File removed, upload input reappears' },
          { step: 6, action: 'Upload file again and submit', expected: 'Report submitted successfully' },
        ]
      },
      {
        version_id: version180.id,
        title: 'Test form validation',
        description: 'Verify required fields are validated before submission',
        category: 'form-validation',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open report modal', expected: 'Modal opens' },
          { step: 2, action: 'Click Submit Report without filling anything', expected: 'Error message: "Please fill in all required fields"' },
          { step: 3, action: 'Select only version, then submit', expected: 'Error message appears' },
          { step: 4, action: 'Fill version and title only, then submit', expected: 'Error message appears' },
          { step: 5, action: 'Fill all required fields (version, title, description), then submit', expected: 'Report submitted successfully' },
        ]
      }
    ];

    const { error: tc180Error } = await supabase
      .from('test_cases')
      .insert(testCases180);

    if (tc180Error) throw tc180Error;
    console.log('✅ Test cases for v1.8.0 created\n');

    console.log('========================================');
    console.log('✅ Version 1.8.0 added successfully!');
    console.log('========================================');
    console.log('\nYou can now test version 1.8.0 at:');
    console.log('https://int-video.vercel.app/tester\n');
    console.log('Look for the orange floating "+" button in the bottom right corner!\n');

  } catch (error) {
    console.error('❌ Error adding version 1.8.0:', error);
  }
}

addVersion180();
