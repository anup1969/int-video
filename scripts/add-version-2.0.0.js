const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion200() {
  console.log('Adding version 2.0.0 - Templates System...');

  try {
    // Create version entry
    const { data: version, error: versionError } = await supabase
      .from('versions')
      .insert({
        version_number: '2.0.0',
        title: 'Templates System with Pre-built Campaign Templates',
        description: 'Added complete templates system with 6 pre-built campaign templates covering Lead Generation, Product Feedback, Customer Survey, FAQ, Support, and Training',
        status: 'testing',
        changelog: [
          { type: 'feature', description: 'Templates button added to builder header with purple styling' },
          { type: 'feature', description: 'Templates modal with category filtering (6 categories)' },
          { type: 'feature', description: '6 pre-built system templates with professional flows' },
          { type: 'feature', description: 'Template selection and loading into builder canvas' },
          { type: 'feature', description: 'API endpoints: GET /api/templates and POST /api/templates' },
          { type: 'feature', description: 'Template-to-campaign conversion logic' },
          { type: 'feature', description: 'Category-based color coding and icons' },
          { type: 'improvement', description: 'Visual template cards with step count and system badge' }
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
        title: 'Test Templates button visibility in builder header',
        description: 'Verify that the Templates button appears in the campaign builder header',
        category: 'ui-display',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open campaign builder (create new or edit existing campaign)', expected: 'Builder page loads' },
          { step: 2, action: 'Look for "Templates" button in header toolbar', expected: 'Purple "Templates" button visible with layer-group icon' },
          { step: 3, action: 'Check button placement', expected: 'Button is between "Zoom" display and "Save" button' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Templates modal opening and display',
        description: 'Verify that clicking the Templates button opens the modal with all templates',
        category: 'ui-interaction',
        priority: 'critical',
        steps: [
          { step: 1, action: 'In campaign builder, click "Templates" button', expected: 'Modal opens with gradient purple header' },
          { step: 2, action: 'Check modal title', expected: 'Shows "Choose a Template" with subtitle' },
          { step: 3, action: 'Check category filters', expected: '7 category buttons visible: All Templates, Lead Generation, Product Feedback, Customer Survey, FAQ, Support, Training' },
          { step: 4, action: 'Scroll through templates grid', expected: 'Grid displays 6 template cards' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test all 6 system templates are present',
        description: 'Verify that all 6 pre-built templates are visible in the modal',
        category: 'data-display',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open Templates modal', expected: 'Modal displays template grid' },
          { step: 2, action: 'Look for "Lead Generation Funnel" template', expected: 'Template card visible with violet icon' },
          { step: 3, action: 'Look for "Product Feedback Loop" template', expected: 'Template card visible with blue icon' },
          { step: 4, action: 'Look for "Customer Satisfaction Survey" template', expected: 'Template card visible with green icon' },
          { step: 5, action: 'Look for "FAQ Video Assistant" template', expected: 'Template card visible with yellow icon' },
          { step: 6, action: 'Look for "Customer Support Intake" template', expected: 'Template card visible with red icon' },
          { step: 7, action: 'Look for "Employee Training Module" template', expected: 'Template card visible with purple icon' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test category filtering functionality',
        description: 'Verify that category filters work to show/hide templates',
        category: 'ui-interaction',
        priority: 'high',
        steps: [
          { step: 1, action: 'Open Templates modal', expected: 'All 6 templates visible' },
          { step: 2, action: 'Click "Lead Generation" category filter', expected: 'Only "Lead Generation Funnel" template is visible' },
          { step: 3, action: 'Click "Product Feedback" category filter', expected: 'Only "Product Feedback Loop" template is visible' },
          { step: 4, action: 'Click "All Templates" filter', expected: 'All 6 templates visible again' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test template selection and loading into builder',
        description: 'Verify that selecting a template loads it into the campaign builder',
        category: 'workflow',
        priority: 'critical',
        steps: [
          { step: 1, action: 'Open Templates modal in a new/empty campaign', expected: 'Modal opens' },
          { step: 2, action: 'Click "Use This Template" on Lead Generation template', expected: 'Modal closes' },
          { step: 3, action: 'Check builder canvas', expected: 'Template steps appear as nodes on canvas with connections' },
          { step: 4, action: 'Count the number of steps loaded', expected: '4 steps visible: introduction, pain point, solution demo, contact collection' },
          { step: 5, action: 'Click on first step node', expected: 'Step panel opens showing step configuration' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test template step data integrity',
        description: 'Verify that loaded template steps have correct question types and answer types',
        category: 'data-display',
        priority: 'high',
        steps: [
          { step: 1, action: 'Load Lead Generation template', expected: 'Template loads into builder' },
          { step: 2, action: 'Click first step (introduction)', expected: 'Step configuration shows question_type and answer_type' },
          { step: 3, action: 'Verify step has valid answer_type (not null)', expected: 'answer_type field is populated' },
          { step: 4, action: 'Save the campaign', expected: 'Campaign saves successfully without errors' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Product Feedback template structure',
        description: 'Verify Product Feedback template loads with correct flow',
        category: 'workflow',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Open Templates modal', expected: 'Modal opens' },
          { step: 2, action: 'Use "Product Feedback Loop" template', expected: 'Template loads' },
          { step: 3, action: 'Check loaded steps', expected: 'Shows welcome, product usage, feedback, and rating steps' },
          { step: 4, action: 'Verify step connections', expected: 'Steps are connected in logical flow order' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test Customer Survey template structure',
        description: 'Verify Customer Survey template loads with correct flow',
        category: 'workflow',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Open Templates modal', expected: 'Modal opens' },
          { step: 2, action: 'Use "Customer Satisfaction Survey" template', expected: 'Template loads' },
          { step: 3, action: 'Check loaded steps', expected: 'Shows welcome, satisfaction, improvement, and thanks steps' },
          { step: 4, action: 'Verify all steps have proper configuration', expected: 'Each step has question and answer type set' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test modal close functionality',
        description: 'Verify that the modal can be closed without selecting a template',
        category: 'ui-interaction',
        priority: 'medium',
        steps: [
          { step: 1, action: 'Open Templates modal', expected: 'Modal opens' },
          { step: 2, action: 'Click X button in top-right corner', expected: 'Modal closes, builder unchanged' },
          { step: 3, action: 'Open modal again', expected: 'Modal opens' },
          { step: 4, action: 'Click "Cancel" button at bottom', expected: 'Modal closes, builder unchanged' },
          { step: 5, action: 'Open modal again', expected: 'Modal opens' },
          { step: 6, action: 'Click outside modal (on dark overlay)', expected: 'Modal closes, builder unchanged' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test template card displays step count',
        description: 'Verify that each template card shows the number of steps',
        category: 'ui-display',
        priority: 'low',
        steps: [
          { step: 1, action: 'Open Templates modal', expected: 'Modal opens with template cards' },
          { step: 2, action: 'Look at Lead Generation template card', expected: 'Shows "4 steps" indicator' },
          { step: 3, action: 'Look at Product Feedback template card', expected: 'Shows step count' },
          { step: 4, action: 'Check all template cards have step count', expected: 'All cards show "X steps" text' }
        ]
      },
      {
        version_id: version.id,
        title: 'Test system template badge display',
        description: 'Verify that system templates show a "System" badge',
        category: 'ui-display',
        priority: 'low',
        steps: [
          { step: 1, action: 'Open Templates modal', expected: 'Modal opens' },
          { step: 2, action: 'Look at template cards', expected: 'Each card shows purple "System" badge with star icon' },
          { step: 3, action: 'Check badge styling', expected: 'Badge has purple background and is positioned in metadata section' }
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

    console.log(`Created ${cases.length} test cases for version 2.0.0`);
    console.log('\nVersion 2.0.0 added successfully!');
    console.log('Testers can now verify this version at /tester');

  } catch (error) {
    console.error('Error:', error);
  }
}

addVersion200();
