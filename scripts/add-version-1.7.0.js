require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion170() {
  console.log('🚀 Adding version 1.7.0...\n');

  try {
    // 1. Create version 1.7.0
    console.log('Creating version 1.7.0...');
    const { data: version170, error: v170Error } = await supabase
      .from('versions')
      .insert({
        version_number: '1.7.0',
        title: 'Enhanced Tester Dashboard - File Management & UI Improvements',
        description: 'Added file deletion capabilities, enhanced changelog visibility, and improved overall tester experience',
        status: 'testing',
        changelog: [
          { type: 'feature', description: 'Delete button for uploaded test files with confirmation dialog' },
          { type: 'feature', description: 'Replace file button for easier file updates' },
          { type: 'feature', description: 'Color-coded file upload status (green for new, blue for existing)' },
          { type: 'improvement', description: 'Enhanced changelog display with gradient background and prominent styling' },
          { type: 'improvement', description: 'Added Known Issues section in expanded view' },
          { type: 'improvement', description: 'Better icon visibility with circular white backgrounds' },
          { type: 'improvement', description: 'Type labels (Feature:, Fix:, Improvement:) for better clarity' },
          { type: 'fix', description: 'Added storage DELETE policy for test-reports folder' },
        ],
        known_issues: []
      })
      .select()
      .single();

    if (v170Error) throw v170Error;
    console.log('✅ Version 1.7.0 created\n');

    // 2. Create test cases for v1.7.0
    console.log('Creating test cases for v1.7.0...');
    const testCases170 = [
      {
        version_id: version170.id,
        title: 'Test file delete functionality',
        description: 'Verify that users can delete uploaded files',
        category: 'file-management',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Expand any version row', expected: 'Testing table appears' },
          { step: 2, action: 'Upload a test file', expected: 'File appears with green background and filename' },
          { step: 3, action: 'Locate trash icon button next to uploaded file', expected: 'Red trash icon visible' },
          { step: 4, action: 'Click trash icon', expected: 'Confirmation dialog appears' },
          { step: 5, action: 'Confirm deletion', expected: 'File removed, upload input reappears' },
        ]
      },
      {
        version_id: version170.id,
        title: 'Test replace file functionality',
        description: 'Verify that users can replace uploaded files',
        category: 'file-management',
        priority: 'high',
        steps: [
          { step: 1, action: 'Upload a file to any test case', expected: 'File uploaded successfully' },
          { step: 2, action: 'Locate "Replace File" button', expected: 'Gray button visible below file info' },
          { step: 3, action: 'Click "Replace File" button', expected: 'File picker opens' },
          { step: 4, action: 'Select a different file', expected: 'New file uploaded, old file replaced' },
        ]
      },
      {
        version_id: version170.id,
        title: 'Test enhanced changelog display',
        description: 'Verify the new changelog design is visible and attractive',
        category: 'ui-display',
        priority: 'high',
        steps: [
          { step: 1, action: 'Expand version 1.7.0 row', expected: 'Expanded view opens' },
          { step: 2, action: 'Locate "What\'s New" section', expected: 'Section has violet-to-blue gradient background' },
          { step: 3, action: 'Check border thickness', expected: 'Thicker 2px border visible' },
          { step: 4, action: 'Check change icons', expected: 'Icons appear in white circular backgrounds' },
          { step: 5, action: 'Check type labels', expected: 'Each item shows "Feature:", "Fix:", or "Improvement:" label' },
        ]
      },
      {
        version_id: version170.id,
        title: 'Test color-coded file status',
        description: 'Verify uploaded files show correct color backgrounds',
        category: 'ui-display',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Upload a new file', expected: 'File info box has green background' },
          { step: 2, action: 'Save test results', expected: 'Test saved successfully' },
          { step: 3, action: 'Refresh the page', expected: 'Page reloads with saved data' },
          { step: 4, action: 'Expand same version', expected: 'Previously uploaded file now shows blue background' },
        ]
      },
      {
        version_id: version170.id,
        title: 'Test file delete confirmation',
        description: 'Verify that delete requires confirmation to prevent accidents',
        category: 'user-safety',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Upload a file', expected: 'File uploaded' },
          { step: 2, action: 'Click trash icon', expected: 'Browser confirmation dialog appears with message' },
          { step: 3, action: 'Click "Cancel" in dialog', expected: 'File remains, not deleted' },
          { step: 4, action: 'Click trash icon again', expected: 'Confirmation appears again' },
          { step: 5, action: 'Click "OK" in dialog', expected: 'File deleted successfully' },
        ]
      },
      {
        version_id: version170.id,
        title: 'Test Known Issues section',
        description: 'Verify Known Issues section appears when issues exist',
        category: 'ui-display',
        priority: 'low',
        steps: [
          { step: 1, action: 'Expand version 1.6.0 (which has known issues)', expected: 'Expanded view opens' },
          { step: 2, action: 'Locate "Known Issues" section', expected: 'Section with amber/yellow background visible' },
          { step: 3, action: 'Check bug icons', expected: 'Bug icons in white circles visible' },
          { step: 4, action: 'Expand version 1.7.0 (no known issues)', expected: 'No Known Issues section appears' },
        ]
      }
    ];

    const { error: tc170Error } = await supabase
      .from('test_cases')
      .insert(testCases170);

    if (tc170Error) throw tc170Error;
    console.log('✅ Test cases for v1.7.0 created\n');

    console.log('========================================');
    console.log('✅ Version 1.7.0 added successfully!');
    console.log('========================================');
    console.log('\nYou can now test version 1.7.0 at:');
    console.log('https://int-video.vercel.app/tester\n');

  } catch (error) {
    console.error('❌ Error adding version 1.7.0:', error);
  }
}

addVersion170();
