const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('Testing Delete button visibility...\n');

  // Test 1: Check if the dashboard.js file has the delete button code
  const fs = require('fs');
  const dashboardContent = fs.readFileSync('./pages/dashboard.js', 'utf8');

  const hasDeleteButton = dashboardContent.includes('Delete');
  const hasOnDeleteProp = dashboardContent.includes('onDelete');
  const hasFaTrash = dashboardContent.includes('fa-trash');

  console.log('Local file checks:');
  console.log('  - Contains "Delete" text:', hasDeleteButton);
  console.log('  - Contains "onDelete" prop:', hasOnDeleteProp);
  console.log('  - Contains fa-trash icon:', hasFaTrash);

  // Test 2: Check all campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('\nTotal campaigns:', campaigns?.length || 0);

  // Test 3: Get response counts using the new logic
  console.log('\nResponse counts per campaign:');
  for (const campaign of campaigns.slice(0, 5)) {
    const { data: responses } = await supabase
      .from('responses')
      .select('id')
      .eq('campaign_id', campaign.id);

    console.log(`  ${campaign.name}: ${responses?.length || 0} total responses`);
  }
})();
