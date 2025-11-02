-- Add columns to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS short_url TEXT UNIQUE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_campaigns_short_url ON campaigns(short_url);

-- Create campaign_visits table
CREATE TABLE IF NOT EXISTS campaign_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_visits_campaign_id ON campaign_visits(campaign_id);

-- Enable RLS
ALTER TABLE campaign_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for campaign_visits" ON campaign_visits;
CREATE POLICY "Enable all access for campaign_visits" ON campaign_visits FOR ALL USING (true) WITH CHECK (true);
