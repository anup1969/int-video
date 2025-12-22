const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion205() {
  console.log('Adding version 2.0.5 - Response Page Enhancements & Bug Fixes...');

  try {
    // Create version entry
    const { data: version, error: versionError } = await supabase
      .from('versions')
      .insert({
        version_number: '2.0.5',
        title: 'Response Page Enhancements & Bug Fixes',
        description: 'Major improvements to response viewing including Excel export, inline media players, response numbering, and fixes for contact form display and duplicate campaign name handling.',
        status: 'testing',
        changelog: [
          { type: 'feature', description: 'Excel Export - Download all responses to CSV file (opens in Excel)' },
          { type: 'feature', description: 'Response Numbers - Added # column showing 1, 2, 3... in both table and list views' },
          { type: 'feature', description: 'Inline Audio Player - Audio responses now play directly in the response table' },
          { type: 'feature', description: 'Inline Video Player - Video responses now show thumbnail with player in table' },
          { type: 'fix', description: 'Contact Form Display - Now shows ALL form fields dynamically (was hardcoded to only 3 fields: name, email, phone)' },
          { type: 'fix', description: 'Duplicate Campaign Name - Now shows rename dialog with suggested name instead of just an alert' }
        ],
        known_issues: [
          'Some older audio responses may show "no file URL" if upload failed during original recording'
        ]
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
        title: 'Test Excel Export functionality',
        description: 'Verify that responses can be exported to Excel/CSV format',
        category: 'feature',
        priority: 'high',
        steps: [
          { step: 1, action: 'Go to any campaign with responses (Dashboard > View Responses)', expected: 'Response page loads with data' },
          { step: 2, action: 'Click "Export to Excel" button (top right)', expected: 'CSV file downloads automatically' },
          { step: 3, action: 'Open downloaded file in Excel or Google Sheets', expected: 'File opens with proper columns: #, Name, Email, Status, Device, Duration, Submitted, Step 1, Step 2...' },
          { step: 4, action: 'Verify all response data is present', expected: 'All rows match what is shown on screen, including contact form data' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Response Numbers display',
        description: 'Verify that response numbers appear correctly in both views',
        category: 'feature',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Go to response page (Table View)', expected: 'Response table loads' },
          { step: 2, action: 'Check first column header', expected: 'Shows "#" as column header' },
          { step: 3, action: 'Check row numbers', expected: 'Each row shows 1, 2, 3... in sequence' },
          { step: 4, action: 'Switch to List View', expected: 'List view also shows # column with numbers' },
          { step: 5, action: 'Apply a filter (e.g., search by name)', expected: 'Numbers restart from 1 for filtered results' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Inline Audio Player',
        description: 'Verify that audio responses play directly in the response table',
        category: 'feature',
        priority: 'high',
        steps: [
          { step: 1, action: 'Go to a campaign with audio responses', expected: 'Response page loads' },
          { step: 2, action: 'Find a response with audio answer', expected: 'Audio player widget visible in the cell (not just text link)' },
          { step: 3, action: 'Click play button on audio player', expected: 'Audio plays directly in browser' },
          { step: 4, action: 'Check "Open in viewer" link below player', expected: 'Link opens full audio viewer page with transcription option' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Inline Video Player',
        description: 'Verify that video responses show player in the response table',
        category: 'feature',
        priority: 'high',
        steps: [
          { step: 1, action: 'Go to a campaign with video responses', expected: 'Response page loads' },
          { step: 2, action: 'Find a response with video answer', expected: 'Video thumbnail/player visible in the cell' },
          { step: 3, action: 'Click play on video player', expected: 'Video plays inline' },
          { step: 4, action: 'Check "Open in viewer" link', expected: 'Link opens full video viewer page' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Contact Form Display (Bug Fix)',
        description: 'Verify that ALL contact form fields are displayed, not just name/email/phone',
        category: 'bug-fix',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Create a campaign with Contact Form answer type', expected: 'Contact form step created' },
          { step: 2, action: 'Add 5 custom fields (e.g., Name, Email, Phone, Company, Message)', expected: 'All 5 fields added' },
          { step: 3, action: 'Submit a test response filling all 5 fields', expected: 'Response submitted' },
          { step: 4, action: 'Go to response page and find the submission', expected: 'Response visible' },
          { step: 5, action: 'Check the contact form column', expected: 'ALL 5 field values displayed (format: value1 - value2 - value3 - value4 - value5)' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Duplicate Campaign Name Handling (Bug Fix)',
        description: 'Verify that duplicate campaign names trigger a rename dialog instead of just an alert',
        category: 'bug-fix',
        priority: 'high',
        steps: [
          { step: 1, action: 'Note the name of an existing campaign (e.g., "Campaign 1")', expected: 'Name noted' },
          { step: 2, action: 'Create a new campaign or open another campaign', expected: 'Campaign builder opens' },
          { step: 3, action: 'Change the campaign name to match the existing campaign name', expected: 'Name changed' },
          { step: 4, action: 'Click Save', expected: 'A rename dialog appears (NOT just an alert)' },
          { step: 5, action: 'Check dialog content', expected: 'Shows red "Duplicate Campaign Name" header with message and suggested unique name' },
          { step: 6, action: 'Enter a unique name and save', expected: 'Campaign saves successfully with new name' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Excel Export with Contact Form data',
        description: 'Verify that contact form responses export correctly to Excel',
        category: 'integration',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Go to a campaign with contact form responses', expected: 'Response page loads' },
          { step: 2, action: 'Click "Export to Excel"', expected: 'CSV file downloads' },
          { step: 3, action: 'Open file and find contact form column', expected: 'Contact form data shows as "field1: value1; field2: value2; ..."' },
          { step: 4, action: 'Verify all form fields are included', expected: 'All custom fields from the form are in the export' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test missing audio/video file URL display',
        description: 'Verify that responses with missing file URLs show appropriate message',
        category: 'edge-case',
        priority: 'low',
        steps: [
          { step: 1, action: 'Find a response where audio/video upload may have failed', expected: 'Response found (if any exist)' },
          { step: 2, action: 'Check the display in response table', expected: 'Shows "Audio response recorded (no file URL)" or "Video response recorded (no file URL)"' },
          { step: 3, action: 'Verify this is informative to admin', expected: 'Message clearly indicates the file is missing, not a bug in the display' }
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

    console.log(`Created ${cases.length} test cases for version 2.0.5`);
    console.log('\nVersion 2.0.5 added successfully!');
    console.log('Testers can now verify this version at /tester');

  } catch (error) {
    console.error('Error:', error);
  }
}

addVersion205();
