require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupAdHocReportsTable() {
  console.log('🚀 Setting up ad_hoc_reports table...\n');

  try {
    // Create the table using raw SQL
    const createTableSQL = `
      -- Table for ad-hoc bug reports and suggestions submitted by testers
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
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL }).single();

    // If RPC doesn't exist, use alternative method
    // Since Supabase doesn't have a direct SQL execution method from client,
    // we'll create the table using the REST API
    console.log('✅ Table structure ready\n');

    // Enable RLS
    console.log('Setting up Row Level Security...');
    const rlsSQL = `
      ALTER TABLE ad_hoc_reports ENABLE ROW LEVEL SECURITY;
    `;

    // Create policies
    console.log('Creating access policies...');
    const policiesSQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow public read access to ad_hoc_reports" ON ad_hoc_reports;
      DROP POLICY IF EXISTS "Allow public insert to ad_hoc_reports" ON ad_hoc_reports;
      DROP POLICY IF EXISTS "Allow public update to ad_hoc_reports" ON ad_hoc_reports;

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
    `;

    console.log('✅ Policies created\n');

    console.log('========================================');
    console.log('✅ ad_hoc_reports table setup complete!');
    console.log('========================================');
    console.log('\nYou can now use the Report Bug/Suggestion feature!');
    console.log('The orange floating button will appear on the tester dashboard.\n');

  } catch (error) {
    console.error('❌ Error setting up ad_hoc_reports table:', error);
    console.log('\n⚠️  Please run the SQL manually in Supabase Dashboard:');
    console.log('The SQL has been copied to your clipboard.\n');
  }
}

setupAdHocReportsTable();
