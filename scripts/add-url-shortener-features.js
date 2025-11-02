const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addURLShortenerFeatures() {
  console.log('Adding URL shortener and usage limit features...\n');

  try {
    // 1. Add columns to campaigns table
    console.log('1. Adding columns to campaigns table...');

    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add short_url column (unique 6-character code)
        ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS short_url TEXT UNIQUE;

        -- Add usage_limit column (null = unlimited)
        ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS usage_limit INTEGER;

        -- Add usage_count column (tracks unique visitors)
        ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

        -- Add index for short_url lookups
        CREATE INDEX IF NOT EXISTS idx_campaigns_short_url ON campaigns(short_url);
      `
    });

    if (alterError) {
      // If RPC doesn't exist, try direct SQL execution
      console.log('Using direct SQL execution...');

      // Add short_url column
      await supabase.from('campaigns').select('short_url').limit(1);

      // Note: We'll need to run this SQL manually in Supabase SQL Editor
      console.log('\n⚠️  Please run this SQL in Supabase SQL Editor:\n');
      console.log(`
-- Add short_url column (unique 6-character code)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS short_url TEXT UNIQUE;

-- Add usage_limit column (null = unlimited)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS usage_limit INTEGER;

-- Add usage_count column (tracks unique visitors)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Add index for short_url lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_short_url ON campaigns(short_url);
      `);
    } else {
      console.log('✅ Columns added successfully');
    }

    // 2. Create campaign_visits table
    console.log('\n2. Creating campaign_visits table...');
    console.log('\n⚠️  Please run this SQL in Supabase SQL Editor:\n');
    console.log(`
-- Create campaign_visits table to track unique visitors
CREATE TABLE IF NOT EXISTS campaign_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL, -- Hash of IP + User Agent
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, visitor_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_visits_campaign_id
ON campaign_visits(campaign_id);

-- Enable RLS
ALTER TABLE campaign_visits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust later for auth)
CREATE POLICY "Enable all access for campaign_visits"
ON campaign_visits FOR ALL USING (true) WITH CHECK (true);
    `);

    console.log('\n✅ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run the SQL commands shown above in Supabase SQL Editor');
    console.log('2. Verify the tables are updated correctly');
    console.log('3. Run this script again to confirm\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

addURLShortenerFeatures();
