# 🗄️ Database Setup Guide - Supabase

## 📋 Prerequisites

1. **Supabase Account**: Already set up
2. **Project URL**: `https://uwzzdxroqqynmqkmwlpk.supabase.co`
3. **Anon Key**: (provided in project instructions)
4. **Service Role Key**: (optional for now, will need later)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: `uwzzdxroqqynmqkmwlpk`
3. Click on **SQL Editor** in left sidebar

### Step 2: Run Database Setup

**Option A: Run Complete Setup File (Recommended)**

1. In SQL Editor, click **"New query"**
2. Open the file: `supabase/setup.sql` from your project
3. Copy ALL contents
4. Paste into Supabase SQL Editor
5. Click **"Run"** button
6. Wait for success message

**Option B: Run Migrations Individually**

Run these files in order:
1. `supabase/migrations/001_create_campaigns_table.sql`
2. `supabase/migrations/002_create_steps_table.sql`
3. `supabase/migrations/003_create_connections_table.sql`

### Step 3: Verify Tables Created

1. Click **"Table Editor"** in left sidebar
2. You should see 3 tables:
   - ✅ `campaigns`
   - ✅ `steps`
   - ✅ `connections`

---

## 🔑 Get Your API Keys

### 1. Get Anon Key (Already Have)

1. Go to **Project Settings** → **API**
2. Find **Project API keys**
3. Copy **anon** / **public** key

### 2. Get Service Role Key (Optional - For Later)

1. Same location as above
2. Copy **service_role** / **secret** key
3. **⚠️ IMPORTANT**: Never commit this to Git!

---

## ⚙️ Configure Environment Variables

### Step 1: Create .env.local File

In your project root, create `.env.local`:

```bash
cd C:\Users\PCS\code\int-video
```

Create file `.env.local` with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://uwzzdxroqqynmqkmwlpk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional - for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Replace `your_anon_key_here` with your actual anon key!**

### Step 2: Add to Netlify (For Production)

1. Go to Netlify Dashboard → Your Site
2. **Site settings** → **Environment variables**
3. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://uwzzdxroqqynmqkmwlpk.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)

---

## 🧪 Test Database Connection

### Test 1: Check Tables in Supabase

1. Go to **Table Editor**
2. Click on `campaigns` table
3. Should see empty table with columns:
   - id
   - name
   - status
   - settings
   - created_at
   - updated_at

### Test 2: Insert Test Data

Run this in SQL Editor:

```sql
-- Insert test campaign
INSERT INTO public.campaigns (name, status)
VALUES ('Test Campaign', 'draft');

-- Verify it was inserted
SELECT * FROM public.campaigns;
```

You should see your test campaign!

### Test 3: Test API Routes (After Deployment)

Once your app is running, test these endpoints:

```bash
# Get all campaigns
curl http://localhost:3000/api/campaigns

# Create new campaign
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name": "My First Campaign"}'
```

---

## 📊 Database Schema Reference

### Table: `campaigns`

Stores campaign information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| name | TEXT | Campaign name |
| status | TEXT | 'draft', 'active', 'paused', 'archived' |
| settings | JSONB | Campaign settings (JSON) |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

### Table: `steps`

Stores video steps within campaigns.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| campaign_id | UUID | Foreign key to campaigns |
| step_number | INTEGER | Step order number |
| label | TEXT | Step name |
| position | JSONB | {x, y} coordinates on canvas |
| answer_type | TEXT | Type of answer (7 types) |
| video_url | TEXT | URL to video file |
| video_thumbnail | TEXT | Thumbnail image URL |
| video_placeholder | TEXT | Emoji placeholder |
| mc_options | JSONB | Multiple choice options (array) |
| button_options | JSONB | Button options (array) |
| enabled_response_types | JSONB | {video, audio, text} |
| show_contact_form | BOOLEAN | Show contact form? |
| contact_form_fields | JSONB | Form fields configuration |
| logic_rules | JSONB | Branching logic rules |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

### Table: `connections`

Stores visual connections between steps.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| campaign_id | UUID | Foreign key to campaigns |
| from_step_id | TEXT | Source step (can be 'start') |
| to_step_id | UUID | Target step ID |
| connection_type | TEXT | 'default' or 'logic' |
| created_at | TIMESTAMP | Auto-generated |

---

## 🔒 Row Level Security (RLS)

### Current Setup: Public Access

**For Phase 1 (Testing):**
- All tables allow public read/write access
- This is for testing only!
- No authentication required

### Future Setup: User-Based Access (Phase 3)

When we add authentication:

```sql
-- Example: Only allow users to access their own campaigns
CREATE POLICY "Users can only access their own campaigns"
    ON public.campaigns
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## 📡 API Routes Created

### Campaigns API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | Get all campaigns |
| POST | `/api/campaigns` | Create new campaign |
| GET | `/api/campaigns/[id]` | Get campaign with steps |
| PUT | `/api/campaigns/[id]` | Update campaign |
| DELETE | `/api/campaigns/[id]` | Delete campaign |
| POST | `/api/campaigns/[id]/save` | Save entire campaign state |

### Usage Examples

**Create Campaign:**
```javascript
const response = await fetch('/api/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'My Campaign' })
})
const { campaign } = await response.json()
```

**Get Campaign:**
```javascript
const response = await fetch(`/api/campaigns/${campaignId}`)
const { campaign, steps, connections } = await response.json()
```

**Save Campaign:**
```javascript
const response = await fetch(`/api/campaigns/${campaignId}/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nodes, connections, settings })
})
```

---

## 🐛 Troubleshooting

### Issue: "relation does not exist"

**Solution:** Tables not created. Re-run `setup.sql`

### Issue: "permission denied for table"

**Solution:** Check RLS policies are set correctly

### Issue: "invalid API key"

**Solution:**
1. Verify .env.local has correct keys
2. Restart development server: `npm run dev`
3. Check keys in Supabase dashboard

### Issue: API routes return 500 error

**Solution:**
1. Check Supabase credentials in .env.local
2. Check browser console for errors
3. Check Network tab in dev tools

---

## ✅ Setup Checklist

- [ ] Ran `setup.sql` in Supabase SQL Editor
- [ ] Verified 3 tables created in Table Editor
- [ ] Created `.env.local` with Supabase credentials
- [ ] Installed `@supabase/supabase-js` package
- [ ] Tested database connection
- [ ] Added environment variables to Netlify (for production)
- [ ] Tested API routes locally

---

## 🎯 Next Steps

After database is set up:

1. **Integrate with Flow Builder** - Connect save/load functionality
2. **Test locally** - Create, save, and load campaigns
3. **Deploy to Netlify** - Test in production
4. **Add video upload** - Implement Supabase Storage for videos
5. **Add authentication** - Implement user login (Phase 3)

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

**Last Updated:** October 29, 2025
