const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion202() {
  console.log('Adding version 2.0.2 - Background Music for Response Recording...');

  try {
    // Create version entry
    const { data: version, error: versionError } = await supabase
      .from('versions')
      .insert({
        version_number: '2.0.2',
        title: 'Background Music for Response Recording',
        description: 'Added background music feature that plays when end-users record video, audio, or text responses. Configurable in Campaign Builder with 4 music options.',
        status: 'testing',
        changelog: [
          { type: 'feature', description: 'Background Music toggle button in Edit Modal (beside Video/Text options)' },
          { type: 'feature', description: '4 music options: Calm & Ambient, Upbeat & Energetic, Soft Piano, No Music' },
          { type: 'feature', description: 'Auto-play music when end-user clicks Video, Audio, or Text response' },
          { type: 'feature', description: 'Music stops automatically when response submitted or cancelled' },
          { type: 'feature', description: 'Royalty-free music from Pixabay CDN' },
          { type: 'improvement', description: 'Music volume set to 30% for background playback' },
          { type: 'improvement', description: 'Looping audio for seamless experience' },
          { type: 'ui', description: 'Tester and Admin Reports buttons added to Dashboard header' }
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
        title: 'Test Music button visibility in Edit Modal',
        description: 'Verify that the Music ON/OFF button appears next to Video Upload and Text Slide options',
        category: 'ui-display',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open campaign builder and edit any step', expected: 'Edit Modal opens with Video tab active' },
          { step: 2, action: 'Look at "Content Type" section', expected: 'See Video Upload, Text Slide, and Music button' },
          { step: 3, action: 'Check Music button styling', expected: 'Button shows "Music OFF" with gray border when disabled' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Music button toggle functionality',
        description: 'Verify that clicking Music button toggles it on/off',
        category: 'ui-interaction',
        priority: 'critical',
        steps: [
          { step: 1, action: 'In Edit Modal, click "Music OFF" button', expected: 'Button changes to "Music ON" with purple styling' },
          { step: 2, action: 'Check if music options appear', expected: '4 music type buttons appear below (Calm, Upbeat, Piano, No Music)' },
          { step: 3, action: 'Click "Music ON" again', expected: 'Toggles back to "Music OFF", music options disappear' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test music type selection',
        description: 'Verify that different music types can be selected',
        category: 'ui-interaction',
        priority: 'high',
        steps: [
          { step: 1, action: 'Enable Music in Edit Modal', expected: 'Music options appear' },
          { step: 2, action: 'Click "Calm & Ambient" option', expected: 'Option gets purple border/highlight' },
          { step: 3, action: 'Click "Upbeat & Energetic" option', expected: 'Selection changes to Upbeat' },
          { step: 4, action: 'Click "Soft Piano" option', expected: 'Selection changes to Piano' },
          { step: 5, action: 'Click "No Music" option', expected: 'Selection changes to No Music' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test music configuration saves with campaign',
        description: 'Verify that music settings persist after saving campaign',
        category: 'data-persistence',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Enable Music and select "Calm & Ambient"', expected: 'Music configured' },
          { step: 2, action: 'Click "Save Changes" in Edit Modal', expected: 'Modal closes' },
          { step: 3, action: 'Save the campaign (main Save button)', expected: 'Campaign saves successfully' },
          { step: 4, action: 'Refresh page and re-open same step Edit Modal', expected: 'Music is still enabled with "Calm & Ambient" selected' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test music playback in end-user campaign - Video response',
        description: 'Verify that music plays when end-user clicks Video response button',
        category: 'end-user-experience',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Create campaign with Music enabled (any music type except "No Music")', expected: 'Campaign configured' },
          { step: 2, action: 'Save and open campaign as end-user', expected: 'Campaign loads' },
          { step: 3, action: 'Navigate to step with open-ended answer type', expected: 'Response buttons appear (Video, Audio, Text)' },
          { step: 4, action: 'Click "Video" response button', expected: 'Background music starts playing automatically' },
          { step: 5, action: 'Check music volume', expected: 'Music plays at background level (not too loud)' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test music playback in end-user campaign - Audio response',
        description: 'Verify that music plays when end-user clicks Audio response button',
        category: 'end-user-experience',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open campaign with Music enabled as end-user', expected: 'Campaign loads' },
          { step: 2, action: 'Navigate to open-ended step', expected: 'Response buttons appear' },
          { step: 3, action: 'Click "Audio" response button', expected: 'Background music starts playing' },
          { step: 4, action: 'Listen to audio quality', expected: 'Music loops seamlessly without gaps' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test music playback in end-user campaign - Text response',
        description: 'Verify that music plays when end-user clicks Text response button',
        category: 'end-user-experience',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open campaign with Music enabled as end-user', expected: 'Campaign loads' },
          { step: 2, action: 'Navigate to open-ended step', expected: 'Response buttons appear' },
          { step: 3, action: 'Click "Text" response button', expected: 'Background music starts playing' },
          { step: 4, action: 'Type in text field', expected: 'Music continues playing while typing' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test music stops when response submitted',
        description: 'Verify that music stops after user submits their response',
        category: 'end-user-experience',
        priority: 'high',
        steps: [
          { step: 1, action: 'In end-user campaign, click Video/Audio/Text to start recording', expected: 'Music starts playing' },
          { step: 2, action: 'Complete the response and click Submit', expected: 'Response submits' },
          { step: 3, action: 'Listen for music', expected: 'Music stops immediately after submission' },
          { step: 4, action: 'Move to next step', expected: 'No music playing (until next response starts)' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test music stops when response cancelled',
        description: 'Verify that music stops when user cancels their response',
        category: 'end-user-experience',
        priority: 'high',
        steps: [
          { step: 1, action: 'In end-user campaign, click Video/Audio/Text', expected: 'Music starts playing' },
          { step: 2, action: 'Click Cancel or X button to close response UI', expected: 'Response UI closes' },
          { step: 3, action: 'Listen for music', expected: 'Music stops immediately' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test "No Music" option works correctly',
        description: 'Verify that selecting "No Music" disables playback',
        category: 'end-user-experience',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Configure step with Music enabled but "No Music" selected', expected: 'Music enabled with "No Music" option' },
          { step: 2, action: 'Save campaign and open as end-user', expected: 'Campaign loads' },
          { step: 3, action: 'Click Video/Audio/Text response', expected: 'Response UI opens' },
          { step: 4, action: 'Listen for any audio', expected: 'No background music plays' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Tester button in Dashboard header',
        description: 'Verify that Tester button appears in Dashboard and navigates correctly',
        category: 'ui-navigation',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Go to Dashboard page', expected: 'Dashboard loads' },
          { step: 2, action: 'Look at header area (top right)', expected: 'See "Tester" button with vial icon' },
          { step: 3, action: 'Click "Tester" button', expected: 'Navigates to /tester page' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Admin Reports button in Dashboard header',
        description: 'Verify that Admin Reports button appears in Dashboard and navigates correctly',
        category: 'ui-navigation',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Go to Dashboard page', expected: 'Dashboard loads' },
          { step: 2, action: 'Look at header area (top right)', expected: 'See "Admin Reports" button with bug icon' },
          { step: 3, action: 'Click "Admin Reports" button', expected: 'Navigates to /admin-reports page' }
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

    console.log(`Created ${cases.length} test cases for version 2.0.2`);
    console.log('\nVersion 2.0.2 added successfully!');
    console.log('Testers can now verify this version at /tester');

  } catch (error) {
    console.error('Error:', error);
  }
}

addVersion202();
