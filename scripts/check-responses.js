const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  // Get all campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('All campaigns:');
  campaigns.forEach((c, i) => {
    console.log(`${i+1}. ID: ${c.id.substring(0, 8)}..., Name: ${c.name}`);
  });

  // Get the campaign you mentioned (14th one)
  const campaign14 = campaigns[13];

  if (campaign14) {
    console.log('\n=== Campaign 14 Details ===');
    console.log('ID:', campaign14.id);
    console.log('Name:', campaign14.name);

    // Get all responses
    const { data: allResponses } = await supabase
      .from('responses')
      .select('*')
      .eq('campaign_id', campaign14.id);

    console.log('\nTotal responses in DB:', allResponses?.length || 0);

    // Get completed responses
    const completedResponses = allResponses?.filter(r => r.completed) || [];
    console.log('Completed responses:', completedResponses.length);

    // Count unique sessions
    const sessionIds = completedResponses
      .map(r => r.data?.sessionId)
      .filter(sid => sid);

    const uniqueSessions = new Set(sessionIds);

    console.log('Unique completed sessions:', uniqueSessions.size);

    console.log('\nAll session IDs:');
    sessionIds.forEach((sid, i) => {
      console.log(`  ${i+1}. ${sid}`);
    });

    console.log('\nUnique session IDs:');
    Array.from(uniqueSessions).forEach((sid, i) => {
      console.log(`  ${i+1}. ${sid}`);
    });
  }
})();
