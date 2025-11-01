-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  settings JSONB DEFAULT '{}',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create steps table (if you want to store steps separately)
CREATE TABLE IF NOT EXISTS steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  label TEXT NOT NULL,
  answer_type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connections table (if you want to store connections separately)
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  from_step UUID NOT NULL,
  to_step UUID NOT NULL,
  connection_type TEXT DEFAULT 'logic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create responses table (for storing campaign responses)
CREATE TABLE IF NOT EXISTS responses (
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

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- Allow public to read all campaigns
CREATE POLICY IF NOT EXISTS "Allow public read campaigns" ON campaigns FOR SELECT TO public USING (true);

-- Allow public to create campaigns
CREATE POLICY IF NOT EXISTS "Allow public insert campaigns" ON campaigns FOR INSERT TO public WITH CHECK (true);

-- Allow public to update campaigns
CREATE POLICY IF NOT EXISTS "Allow public update campaigns" ON campaigns FOR UPDATE TO public USING (true);

-- Allow public to delete campaigns
CREATE POLICY IF NOT EXISTS "Allow public delete campaigns" ON campaigns FOR DELETE TO public USING (true);

-- Similar policies for steps
CREATE POLICY IF NOT EXISTS "Allow public read steps" ON steps FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Allow public insert steps" ON steps FOR INSERT TO public WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public update steps" ON steps FOR UPDATE TO public USING (true);
CREATE POLICY IF NOT EXISTS "Allow public delete steps" ON steps FOR DELETE TO public USING (true);

-- Similar policies for connections
CREATE POLICY IF NOT EXISTS "Allow public read connections" ON connections FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Allow public insert connections" ON connections FOR INSERT TO public WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public update connections" ON connections FOR UPDATE TO public USING (true);
CREATE POLICY IF NOT EXISTS "Allow public delete connections" ON connections FOR DELETE TO public USING (true);

-- Similar policies for responses
CREATE POLICY IF NOT EXISTS "Allow public read responses" ON responses FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Allow public insert responses" ON responses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public update responses" ON responses FOR UPDATE TO public USING (true);
CREATE POLICY IF NOT EXISTS "Allow public delete responses" ON responses FOR DELETE TO public USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_steps_campaign_id ON steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_connections_campaign_id ON connections(campaign_id);
CREATE INDEX IF NOT EXISTS idx_responses_campaign_id ON responses(campaign_id);
