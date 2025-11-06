-- Tester Dashboard Tables

-- Versions table: Track all versions/releases
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number TEXT NOT NULL UNIQUE, -- e.g., "1.5.0", "1.6.0-beta"
  release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'testing', -- testing, stable, deprecated
  title TEXT NOT NULL, -- e.g., "Password Protection Feature"
  description TEXT, -- High-level description
  changelog JSONB DEFAULT '[]'::jsonb, -- Array of changes: [{type: 'feature', description: '...'}]
  known_issues JSONB DEFAULT '[]'::jsonb, -- Array of known issues
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Cases table: Define test scenarios for each version
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL, -- Array of steps: [{step: 1, action: '...', expected: '...'}]
  priority TEXT DEFAULT 'medium', -- critical, high, medium, low
  category TEXT, -- e.g., 'authentication', 'campaign-builder', 'responses'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Reports table: Store test results submitted by testers
CREATE TABLE IF NOT EXISTS test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  tester_name TEXT NOT NULL,
  status TEXT NOT NULL, -- pass, fail, blocked, skip
  notes TEXT, -- Tester's notes
  bug_description TEXT, -- If failed, describe the bug
  severity TEXT, -- critical, high, medium, low
  screenshots JSONB DEFAULT '[]'::jsonb, -- Array of screenshot URLs
  browser TEXT, -- Browser used for testing
  device TEXT, -- Device used for testing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_versions_status ON versions(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_version ON test_cases(version_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);
CREATE INDEX IF NOT EXISTS idx_test_reports_version ON test_reports(version_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_status ON test_reports(status);
CREATE INDEX IF NOT EXISTS idx_test_reports_created ON test_reports(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;

-- Public access policies (since we want this open)
CREATE POLICY "Allow public read access to versions" ON versions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to versions" ON versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to versions" ON versions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to versions" ON versions FOR DELETE USING (true);

CREATE POLICY "Allow public read access to test_cases" ON test_cases FOR SELECT USING (true);
CREATE POLICY "Allow public insert to test_cases" ON test_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to test_cases" ON test_cases FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to test_cases" ON test_cases FOR DELETE USING (true);

CREATE POLICY "Allow public read access to test_reports" ON test_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert to test_reports" ON test_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to test_reports" ON test_reports FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to test_reports" ON test_reports FOR DELETE USING (true);
