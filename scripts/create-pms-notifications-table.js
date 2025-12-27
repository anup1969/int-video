const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPmsNotificationsTable() {
  console.log('Creating pms_notifications table...');

  // Create table using raw SQL via RPC or direct insert test
  // Since Supabase JS doesn't support DDL, we'll create via the dashboard
  // But we can test by inserting a record

  // First, let's try to create a test record to see if table exists
  const { data, error } = await supabase
    .from('pms_notifications')
    .select('*')
    .limit(1);

  if (error && error.code === '42P01') {
    console.log('\nTable does not exist. Please create it manually in Supabase Dashboard:');
    console.log(`
-- Run this SQL in Supabase SQL Editor:

CREATE TABLE pms_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_number VARCHAR(20) NOT NULL,
  pms_version_id VARCHAR(100),
  event VARCHAR(50) NOT NULL,
  status VARCHAR(50),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_pms_notifications_version ON pms_notifications(version_number);
CREATE INDEX idx_pms_notifications_event ON pms_notifications(event);

-- Enable RLS
ALTER TABLE pms_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for tester dashboard)
CREATE POLICY "Allow public read access" ON pms_notifications
  FOR SELECT USING (true);

-- Allow service role to insert
CREATE POLICY "Allow service role insert" ON pms_notifications
  FOR INSERT WITH CHECK (true);
    `);
    return;
  }

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Table already exists!');
  console.log('Current records:', data);
}

createPmsNotificationsTable();
