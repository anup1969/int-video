-- Table for ad-hoc bug reports and suggestions submitted by testers
-- These are issues discovered during testing that aren't covered by predefined test cases

CREATE TABLE IF NOT EXISTS ad_hoc_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('bug', 'suggestion', 'improvement')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  steps_to_reproduce TEXT,
  tester_name TEXT NOT NULL,
  browser TEXT,
  device TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
  developer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_adhoc_reports_version ON ad_hoc_reports(version_id);
CREATE INDEX IF NOT EXISTS idx_adhoc_reports_status ON ad_hoc_reports(status);
CREATE INDEX IF NOT EXISTS idx_adhoc_reports_type ON ad_hoc_reports(report_type);

-- Enable RLS (Row Level Security)
ALTER TABLE ad_hoc_reports ENABLE ROW LEVEL SECURITY;

-- Allow public to read all reports
CREATE POLICY "Allow public read access to ad_hoc_reports"
ON ad_hoc_reports FOR SELECT TO public
USING (true);

-- Allow public to insert reports
CREATE POLICY "Allow public insert to ad_hoc_reports"
ON ad_hoc_reports FOR INSERT TO public
WITH CHECK (true);

-- Allow public to update reports (for developer notes, status updates)
CREATE POLICY "Allow public update to ad_hoc_reports"
ON ad_hoc_reports FOR UPDATE TO public
USING (true);

COMMENT ON TABLE ad_hoc_reports IS 'Stores ad-hoc bug reports and suggestions submitted by testers during QA testing';
COMMENT ON COLUMN ad_hoc_reports.report_type IS 'Type of report: bug, suggestion, or improvement';
COMMENT ON COLUMN ad_hoc_reports.severity IS 'Severity level for bugs: critical, high, medium, low';
COMMENT ON COLUMN ad_hoc_reports.screenshots IS 'Array of screenshot URLs from Supabase Storage';
COMMENT ON COLUMN ad_hoc_reports.status IS 'Current status: open, in_progress, resolved, wont_fix';
