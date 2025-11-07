require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCampaignSchedule() {
  const campaignId = process.argv[2];

  if (!campaignId) {
    console.log('Usage: node scripts/check-campaign-schedule.js <campaign-id>\n');
    console.log('Example: node scripts/check-campaign-schedule.js e77b9b56-c026-49e2-9dc1-cffdc3d73145\n');
    return;
  }

  console.log('🔍 Checking campaign schedule...\n');
  console.log('Campaign ID:', campaignId, '\n');

  try {
    // Fetch campaign
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name, schedule_start, schedule_end')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('❌ Error fetching campaign:', error.message);
      return;
    }

    if (!data) {
      console.error('❌ Campaign not found');
      return;
    }

    console.log('Campaign Name:', data.name);
    console.log('─────────────────────────────────────────────\n');

    // Current time
    const now = new Date();
    console.log('📅 Current Time:');
    console.log('  UTC:', now.toISOString());
    console.log('  IST:', now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    }));
    console.log();

    // Schedule start
    if (data.schedule_start) {
      const startDate = new Date(data.schedule_start);
      console.log('⏰ Schedule Start:');
      console.log('  UTC:', startDate.toISOString());
      console.log('  IST:', startDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'long'
      }));

      if (now < startDate) {
        const diffMs = startDate - now;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        console.log('  Status: ⏳ NOT STARTED YET');
        if (diffDays > 0) {
          console.log(`  Starts in: ${diffDays} days, ${diffHours % 24} hours`);
        } else if (diffHours > 0) {
          console.log(`  Starts in: ${diffHours} hours, ${diffMins % 60} minutes`);
        } else {
          console.log(`  Starts in: ${diffMins} minutes`);
        }
      } else {
        console.log('  Status: ✅ STARTED');
      }
      console.log();
    } else {
      console.log('⏰ Schedule Start: Not set (campaign always accessible)');
      console.log();
    }

    // Schedule end
    if (data.schedule_end) {
      const endDate = new Date(data.schedule_end);
      console.log('⏰ Schedule End:');
      console.log('  UTC:', endDate.toISOString());
      console.log('  IST:', endDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'long'
      }));

      if (now > endDate) {
        console.log('  Status: ❌ ENDED');
      } else {
        const diffMs = endDate - now;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        console.log('  Status: ⏳ ACTIVE');
        if (diffDays > 0) {
          console.log(`  Ends in: ${diffDays} days, ${diffHours % 24} hours`);
        } else if (diffHours > 0) {
          console.log(`  Ends in: ${diffHours} hours, ${diffMins % 60} minutes`);
        } else {
          console.log(`  Ends in: ${diffMins} minutes`);
        }
      }
      console.log();
    } else {
      console.log('⏰ Schedule End: Not set (campaign never expires)');
      console.log();
    }

    // Overall status
    console.log('─────────────────────────────────────────────');
    console.log('📊 Overall Campaign Status:');

    const notStarted = data.schedule_start && now < new Date(data.schedule_start);
    const ended = data.schedule_end && now > new Date(data.schedule_end);

    if (notStarted) {
      console.log('  🔴 CAMPAIGN NOT STARTED - Visitors will see "Campaign will start on..." message');
    } else if (ended) {
      console.log('  🔴 CAMPAIGN ENDED - Visitors will see "Campaign has ended" message');
    } else {
      console.log('  🟢 CAMPAIGN ACTIVE - Visitors can access campaign');
    }
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCampaignSchedule();
