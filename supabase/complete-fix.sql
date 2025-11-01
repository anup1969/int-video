-- First, drop the campaigns table if it exists with wrong schema
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS steps CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS responses CASCADE;

-- Recreate campaigns table with correct schema (NO user_id column)
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  settings JSONB DEFAULT '{}',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create steps table
CREATE TABLE steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  label TEXT NOT NULL,
  answer_type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connections table
CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  from_step UUID NOT NULL,
  to_step UUID NOT NULL,
  connection_type TEXT DEFAULT 'logic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create responses table
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_name TEXT,
  email TEXT,
  completed BOOLEAN DEFAULT false,
  duration INTEGER,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- DISABLE RLS for now (we can enable it later with proper policies)
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX idx_steps_campaign_id ON steps(campaign_id);
CREATE INDEX idx_connections_campaign_id ON connections(campaign_id);
CREATE INDEX idx_responses_campaign_id ON responses(campaign_id);
