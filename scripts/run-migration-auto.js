const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  console.log('Running database migration automatically...\n');

  const https = require('https');
  const url = require('url');

  const SQL = `
-- Step 1: Add columns to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS short_url TEXT UNIQUE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_campaigns_short_url ON campaigns(short_url);

-- Step 2: Create campaign_visits table
CREATE TABLE IF NOT EXISTS campaign_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_visits_campaign_id ON campaign_visits(campaign_id);

-- Step 3: Enable RLS and add policy
ALTER TABLE campaign_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for campaign_visits" ON campaign_visits;
CREATE POLICY "Enable all access for campaign_visits" ON campaign_visits FOR ALL USING (true) WITH CHECK (true);
  `.trim();

  const parsedUrl = url.parse(supabaseUrl);
  const projectRef = parsedUrl.hostname.split('.')[0];

  const options = {
    hostname: parsedUrl.hostname,
    path: `/rest/v1/rpc/exec_sql`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  };

  const data = JSON.stringify({ sql: SQL });

  const req = https.request(options, (res) => {
    let body = '';

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ Migration completed successfully!');
      } else {
        console.log(`⚠️  Response status: ${res.statusCode}`);
        console.log('Response:', body);
        console.log('\nPlease run the SQL manually:');
        console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
        console.log('2. Copy and paste this SQL:\n');
        console.log(SQL);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error.message);
    console.log('\nPlease run the SQL manually in Supabase SQL Editor:');
    console.log(SQL);
  });

  req.write(data);
  req.end();
}

runMigration();
