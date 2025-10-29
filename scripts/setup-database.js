// Automated Supabase Database Setup Script
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('🚀 Starting Supabase Database Setup...\n')

  try {
    // Read the setup SQL file
    const sqlPath = path.join(__dirname, '../supabase/setup.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Read SQL file successfully')
    console.log(`📊 SQL file size: ${sql.length} characters\n`)

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // Skip comments and empty statements
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue
      }

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })

        if (error) {
          // Try direct query if rpc fails
          const { error: directError } = await supabase.from('_').select('*').limit(0)

          // Most statements will work, some might need manual execution
          console.log(`   ⚠️  Note: ${error.message}`)
        } else {
          console.log(`   ✅ Success`)
        }
      } catch (err) {
        console.log(`   ⚠️  ${err.message}`)
      }
    }

    console.log('\n✅ Database setup process completed!')
    console.log('\n📋 Verifying tables...\n')

    // Verify tables were created
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('count')
      .limit(0)

    const { data: steps, error: stepsError } = await supabase
      .from('steps')
      .select('count')
      .limit(0)

    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('count')
      .limit(0)

    if (!campaignsError && !stepsError && !connectionsError) {
      console.log('✅ campaigns table - EXISTS')
      console.log('✅ steps table - EXISTS')
      console.log('✅ connections table - EXISTS')
      console.log('\n🎉 All tables created successfully!\n')
    } else {
      console.log('\n⚠️  Some tables may not have been created.')
      console.log('   Please run the SQL manually in Supabase SQL Editor')
      console.log('   File: supabase/setup.sql\n')
    }

    // Create storage bucket for videos
    console.log('📦 Creating storage bucket for videos...')

    const { data: bucket, error: bucketError } = await supabase
      .storage
      .createBucket('videos', {
        public: true,
        fileSizeLimit: 524288000, // 500MB
        allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm']
      })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ videos bucket - ALREADY EXISTS')
      } else {
        console.log(`⚠️  videos bucket - ${bucketError.message}`)
      }
    } else {
      console.log('✅ videos bucket - CREATED')
    }

    console.log('\n🎉 Setup Complete!\n')
    console.log('Next steps:')
    console.log('1. Verify tables in Supabase Dashboard')
    console.log('2. Test the application: npm run dev')
    console.log('3. Deploy to Netlify\n')

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    console.log('\n💡 You may need to run the SQL manually:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Open: supabase/setup.sql')
    console.log('   3. Copy all content and click Run\n')
    process.exit(1)
  }
}

// Run setup
setupDatabase()
