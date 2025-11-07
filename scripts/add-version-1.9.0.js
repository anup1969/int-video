require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion190() {
  console.log('🚀 Adding version 1.9.0...\n');

  try {
    // 1. Create version 1.9.0
    console.log('Creating version 1.9.0...');
    const { data: version190, error: v190Error } = await supabase
      .from('versions')
      .insert({
        version_number: '1.9.0',
        title: 'Admin Reports Dashboard for Bug Management',
        description: 'Complete admin dashboard to view, filter, and manage all ad-hoc bug reports and suggestions submitted by testers',
        status: 'testing',
        changelog: [
          { type: 'feature', description: 'Admin Reports Dashboard at /admin-reports for managing all bug reports' },
          { type: 'feature', description: 'Statistics overview showing total, open, in-progress, and resolved reports' },
          { type: 'feature', description: 'Advanced filtering by version, status, and report type' },
          { type: 'feature', description: 'Detailed report view modal with all submission information' },
          { type: 'feature', description: 'Status update functionality (open/in_progress/resolved/wont_fix)' },
          { type: 'feature', description: 'Developer notes field for tracking fixes and decisions' },
          { type: 'feature', description: 'Color-coded status and severity badges for quick identification' },
          { type: 'improvement', description: 'Admin Reports button added to tester dashboard header' },
          { type: 'improvement', description: 'Screenshot links displayed in report details' },
        ],
        known_issues: []
      })
      .select()
      .single();

    if (v190Error) throw v190Error;
    console.log('✅ Version 1.9.0 created\n');

    // 2. Create test cases for v1.9.0
    console.log('Creating test cases for v1.9.0...');
    const testCases190 = [
      {
        version_id: version190.id,
        title: 'Test Admin Reports page accessibility',
        description: 'Verify that the Admin Reports page is accessible and displays correctly',
        category: 'ui-display',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Go to /tester dashboard', expected: 'Tester dashboard loads' },
          { step: 2, action: 'Look for "Admin Reports" button in header', expected: 'Blue "Admin Reports" button is visible in top-right area' },
          { step: 3, action: 'Click the "Admin Reports" button', expected: 'Redirects to /admin-reports page' },
          { step: 4, action: 'Check page header', expected: 'Shows "Admin Reports Dashboard" with shield icon' },
        ]
      },
      {
        version_id: version190.id,
        title: 'Test statistics cards display',
        description: 'Verify that statistics cards show correct counts',
        category: 'ui-display',
        priority: 'high',
        steps: [
          { step: 1, action: 'Open /admin-reports page', expected: 'Page loads with statistics cards at top' },
          { step: 2, action: 'Check if 6 statistic cards are visible', expected: 'Shows Total, Open, In Progress, Resolved, Bugs, Suggestions cards' },
          { step: 3, action: 'Verify the dummy bug report appears in counts', expected: 'Total shows at least 1, and appropriate category shows count' },
          { step: 4, action: 'Check card colors', expected: 'Different background colors for each stat (white, blue, yellow, green, red, purple)' },
        ]
      },
      {
        version_id: version190.id,
        title: 'Test report list display',
        description: 'Verify that submitted reports appear in the list',
        category: 'data-display',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open /admin-reports', expected: 'Page loads' },
          { step: 2, action: 'Scroll down to see reports list', expected: 'Previously submitted dummy bug report is visible' },
          { step: 3, action: 'Check report card contains title', expected: 'Report title "dummy" is displayed' },
          { step: 4, action: 'Check report shows status badge', expected: 'Blue "OPEN" badge visible' },
          { step: 5, action: 'Check report shows version', expected: 'Shows "v1.8.0" tag' },
          { step: 6, action: 'Check report shows type icon', expected: 'Bug emoji 🐛 visible' },
        ]
      },
      {
        version_id: version190.id,
        title: 'Test filtering functionality',
        description: 'Verify that filters work correctly to narrow down reports',
        category: 'ui-interaction',
        priority: 'high',
        steps: [
          { step: 1, action: 'Open /admin-reports', expected: 'Page loads with all reports visible' },
          { step: 2, action: 'Click on "All Status" dropdown', expected: 'Dropdown opens with options: All Status, Open, In Progress, Resolved, Won\'t Fix' },
          { step: 3, action: 'Select "Open" from status filter', expected: 'Only open reports are displayed' },
          { step: 4, action: 'Click "All Types" dropdown', expected: 'Dropdown shows: All Types, Bugs, Suggestions, Improvements' },
          { step: 5, action: 'Select "Bugs" from type filter', expected: 'Only bug reports are shown' },
          { step: 6, action: 'Click Reset button', expected: 'All filters reset to "All", all reports visible again' },
        ]
      },
      {
        version_id: version190.id,
        title: 'Test report detail modal opening',
        description: 'Verify that clicking a report opens the detail modal',
        category: 'ui-interaction',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open /admin-reports', expected: 'Page loads with report cards' },
          { step: 2, action: 'Click on the dummy bug report card', expected: 'Modal opens with title "Report Details & Management"' },
          { step: 3, action: 'Check modal shows all report information', expected: 'Title, description, version, tester name, browser, device visible' },
          { step: 4, action: 'Check if screenshots section appears', expected: 'Screenshots section shows "Screenshot 1" link if uploaded' },
          { step: 5, action: 'Click X button in top-right of modal', expected: 'Modal closes' },
        ]
      },
      {
        version_id: version190.id,
        title: 'Test status update functionality',
        description: 'Update report status and verify it saves',
        category: 'form-submission',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open /admin-reports and click on dummy bug report', expected: 'Detail modal opens' },
          { step: 2, action: 'Scroll down to "Update Status & Notes" section', expected: 'Status dropdown and developer notes textarea visible' },
          { step: 3, action: 'Change status from "Open" to "In Progress"', expected: 'Dropdown value changes' },
          { step: 4, action: 'Click "Save Changes" button', expected: 'Success alert appears, modal closes' },
          { step: 5, action: 'Check the report card again', expected: 'Status badge now shows yellow "IN PROGRESS"' },
        ]
      },
      {
        version_id: version190.id,
        title: 'Test developer notes addition',
        description: 'Add developer notes to a report and verify they save',
        category: 'form-submission',
        priority: 'high',
        steps: [
          { step: 1, action: 'Open /admin-reports and click dummy bug report', expected: 'Modal opens' },
          { step: 2, action: 'In Developer Notes field, type: "This is a test note from QA"', expected: 'Text appears in textarea' },
          { step: 3, action: 'Click Save Changes', expected: 'Success message, modal closes' },
          { step: 4, action: 'Click the same report again to reopen modal', expected: 'Modal opens' },
          { step: 5, action: 'Check if developer notes are saved', expected: 'Notes field shows "This is a test note from QA"' },
          { step: 6, action: 'Close modal and check report card', expected: 'Report card now shows blue box with developer notes displayed' },
        ]
      },
      {
        version_id: version190.id,
        title: 'Test marking report as resolved',
        description: 'Mark a bug report as resolved and verify the change',
        category: 'workflow',
        priority: 'high',
        steps: [
          { step: 1, action: 'Open /admin-reports and open a report', expected: 'Modal opens' },
          { step: 2, action: 'Change status to "Resolved"', expected: 'Status dropdown shows Resolved' },
          { step: 3, action: 'Add note: "Fixed in next deployment"', expected: 'Note added' },
          { step: 4, action: 'Click Save Changes', expected: 'Success alert, modal closes' },
          { step: 5, action: 'Check statistics cards at top', expected: 'Resolved count increases by 1' },
          { step: 6, action: 'Check report card', expected: 'Shows green "RESOLVED ✅" badge' },
        ]
      }
    ];

    const { error: tc190Error } = await supabase
      .from('test_cases')
      .insert(testCases190);

    if (tc190Error) throw tc190Error;
    console.log('✅ Test cases for v1.9.0 created\n');

    console.log('========================================');
    console.log('✅ Version 1.9.0 added successfully!');
    console.log('========================================');
    console.log('\nYou can now test version 1.9.0 at:');
    console.log('https://int-video.vercel.app/tester\n');
    console.log('The Admin Reports Dashboard is at:');
    console.log('https://int-video.vercel.app/admin-reports\n');

  } catch (error) {
    console.error('❌ Error adding version 1.9.0:', error);
  }
}

addVersion190();
