require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCampaign(campaignId) {
  console.log('=== DEBUG TRIAL 6 CAMPAIGN ===\n');

  // Get campaign settings
  const { data: campaign, error: campError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campError) {
    console.error('Campaign error:', campError);
    return;
  }

  console.log('Campaign Name:', campaign.name);
  console.log('Settings:', JSON.stringify(campaign.settings, null, 2));

  // Get all steps
  const { data: steps, error: stepsError } = await supabase
    .from('steps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('step_number');

  if (stepsError) {
    console.error('Steps error:', stepsError);
    return;
  }

  console.log('\n=== STEPS ===\n');
  steps.forEach((step, idx) => {
    console.log('Step ' + (idx + 1) + ':');
    console.log('  ID:', step.id);
    console.log('  Label:', step.label);
    console.log('  Answer Type:', step.answer_type);
    console.log('  Next Step ID:', step.next_step_id);
    console.log('  Data:', JSON.stringify(step.data, null, 2));
  });
}

const campaignId = process.argv[2] || '5c523d0e-70d0-4c03-8db3-00c2ae9b2795';
debugCampaign(campaignId);
