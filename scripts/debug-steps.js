const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const { data: steps, error } = await supabase
    .from('steps')
    .select('*')
    .order('step_number');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('All steps in database:\n');
    steps.forEach(step => {
      console.log('Step', step.step_number + ':');
      console.log('  ID:', step.id);
      console.log('  Campaign ID:', step.campaign_id);
      console.log('  Label:', step.label);
      console.log('  Answer Type:', step.answer_type);
      console.log('  Data object:', JSON.stringify(step.data, null, 2));
      console.log('  Has videoUrl?', step.data?.videoUrl ? 'YES' : 'NO');
      if (step.data?.videoUrl) {
        console.log('  VideoUrl:', step.data.videoUrl);
      }
      console.log('');
    });
  }
})();
