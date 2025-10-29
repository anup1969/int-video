// Manual Database Setup using HTTP API
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function setupDatabase() {
  console.log('🚀 Setting up database via Supabase HTTP API...\n')

  const sqlPath = path.join(__dirname, '../supabase/setup.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    })

    const result = await response.json()
    console.log('Response:', result)

    if (response.ok) {
      console.log('✅ Database setup successful!')
    } else {
      console.log('⚠️  Could not set up automatically')
      console.log('\n📋 Please follow these steps manually:')
      console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk')
      console.log('2. Click "SQL Editor" in the left sidebar')
      console.log('3. Click "New query"')
      console.log('4. Copy all content from: supabase/setup.sql')
      console.log('5. Paste and click "Run"')
      console.log('6. Takes ~10 seconds to complete\n')
    }
  } catch (error) {
    console.log('⚠️  Automatic setup not available')
    console.log('\n📋 Please follow these manual steps (5 minutes):')
    console.log('1. Open: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/editor')
    console.log('2. Click "SQL Editor"')
    console.log('3. Click "New query"')
    console.log('4. Open file: supabase/setup.sql')
    console.log('5. Copy ALL content')
    console.log('6. Paste in SQL Editor')
    console.log('7. Click "Run" button')
    console.log('8. Wait for success message\n')
    console.log('✅ Then continue with the rest of the setup!')
  }
}

setupDatabase()
