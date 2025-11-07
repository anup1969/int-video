// Script to create storage policies via Supabase Management API
require('dotenv').config({ path: '.env.local' });
const https = require('https');

// Extract project ref from URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];

console.log('🔒 Creating Storage Policies Programmatically\n');
console.log('=' .repeat(60) + '\n');
console.log(`Project: ${PROJECT_REF}\n`);

// SQL to create policies
const policySQL = `
-- Enable RLS if not already enabled
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "anon insert" ON storage.objects;

-- Campaign-files bucket policies
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'campaign-files');

CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'campaign-files');

-- Videos bucket policies
CREATE POLICY "Allow anonymous uploads videos"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public read access videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Also allow authenticated users (belt and suspenders)
CREATE POLICY "Allow authenticated uploads campaign-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-files');

CREATE POLICY "Allow authenticated uploads videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');
`;

// Function to execute SQL via Supabase REST API
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, data: body });
        } else {
          resolve({ success: false, error: body, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Try using PostgreSQL client instead
async function createPoliciesWithPG() {
  const { Client } = require('pg');

  // Parse connection string from Supabase URL
  const connectionString = `postgresql://postgres.${PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  console.log('Attempting to connect with PostgreSQL client...\n');

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const result = await client.query(policySQL);
    console.log('✅ Policies created successfully!\n');
    console.log(result);

    await client.end();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Attempting to create storage policies...\n');

  // Try PostgreSQL client method
  const pgSuccess = await createPoliciesWithPG();

  if (pgSuccess) {
    console.log('\n' + '=' .repeat(60));
    console.log('✅ SUCCESS! Storage policies have been created.\n');
    console.log('You can now upload videos without RLS errors!\n');
    return;
  }

  console.log('\n' + '=' .repeat(60));
  console.log('⚠️  Could not create policies programmatically.\n');
  console.log('Please follow the manual instructions provided earlier.\n');
}

main().catch(console.error);
