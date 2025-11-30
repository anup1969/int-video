const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion3() {
  console.log('Adding version 3 - Template Save Fix + Unique Campaign Names...');

  try {
    // Create version entry
    const { data: version, error: versionError } = await supabase
      .from('versions')
      .insert({
        version_number: '3',
        title: 'Template Save Fix + Unique Campaign Name Validation',
        description: 'Fixed template campaign save issues and added unique campaign name validation with auto-numbering. Prevents duplicate campaign names and provides user-friendly rename dialog.',
        status: 'testing',
        changelog: [
          { type: 'bugfix', description: 'Fixed template campaigns not saving - corrected database field names (from_step/to_step)' },
          { type: 'bugfix', description: 'Fixed connection loading to use correct database column names' },
          { type: 'feature', description: 'Auto-generate unique campaign names (Campaign 1, Campaign 2, etc.)' },
          { type: 'feature', description: 'Prevent duplicate campaign names with case-insensitive validation' },
          { type: 'feature', description: 'Added rename dialog when saving with "Untitled Campaign"' },
          { type: 'feature', description: 'Editable input field in rename dialog with suggested name' },
          { type: 'feature', description: 'Keyboard shortcuts in dialog (Enter to save, Escape to cancel)' },
          { type: 'feature', description: 'Validate and reject empty/whitespace-only campaign names' },
          { type: 'ui', description: 'Changed campaign dashboard background to blue' }
        ],
        known_issues: []
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error creating version:', versionError);
      return;
    }

    console.log('Version created:', version);

    // Create test cases for this version
    const testCases = [
      {
        version_id: version.id,
        title: 'Test template campaign save',
        description: 'Verify that template campaigns can be saved successfully',
        category: 'bug-fix',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Go to dashboard and click "Templates"', expected: 'Templates modal opens' },
          { step: 2, action: 'Select any template (e.g., Lead Generation)', expected: 'Template loads in flow builder with multiple steps' },
          { step: 3, action: 'Click "Save" button', expected: 'Save process starts (no errors)' },
          { step: 4, action: 'Check for success message', expected: 'Green "Saved" indicator appears' },
          { step: 5, action: 'Refresh page and verify campaign loads', expected: 'Template campaign loads with all steps intact' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test unique name auto-generation',
        description: 'Verify that campaigns with "Untitled Campaign" get auto-numbered names',
        category: 'feature',
        priority: 'high',
        steps: [
          { step: 1, action: 'Create new campaign (leave name as "Untitled Campaign")', expected: 'Campaign created with default name' },
          { step: 2, action: 'Click "Save" button', expected: 'Rename dialog appears' },
          { step: 3, action: 'Check suggested name in input field', expected: 'Shows "Campaign 1" or next available number' },
          { step: 4, action: 'Click "Save" button in dialog', expected: 'Campaign saves with auto-generated name' },
          { step: 5, action: 'Go to dashboard', expected: 'Campaign appears with unique numbered name (e.g., Campaign 1)' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test rename dialog functionality',
        description: 'Verify rename dialog works correctly with all features',
        category: 'feature',
        priority: 'high',
        steps: [
          { step: 1, action: 'Create new campaign (keep "Untitled Campaign")', expected: 'Campaign created' },
          { step: 2, action: 'Click "Save"', expected: 'Rename dialog appears with input field focused' },
          { step: 3, action: 'Edit the suggested name to "My Test Campaign"', expected: 'Text changes in input field' },
          { step: 4, action: 'Press Enter key', expected: 'Campaign saves with edited name' },
          { step: 5, action: 'Verify in dashboard', expected: 'Campaign shows as "My Test Campaign"' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test duplicate name prevention',
        description: 'Verify that duplicate campaign names are rejected',
        category: 'feature',
        priority: 'high',
        steps: [
          { step: 1, action: 'Create campaign and save it as "Test Campaign"', expected: 'Campaign saves successfully' },
          { step: 2, action: 'Create another new campaign', expected: 'New campaign created' },
          { step: 3, action: 'Change name to "Test Campaign" (same as first)', expected: 'Name changed in header' },
          { step: 4, action: 'Click "Save"', expected: 'Error alert appears: "Campaign name already exists..."' },
          { step: 5, action: 'Change to "test campaign" (lowercase)', expected: 'Name changed' },
          { step: 6, action: 'Click "Save"', expected: 'Still shows error (case-insensitive check works)' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test empty name validation',
        description: 'Verify that empty or whitespace-only names are rejected',
        category: 'feature',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Create new campaign, click "Save"', expected: 'Rename dialog appears' },
          { step: 2, action: 'Clear the input field (make it empty)', expected: 'Input is empty' },
          { step: 3, action: 'Click "Save" in dialog', expected: 'Alert: "Campaign name cannot be empty"' },
          { step: 4, action: 'Enter only spaces "   "', expected: 'Spaces entered' },
          { step: 5, action: 'Click "Save"', expected: 'Shows error about empty/whitespace name' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test dialog keyboard shortcuts',
        description: 'Verify Enter and Escape keys work in rename dialog',
        category: 'feature',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Create new campaign, click "Save"', expected: 'Rename dialog appears' },
          { step: 2, action: 'Press Escape key', expected: 'Dialog closes without saving' },
          { step: 3, action: 'Click "Save" again', expected: 'Dialog appears again' },
          { step: 4, action: 'Edit name to "Quick Save Test"', expected: 'Name edited' },
          { step: 5, action: 'Press Enter key', expected: 'Campaign saves with new name, dialog closes' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test dashboard UI color change',
        description: 'Verify campaign dashboard has blue background',
        category: 'ui',
        priority: 'low',
        steps: [
          { step: 1, action: 'Go to campaign dashboard', expected: 'Dashboard loads' },
          { step: 2, action: 'Observe background color', expected: 'Background is light blue (not gray)' },
          { step: 3, action: 'Check that campaign cards are still visible', expected: 'White cards stand out against blue background' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test sequential numbering',
        description: 'Verify auto-numbering increments correctly',
        category: 'feature',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Note existing campaign numbers in dashboard', expected: 'See current campaigns' },
          { step: 2, action: 'Create new campaign, click "Save"', expected: 'Dialog shows next number (e.g., Campaign 5)' },
          { step: 3, action: 'Save it', expected: 'Saves as Campaign 5' },
          { step: 4, action: 'Create another, click "Save"', expected: 'Dialog shows Campaign 6' },
          { step: 5, action: 'Verify numbering is sequential', expected: 'No duplicate numbers, increments correctly' }
        ]
      }
    ];

    const { data: cases, error: casesError } = await supabase
      .from('test_cases')
      .insert(testCases)
      .select();

    if (casesError) {
      console.error('Error creating test cases:', casesError);
      return;
    }

    console.log(`Created ${cases.length} test cases for version 3`);
    console.log('\nVersion 3 added successfully!');
    console.log('Testers can now verify this version at /tester');

  } catch (error) {
    console.error('Error:', error);
  }
}

addVersion3();
