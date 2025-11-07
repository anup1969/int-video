# Campaign Scheduler Setup

The scheduler feature has been fully implemented in v1.3.0, but requires one database schema update.

## Quick Setup (2 minutes)

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste this SQL:

```sql
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;
```

6. Click "Run" (or press Ctrl+Enter)
7. Done! The scheduler is now active.

### Option 2: Using Database Password

If you have your database password:

1. Add to `.env.local`:
   ```
   SUPABASE_DB_PASSWORD=your_database_password_here
   ```

2. Run:
   ```bash
   node scripts/add-schedule-columns-direct.js
   ```

**Where to find your database password:**
- Supabase Dashboard > Project Settings > Database
- Look for "Connection String" section
- The password is shown there (you may need to reset it if you don't have it)

## What The Scheduler Does

- **Start Date/Time**: Campaign becomes active at this time
- **End Date/Time**: Campaign becomes inactive at this time
- **Timezone**: All times are displayed in IST (India Standard Time)
- **Storage**: Times stored in UTC in the database
- **Access Control**: Visitors trying to access outside the schedule see "This campaign has ended"

## How To Use

1. Open any campaign in the builder
2. Click "Settings" button in the top right
3. Set "Start Date & Time" (optional)
4. Set "End Date & Time" (optional)
5. Click "Save Settings"
6. Save the campaign

The scheduler will automatically enforce these times when visitors try to access the campaign.
