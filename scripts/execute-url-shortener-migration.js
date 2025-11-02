const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  console.log('Executing URL shortener database migration...\n');

  try {
    // Step 1: Add columns to campaigns table
    console.log('Step 1: Adding columns to campaigns table...');

    const sqls = [
      `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS short_url TEXT UNIQUE`,
      `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS usage_limit INTEGER`,
      `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0`,
      `CREATE INDEX IF NOT EXISTS idx_campaigns_short_url ON campaigns(short_url)`
    ];

    for (const sql of sqls) {
      const { error } = await supabase.rpc('execute_sql', { query: sql });
      if (error && !error.message.includes('already exists')) {
        console.log(`  ⚠️  ${sql.substring(0, 50)}... - ${error.message}`);
      }
    }

    // Step 2: Create campaign_visits table
    console.log('\nStep 2: Creating campaign_visits table...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS campaign_visits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        visitor_id TEXT NOT NULL,
        visited_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(campaign_id, visitor_id)
      )
    `;

    const { error: createError } = await supabase.rpc('execute_sql', { query: createTableSQL });
    if (createError && !createError.message.includes('already exists')) {
      console.log(`  ⚠️  ${createError.message}`);
    }

    console.log('\n✅ Migration attempted!');
    console.log('\nIf you see errors above, please run the following SQL manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/sql/new\n');
    console.log('========== COPY AND RUN THIS SQL ==========\n');
    console.log(`
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
    `);
    console.log('\n========== END OF SQL ==========\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

executeMigration();
