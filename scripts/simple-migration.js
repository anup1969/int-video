const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Running database migration...\n');

  // Test connection first
  console.log('Testing connection...');
  const { data: testData, error: testError } = await supabase
    .from('campaigns')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Connection failed:', testError.message);
    return;
  }

  console.log('✅ Connection successful\n');

  // Check if columns exist
  console.log('Checking existing schema...');
  const { data: existingCampaign } = await supabase
    .from('campaigns')
    .select('*')
    .limit(1)
    .single();

  if (existingCampaign) {
    console.log('Existing columns:', Object.keys(existingCampaign));

    const hasShortUrl = 'short_url' in existingCampaign;
    const hasUsageLimit = 'usage_limit' in existingCampaign;
    const hasUsageCount = 'usage_count' in existingCampaign;

    if (hasShortUrl && hasUsageLimit && hasUsageCount) {
      console.log('✅ All columns already exist!\n');
    } else {
      console.log(`\n❌ Missing columns:`);
      if (!hasShortUrl) console.log('  - short_url');
      if (!hasUsageLimit) console.log('  - usage_limit');
      if (!hasUsageCount) console.log('  - usage_count');
    }
  }

  // Check if campaign_visits table exists
  console.log('\nChecking campaign_visits table...');
  const { data: visitsData, error: visitsError } = await supabase
    .from('campaign_visits')
    .select('id')
    .limit(1);

  if (visitsError) {
    if (visitsError.message.includes('does not exist')) {
      console.log('❌ campaign_visits table does not exist');
    } else {
      console.log('Error:', visitsError.message);
    }
  } else {
    console.log('✅ campaign_visits table exists');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 PLEASE RUN THIS SQL IN SUPABASE SQL EDITOR');
  console.log('='.repeat(60));
  console.log('\n1. Go to: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/sql/new');
  console.log('2. Copy and paste the SQL below:\n');
  console.log('-- Add columns to campaigns table');
  console.log('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS short_url TEXT UNIQUE;');
  console.log('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS usage_limit INTEGER;');
  console.log('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;');
  console.log('CREATE INDEX IF NOT EXISTS idx_campaigns_short_url ON campaigns(short_url);');
  console.log('');
  console.log('-- Create campaign_visits table');
  console.log('CREATE TABLE IF NOT EXISTS campaign_visits (');
  console.log('  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),');
  console.log('  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,');
  console.log('  visitor_id TEXT NOT NULL,');
  console.log('  visited_at TIMESTAMPTZ DEFAULT NOW(),');
  console.log('  UNIQUE(campaign_id, visitor_id)');
  console.log(');');
  console.log('');
  console.log('CREATE INDEX IF NOT EXISTS idx_campaign_visits_campaign_id ON campaign_visits(campaign_id);');
  console.log('');
  console.log('-- Enable RLS');
  console.log('ALTER TABLE campaign_visits ENABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('DROP POLICY IF EXISTS "Enable all access for campaign_visits" ON campaign_visits;');
  console.log('CREATE POLICY "Enable all access for campaign_visits" ON campaign_visits FOR ALL USING (true) WITH CHECK (true);');
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('3. Click "RUN" button');
  console.log('4. Run this script again to verify\n');
}

runMigration();
