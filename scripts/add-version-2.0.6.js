const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion206() {
  console.log('Adding version 2.0.6 - Branding Update...');

  try {
    // Create version entry
    const { data: version, error: versionError } = await supabase
      .from('versions')
      .insert({
        version_number: '2.0.6',
        title: 'Branding Update - Videoflux',
        description: 'Renamed the main dashboard header from "Campaign Dashboard" to "Videoflux".',
        status: 'testing',
        changelog: [
          { type: 'improvement', description: 'Renamed dashboard header from "Campaign Dashboard" to "Videoflux"' }
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
        title: 'Verify Videoflux branding on main dashboard',
        description: 'Check that the dashboard header shows "Videoflux" instead of "Campaign Dashboard"',
        category: 'branding',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Login to the application at https://int-video.vercel.app', expected: 'Dashboard loads' },
          { step: 2, action: 'View the main dashboard page', expected: 'Dashboard page displays' },
          { step: 3, action: 'Check the header/title at the top left of the page', expected: 'Shows "Videoflux" (NOT "Campaign Dashboard")' }
        ]
      },
      {
        version_id: version.id,
        title: 'Verify branding persists across navigation',
        description: 'Check that Videoflux branding shows consistently when navigating',
        category: 'branding',
        priority: 'low',
        steps: [
          { step: 1, action: 'Go to main dashboard (https://int-video.vercel.app/dashboard)', expected: 'Dashboard loads' },
          { step: 2, action: 'Verify header shows "Videoflux"', expected: 'Header displays Videoflux' },
          { step: 3, action: 'Click on any campaign to open builder', expected: 'Builder opens' },
          { step: 4, action: 'Navigate back to dashboard', expected: 'Dashboard loads again' },
          { step: 5, action: 'Verify header still shows "Videoflux"', expected: 'Header still displays Videoflux' }
        ]
      },
      {
        version_id: version.id,
        title: 'Verify browser tab/title',
        description: 'Check that browser tab reflects the branding update',
        category: 'branding',
        priority: 'low',
        steps: [
          { step: 1, action: 'Go to the main dashboard', expected: 'Dashboard loads' },
          { step: 2, action: 'Check the browser tab title', expected: 'Tab displays page title' },
          { step: 3, action: 'Note what it displays', expected: 'May or may not include Videoflux based on page setup' }
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

    console.log(`Created ${cases.length} test case(s) for version 2.0.6`);
    console.log('\nVersion 2.0.6 added successfully!');
    console.log('Testers can now verify this version at /tester');

  } catch (error) {
    console.error('Error:', error);
  }
}

addVersion206();
