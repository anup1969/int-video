const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion201() {
  console.log('Adding version 2.0.1 - answerType Fix...');

  try {
    // Create version entry
    const { data: version, error: versionError } = await supabase
      .from('versions')
      .insert({
        version_number: '2.0.1',
        title: 'Critical Bug Fix - NULL Answer Type Error',
        description: 'Fixed application error when loading campaigns with NULL answer_type from database. Added fallback to prevent database constraint violations.',
        status: 'testing',
        changelog: [
          { type: 'bugfix', description: 'Fixed NULL answer_type error when loading campaigns from database' },
          { type: 'bugfix', description: 'Added fallback to "open-ended" for NULL answer_type values' },
          { type: 'bugfix', description: 'Prevented database constraint violation on campaign save' },
          { type: 'bugfix', description: 'Fixed end-user campaign application error' }
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
        title: 'Test loading campaign with NULL answer_type',
        description: 'Verify that campaigns with NULL answer_type in database load without errors',
        category: 'bug-fix',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open an existing campaign that previously had NULL answer_type', expected: 'Campaign builder loads without application error' },
          { step: 2, action: 'Check browser console for errors', expected: 'No errors or warnings related to answer_type' },
          { step: 3, action: 'Click on a step node', expected: 'Step panel opens showing answer_type field populated (default: "open-ended")' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test saving campaign after loading with NULL answer_type',
        description: 'Verify that campaigns can be saved after loading with NULL answer_type',
        category: 'bug-fix',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Load a campaign (any existing campaign)', expected: 'Campaign loads in builder' },
          { step: 2, action: 'Make a small change (e.g., edit campaign name)', expected: 'Change is made' },
          { step: 3, action: 'Click Save button', expected: 'Campaign saves successfully' },
          { step: 4, action: 'Check for success message', expected: 'Green "Saved" indicator appears in header' },
          { step: 5, action: 'Check browser console', expected: 'No database constraint violation errors' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test end-user campaign page functionality',
        description: 'Verify that end-user campaign pages work without application errors',
        category: 'bug-fix',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Get URL of any campaign (click View Campaign or Share)', expected: 'Campaign URL obtained' },
          { step: 2, action: 'Open campaign URL in new tab/window', expected: 'Campaign page loads without application error' },
          { step: 3, action: 'Check if campaign starts properly', expected: 'First step/question appears' },
          { step: 4, action: 'Progress through campaign steps', expected: 'All steps work without errors' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test answer_type fallback mechanism',
        description: 'Verify that answer_type defaults to "open-ended" when NULL in database',
        category: 'data-integrity',
        priority: 'high',
        steps: [
          { step: 1, action: 'Load any campaign in builder', expected: 'Campaign loads' },
          { step: 2, action: 'Click on each step node one by one', expected: 'Step panel opens for each' },
          { step: 3, action: 'Check answer_type field for each step', expected: 'All steps have a valid answer_type (none are NULL or undefined)' },
          { step: 4, action: 'If a step shows "open-ended", verify it works', expected: 'Step functions properly' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test creating new steps',
        description: 'Verify that newly created steps have valid answer_type by default',
        category: 'workflow',
        priority: 'medium',
        steps: [
          { step: 1, action: 'In campaign builder, click to add a new step', expected: 'New step is created' },
          { step: 2, action: 'Click on the new step', expected: 'Step panel opens' },
          { step: 3, action: 'Check answer_type field', expected: 'Has a default value set (not NULL)' },
          { step: 4, action: 'Save the campaign', expected: 'Saves without errors' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test editing step answer types',
        description: 'Verify that answer types can be changed and save correctly',
        category: 'workflow',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Open campaign builder and click a step', expected: 'Step panel opens' },
          { step: 2, action: 'Change answer_type dropdown to a different value', expected: 'Dropdown value changes' },
          { step: 3, action: 'Save the campaign', expected: 'Campaign saves successfully' },
          { step: 4, action: 'Refresh the page and open same step', expected: 'Answer type change persists' }
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

    console.log(`Created ${cases.length} test cases for version 2.0.1`);
    console.log('\nVersion 2.0.1 added successfully!');
    console.log('Testers can now verify this version at /tester');

  } catch (error) {
    console.error('Error:', error);
  }
}

addVersion201();
