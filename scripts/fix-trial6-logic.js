require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTrial6Logic() {
  const campaignId = '5c523d0e-70d0-4c03-8db3-00c2ae9b2795';

  console.log('Fixing Trial 6 logic rules...\n');

  // Get all steps
  const { data: steps, error } = await supabase
    .from('steps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('step_number');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Current steps:');
  steps.forEach((s, i) => console.log(`  Step ${i+1}: ${s.id} (${s.label})`));

  // Step 1's logic should point to:
  // - Button 1 ("Problem in app") → Step 2 (file-upload)
  // - Button 2 ("other issue") → Step 3 (button)

  const step1 = steps[0];
  const step2 = steps[1];
  const step3 = steps[2];

  console.log(`\nUpdating Step 1 logic rules...`);
  console.log(`  Button 1 will point to Step 2: ${step2.id}`);
  console.log(`  Button 2 will point to Step 3: ${step3.id}`);

  const updatedData = {
    ...step1.data,
    logicRules: [
      {
        text: "okk",
        label: 'If "Problem in app" selected',
        target: step2.id,
        condition: "option_0",
        targetType: "node"
      },
      {
        url: "google.com",
        label: 'If "other issue" selected',
        target: step3.id,
        condition: "option_1",
        targetType: "node"
      }
    ]
  };

  const { error: updateError } = await supabase
    .from('steps')
    .update({ data: updatedData })
    .eq('id', step1.id);

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('\n✅ Successfully updated Step 1 logic rules!');
  }
}

fixTrial6Logic();
