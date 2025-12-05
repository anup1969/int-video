const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion4() {
  console.log('Adding version 4 - Embeddable Widget & UI Improvements...');

  try {
    // Create version entry
    const { data: version, error: versionError } = await supabase
      .from('versions')
      .insert({
        version_number: '4',
        title: 'Embeddable Widget & UI Improvements',
        description: 'Added embeddable widget feature allowing campaigns to be embedded on any website. Improved share functionality with modal UI, removed Jarvis from end-user pages, and fixed UI conflicts.',
        status: 'testing',
        changelog: [
          { type: 'feature', description: 'Added embeddable widget feature - campaigns can now be embedded on any website' },
          { type: 'feature', description: 'Share button now shows modal with 2 options: Copy Campaign URL and Get Embed Code' },
          { type: 'feature', description: 'Embeddable widget shows circular video player with first 5 seconds preview (muted, autoplay)' },
          { type: 'feature', description: 'Customizable greeting message for embedded widgets' },
          { type: 'feature', description: 'Widget opens campaign in centered modal overlay when clicked' },
          { type: 'feature', description: 'Self-contained widget script for easy website integration' },
          { type: 'feature', description: 'Auto-hiding greeting tooltip after 10 seconds' },
          { type: 'feature', description: 'Added labeled "Back to Dashboard" button in builder header' },
          { type: 'ui', description: 'Removed Jarvis voice assistant from end-user campaign pages (/campaign/*, /viewer/*, shortUrl)' },
          { type: 'ui', description: 'Removed Jarvis from tester and admin-reports pages for cleaner UI' },
          { type: 'ui', description: 'Removed "v4 enhanced" info box from flow builder page' },
          { type: 'bugfix', description: 'Fixed Jarvis button overlapping with plus button on tester/admin pages' },
          { type: 'bugfix', description: 'Fixed JSX rendering issue in share modal with React Fragment wrapper' },
          { type: 'ui', description: 'Better UX with share modal instead of browser alerts' },
          { type: 'ui', description: 'Responsive widget design for mobile and desktop' },
          { type: 'ui', description: 'Modal closes on Escape key or clicking outside' }
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
        title: 'Test share modal functionality',
        description: 'Verify that share button opens modal with 2 options',
        category: 'feature',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open any campaign in flow builder', expected: 'Flow builder loads with campaign' },
          { step: 2, action: 'Save the campaign first', expected: 'Campaign saves successfully' },
          { step: 3, action: 'Click "Share" button in header', expected: 'Share modal opens with 2 options' },
          { step: 4, action: 'Verify "Campaign URL" option is visible', expected: 'Shows URL input with Copy button' },
          { step: 5, action: 'Verify "Embed Code" option is visible', expected: 'Shows greeting input and Copy Embed Code button' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test copy campaign URL',
        description: 'Verify that campaign URL can be copied to clipboard',
        category: 'feature',
        priority: 'high',
        steps: [
          { step: 1, action: 'Open share modal', expected: 'Modal opens' },
          { step: 2, action: 'Check URL in Campaign URL section', expected: 'Shows full URL like https://int-video.vercel.app/campaign/{id}' },
          { step: 3, action: 'Click "Copy" button', expected: 'Alert appears: "URL copied to clipboard!"' },
          { step: 4, action: 'Paste into notepad/text editor', expected: 'URL pastes correctly' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test embed code generation',
        description: 'Verify that embed code can be generated and copied',
        category: 'feature',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open share modal', expected: 'Modal opens' },
          { step: 2, action: 'In Embed Code section, edit greeting message to "Hello World!"', expected: 'Text updates in input field' },
          { step: 3, action: 'Click "Copy Embed Code" button', expected: 'Alert appears with instructions to paste before </body> tag' },
          { step: 4, action: 'Paste code into text editor', expected: 'JavaScript code with greeting "Hello World!" appears' },
          { step: 5, action: 'Verify code includes campaignId', expected: 'Code contains campaignId: {id}' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test embeddable widget on external site',
        description: 'Verify widget works when embedded on external website',
        category: 'feature',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Create test HTML file with copied embed code', expected: 'HTML file created' },
          { step: 2, action: 'Open HTML file in browser', expected: 'Circular video widget appears bottom-right' },
          { step: 3, action: 'Check if greeting tooltip appears', expected: 'Greeting message "Hello World!" shows above widget' },
          { step: 4, action: 'Wait 10 seconds', expected: 'Greeting auto-hides' },
          { step: 5, action: 'Click on circular widget', expected: 'Modal opens with full campaign' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test widget video preview',
        description: 'Verify circular widget plays first 5 seconds of video',
        category: 'feature',
        priority: 'high',
        steps: [
          { step: 1, action: 'Embed widget on test page', expected: 'Widget loads' },
          { step: 2, action: 'Observe circular video player', expected: 'First video from campaign plays (muted, autoplay)' },
          { step: 3, action: 'Time the video playback', expected: 'Video plays for exactly 5 seconds then pauses' },
          { step: 4, action: 'Check video is muted', expected: 'No sound plays automatically' },
          { step: 5, action: 'Verify video loops during 5 seconds if short', expected: 'Video loops seamlessly if under 5 seconds' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Jarvis removal from end-user pages',
        description: 'Verify Jarvis does not appear on campaign viewer pages',
        category: 'ui',
        priority: 'high',
        steps: [
          { step: 1, action: 'Open campaign viewer page /campaign/{id}', expected: 'Campaign loads' },
          { step: 2, action: 'Look for Jarvis button bottom-right', expected: 'Jarvis button NOT visible' },
          { step: 3, action: 'Open viewer page /viewer/{id}', expected: 'Viewer loads' },
          { step: 4, action: 'Check for Jarvis', expected: 'Jarvis NOT visible' },
          { step: 5, action: 'Open shortUrl page', expected: 'Jarvis NOT visible' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Jarvis removal from tester/admin pages',
        description: 'Verify Jarvis does not appear on tester and admin-reports pages',
        category: 'bugfix',
        priority: 'high',
        steps: [
          { step: 1, action: 'Go to /tester page', expected: 'Tester page loads' },
          { step: 2, action: 'Look for Jarvis button', expected: 'Jarvis NOT visible' },
          { step: 3, action: 'Check orange plus button bottom-right', expected: 'Plus button visible at bottom-8 right-8' },
          { step: 4, action: 'Go to /admin-reports page', expected: 'Admin reports loads' },
          { step: 5, action: 'Verify no overlap between Jarvis and plus button', expected: 'Only plus button visible, no overlap' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Back to Dashboard button',
        description: 'Verify Back to Dashboard button in builder header',
        category: 'feature',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Open any campaign in flow builder', expected: 'Builder loads' },
          { step: 2, action: 'Check top-left of header', expected: 'Back to Dashboard button with arrow icon visible' },
          { step: 3, action: 'Click the button', expected: 'Navigates to /dashboard page' },
          { step: 4, action: 'Verify dashboard loads', expected: 'Campaign dashboard shows all campaigns' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test v4 enhanced box removal',
        description: 'Verify "v4 enhanced" info box removed from flow builder',
        category: 'ui',
        priority: 'low',
        steps: [
          { step: 1, action: 'Open any campaign in flow builder', expected: 'Builder loads' },
          { step: 2, action: 'Scan entire flow builder page', expected: '"v4 enhanced" box NOT visible anywhere' },
          { step: 3, action: 'Check canvas area', expected: 'Clean canvas without info boxes' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test widget modal close functionality',
        description: 'Verify embedded widget modal can be closed in multiple ways',
        category: 'feature',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Open widget on test page and click to open modal', expected: 'Modal opens with campaign' },
          { step: 2, action: 'Press Escape key', expected: 'Modal closes' },
          { step: 3, action: 'Open modal again', expected: 'Modal opens' },
          { step: 4, action: 'Click on dark overlay outside modal', expected: 'Modal closes' },
          { step: 5, action: 'Open modal again and click X button', expected: 'Modal closes' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test widget responsiveness',
        description: 'Verify widget works on mobile and desktop screens',
        category: 'ui',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Open widget on desktop browser', expected: 'Widget shows 80px circle bottom-right' },
          { step: 2, action: 'Resize browser to mobile width (<640px)', expected: 'Widget scales appropriately' },
          { step: 3, action: 'Click widget on mobile', expected: 'Modal opens fullscreen' },
          { step: 4, action: 'Test on actual mobile device', expected: 'Widget and modal work smoothly' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test share modal close functionality',
        description: 'Verify share modal can be closed properly',
        category: 'ui',
        priority: 'low',
        steps: [
          { step: 1, action: 'Open share modal', expected: 'Modal opens' },
          { step: 2, action: 'Click X button top-right', expected: 'Modal closes' },
          { step: 3, action: 'Open modal again', expected: 'Modal opens' },
          { step: 4, action: 'Click "Close" button at bottom', expected: 'Modal closes' },
          { step: 5, action: 'Open modal and click dark overlay', expected: 'Modal closes' }
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

    console.log(`Created ${cases.length} test cases for version 4`);
    console.log('\nVersion 4 added successfully!');
    console.log('Testers can now verify this version at /tester');

  } catch (error) {
    console.error('Error:', error);
  }
}

addVersion4();
