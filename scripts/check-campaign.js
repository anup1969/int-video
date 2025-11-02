const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const campaignId = process.argv[2];

if (!campaignId) {
  console.log('Usage: node check-campaign.js <campaign-id>');
  process.exit(1);
}

(async () => {
  // Get campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError) {
    console.error('Error fetching campaign:', campaignError);
    return;
  }

  console.log('\n=== CAMPAIGN ===');
  console.log('ID:', campaign.id);
  console.log('Name:', campaign.name);
  console.log('Status:', campaign.status);
  console.log('');

  // Get all steps for this campaign
  const { data: steps, error: stepsError } = await supabase
    .from('steps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('step_number');

  if (stepsError) {
    console.error('Error fetching steps:', stepsError);
    return;
  }

  console.log('=== STEPS ===');
  console.log('Total steps:', steps.length);
  console.log('');

  steps.forEach(step => {
    console.log(`Step ${step.step_number}:`);
    console.log('  Label:', step.label);
    console.log('  Answer Type:', step.answer_type);
    console.log('  Has Video?', step.data?.videoUrl ? 'YES' : 'NO');
    if (step.data?.videoUrl) {
      console.log('  Video URL:', step.data.videoUrl);
    }
    console.log('');
  });
})();
