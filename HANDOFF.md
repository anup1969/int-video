# 🔄 Developer Handoff Document

**Project:** Interactive Video Campaign Platform
**Version:** 2.0.0
**Last Updated:** November 2, 2025
**Production URL:** https://int-video.vercel.app
**Repository:** https://github.com/anup1969/int-video

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Schema Details](#database-schema-details)
4. [Key Implementation Patterns](#key-implementation-patterns)
5. [Important Code Locations](#important-code-locations)
6. [Common Gotchas & Solutions](#common-gotchas--solutions)
7. [Development Workflow](#development-workflow)
8. [Deployment Process](#deployment-process)
9. [Testing & Debugging](#testing--debugging)
10. [Future Considerations](#future-considerations)

---

## 🎯 Project Overview

### What This Application Does

This is a VideoAsk-style interactive video campaign platform where users can:
- **Create campaigns** with visual flow builder (drag-and-drop canvas)
- **Upload videos** or create text slides
- **Configure answer types** (MCQ, open-ended, contact forms, buttons)
- **Set up logic branching** based on user responses
- **Share campaign URLs** with participants
- **View responses** in table or list format (Google Forms-style)

### User Journey

1. **Dashboard** → View all campaigns, create new, manage existing
2. **Campaign Builder** (`/pages/index.js`) → Create/edit campaign flow
3. **Campaign Viewer** (`/pages/campaign/[id].js`) → End-user fills out campaign
4. **Response Analytics** (`/pages/responses/[id].js`) → View submitted responses

---

## 🏗️ Architecture & Tech Stack

### Frontend Framework
- **Next.js 14** (Pages Router, NOT App Router)
- **React 18** with Hooks (useState, useEffect, useRef)
- **Tailwind CSS** for styling
- **Font Awesome** for icons
- **React Flow** for visual canvas

### Backend
- **Next.js API Routes** (`/pages/api`)
- **Supabase PostgreSQL** for database
- **Supabase Storage** for video files

### Deployment
- **Vercel** (Production)
- **GitHub** for version control

### Key Dependencies
```json
{
  "next": "14.x",
  "react": "18.x",
  "@supabase/supabase-js": "^2.x",
  "reactflow": "^11.x",
  "tailwindcss": "^3.x"
}
```

---

## 🗄️ Database Schema Details

### Table: `campaigns`
Stores campaign metadata and structure.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'archived'
  settings JSONB DEFAULT '{}',
  data JSONB DEFAULT '{}', -- Contains nodes and connections
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Important Fields:**
- `data.nodes` - Array of step configurations
- `data.edges` - Array of connections between steps
- `settings` - Campaign-level settings (future use)

### Table: `steps`
Stores individual steps/slides in campaigns.

```sql
CREATE TABLE steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  label TEXT,
  answer_type TEXT, -- 'multiple-choice', 'open-ended', 'button', 'contact-form'
  data JSONB DEFAULT '{}', -- Full node configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Important Fields in `data` JSONB:**
- `slideType` - 'video' or 'text'
- `videoUrl` - Supabase Storage URL for video
- `mcOptions` - Array of multiple-choice options
- `buttonDelay` - Seconds before buttons appear
- `logicRules` - Array of conditional branching rules

### Table: `connections`
Stores flow connections between steps.

```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  from_step UUID, -- NULL for start node
  to_step UUID NOT NULL,
  connection_type TEXT DEFAULT 'next',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `responses`
Stores end-user submissions.

```sql
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_name TEXT,
  email TEXT,
  completed BOOLEAN DEFAULT FALSE,
  duration INTEGER, -- seconds
  data JSONB DEFAULT '{}', -- Full response payload
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Critical Fields in `data` JSONB:**
- `sessionId` - Unique session identifier (UUID)
- `steps` - Array of step responses with:
  - `stepId` - Step UUID
  - `stepNumber` - Step number
  - `answerType` - Type of answer
  - `slideType` - 'video' or 'text'
  - `answerData` - User's answer
  - `deviceType` - 'mobile' or 'desktop'

**⚠️ CRITICAL:** `sessionId` is stored inside `data.sessionId`, NOT as a separate column!

---

## 🔑 Key Implementation Patterns

### 1. JSONB Data Access Pattern

When accessing nested JSONB data in Supabase:

```javascript
// ❌ WRONG - This will fail
const { data } = await supabase
  .from('responses')
  .select('session_id') // Column doesn't exist!

// ✅ CORRECT - Access nested field
const { data } = await supabase
  .from('responses')
  .select('id, data')

// Extract sessionId from JSONB
const sessionIds = data?.map(r => r.data?.sessionId)
```

### 2. Response Counting Logic

**Dashboard vs Responses Page:**
- Dashboard: Shows **ALL** responses (completed + incomplete)
- Responses Page: Shows **ALL** responses with filter option

```javascript
// Count ALL responses for a campaign
const { data: responses } = await supabase
  .from('responses')
  .select('id')
  .eq('campaign_id', campaign.id)

const count = responses?.length || 0
```

### 3. Campaign Viewer Response Submission

When saving responses, ALWAYS include:
- `sessionId` (persistent across page reloads)
- `slideType` (for display in response details)
- `answerType` (MCQ, open-ended, etc.)
- `deviceType` (mobile/desktop)

```javascript
const responsePayload = {
  sessionId: sessionId.current,
  stepId: currentStep.id,
  stepNumber: currentStep.stepNumber,
  answerType: currentStep.answerType,
  slideType: currentStep.slideType || 'video',
  answerData: answerData,
  completed: isCompleted,
  duration: duration,
  deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
  userAgent: navigator.userAgent
};
```

### 4. Dynamic Table Rendering

The spreadsheet view dynamically creates columns based on campaign questions:

```javascript
// Get column headers from first response
{filteredResponses[0]?.responses.map((resp, idx) => {
  const slideIcon = resp.slideType === 'text' ? '📄' : '🎬';

  return (
    <th key={idx}>
      <div>Step {resp.step}</div>
      <div>{slideIcon} {answerTypeLabel}</div>
    </th>
  );
})}
```

### 5. Sticky Column Pattern

First column stays visible during horizontal scroll:

```css
/* In Tailwind */
className="sticky left-0 bg-white z-10"
```

---

## 📍 Important Code Locations

### Campaign Builder (`/pages/index.js`)
- **Lines 1-100**: State management and initialization
- **Lines 150-250**: Node/edge manipulation functions
- **Lines 300-400**: Save campaign logic
- **Lines 500-700**: Canvas rendering
- **Lines 800-1000**: Node configuration panel

### Campaign Viewer (`/pages/campaign/[id].js`)
- **Lines 1-150**: State initialization and session management
- **Lines 194-210**: Response payload creation (**CRITICAL** - includes slideType)
- **Lines 300-400**: Answer submission logic
- **Lines 500-600**: Video/text slide rendering
- **Lines 700-800**: Button delay logic

### Dashboard (`/pages/dashboard.js`)
- **Lines 1-100**: State and data fetching
- **Lines 200-300**: Campaign CRUD operations
- **Lines 403-450**: List view with action buttons
- **Lines 467-514**: Grid view with action buttons
- **Lines 600-700**: Campaign card component

### Response Analytics (`/pages/responses/[id].js`)
- **Lines 1-100**: Data fetching and state
- **Lines 55-60**: Extract slideType from response data
- **Lines 267-291**: View toggle (Table/List)
- **Lines 318-378**: Spreadsheet table view
- **Lines 380-410**: List view
- **Lines 414-447**: Response details modal with slide type display

### API Routes

**`/pages/api/campaigns/index.js`**
- GET: List all campaigns with response counts
- POST: Create new campaign
- **Lines 28-45**: Response counting logic (**CRITICAL**)

**`/pages/api/campaigns/[id]/index.js`**
- GET: Fetch campaign details
- PUT: Update campaign
- DELETE: Delete campaign and cascading data

**`/pages/api/campaigns/[id]/save.js`**
- POST: Save complete campaign structure (nodes + connections)

**`/pages/api/campaigns/[id]/responses.js`**
- GET: Fetch all responses for campaign
- POST: Submit/update response

**`/pages/api/upload/video.js`**
- POST: Upload video to Supabase Storage

---

## ⚠️ Common Gotchas & Solutions

### 1. Response Count Shows 0
**Problem:** Dashboard cards show 0 responses even though responses exist.

**Root Cause:** Trying to access `sessionId` as a column instead of JSONB field.

**Solution:**
```javascript
// Access data.sessionId from JSONB
const { data: responses } = await supabase
  .from('responses')
  .select('id, data')
  .eq('campaign_id', campaign.id)
```

**File:** `pages/api/campaigns/index.js:28-45`

### 2. Dashboard Count ≠ Responses Page Count
**Problem:** Numbers don't match between dashboard and responses page.

**Root Cause:** Dashboard was counting unique completed sessions, responses page shows all.

**Solution:** Count ALL responses (not filtering by completed status).

**File:** `pages/api/campaigns/index.js:33-37`

### 3. Slide Type Not Showing in Response Details
**Problem:** Response details don't show whether it was a video or text slide.

**Root Cause:** `slideType` wasn't being saved in response payload.

**Solution:** Add `slideType` field when saving responses.

**File:** `pages/campaign/[id].js:199`

### 4. Video Not Playing on Mobile
**Problem:** Videos don't autoplay on mobile devices.

**Root Cause:** Mobile browsers block autoplay without user interaction.

**Solution:** Add unmute button and require user tap to start video.

**File:** `pages/campaign/[id].js` - Unmute button implementation

### 5. Button Delay Not Working
**Problem:** Buttons appear immediately instead of after delay.

**Root Cause:** `buttonDelay` not properly read from node data.

**Solution:** Check `currentStep.buttonDelay` and use `setTimeout`.

**File:** `pages/campaign/[id].js:550-570`

### 6. Campaign Not Saving
**Problem:** Save campaign returns success but data isn't persisted.

**Root Cause:** Database RLS (Row Level Security) policies blocking writes.

**Solution:** Check Supabase RLS policies:
```sql
-- Allow all operations (temporary - add auth later)
CREATE POLICY "Enable all access for campaigns" ON campaigns
  FOR ALL USING (true) WITH CHECK (true);
```

**Debug Script:** `scripts/setup-database.js`

### 7. Video Upload Fails
**Problem:** Video upload returns 413 error or times out.

**Root Cause:** File too large or storage bucket policy issues.

**Solution:**
- Check file size < 50MB
- Verify Supabase Storage bucket exists
- Check storage policies allow public read

**Debug Script:** `scripts/create-storage-bucket.js`

### 8. Duplicate "Video Slide" Text
**Problem:** Response details show slide type twice.

**Root Cause:** Showing both slide type badge and answer type with slide label.

**Solution:** Combine into single badge: `🎬 Video Slide (MCQ)`

**File:** `pages/responses/[id].js:414-447`

---

## 🔄 Development Workflow

### Local Development Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/anup1969/int-video.git
   cd int-video
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with Supabase credentials
   ```

4. **Database setup:**
   ```bash
   node scripts/setup-database.js
   node scripts/create-storage-bucket.js
   ```

5. **Run development server:**
   ```bash
   npm run dev
   # Opens on http://localhost:3000
   ```

### Making Changes

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test locally**

3. **Build to verify:**
   ```bash
   npm run build
   # Verify no errors
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

5. **Push to GitHub:**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## 🚀 Deployment Process

### Vercel Deployment (Current Production)

**Initial Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

**Deploy to Production:**
```bash
# 1. Commit and push changes to GitHub
git add .
git commit -m "Your commit message"
git push origin main

# 2. Deploy to Vercel
vercel --prod

# 3. Set custom alias (if needed)
vercel alias <deployment-url> int-video.vercel.app
```

**Environment Variables:**
Set these in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Vercel Dashboard:** https://vercel.com/dashboard

### Deployment Checklist

- [ ] All tests pass locally
- [ ] `npm run build` succeeds without errors
- [ ] Environment variables set in Vercel
- [ ] Database migrations run (if any)
- [ ] Storage buckets exist in Supabase
- [ ] RLS policies configured correctly
- [ ] Verify deployment URL works
- [ ] Test critical user flows

---

## 🧪 Testing & Debugging

### Debug Scripts

**Check Campaign Structure:**
```bash
node scripts/check-campaign.js
```

**Check Responses:**
```bash
node scripts/check-responses.js
```

**Test Delete Button:**
```bash
node scripts/test-delete-button.js
```

### Browser Console Debugging

Add version logging to verify latest code is loaded:
```javascript
console.log('Dashboard version: 2.0.0 - All buttons outside');
```

### Common Debug Commands

```bash
# Check Supabase connection
node -e "const {createClient}=require('@supabase/supabase-js');require('dotenv').config({path:'.env.local'});const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);s.from('campaigns').select('count').then(r=>console.log(r))"

# Check database tables
node scripts/check-campaign.js

# View build output
npm run build

# Check for TypeScript errors (if using TS)
npx tsc --noEmit
```

### Testing User Flows

1. **Campaign Creation Flow:**
   - Create new campaign → Add video slide → Add text slide → Add MCQ → Save → Verify in dashboard

2. **Campaign Viewer Flow:**
   - Copy campaign URL → Open in incognito → Complete campaign → Submit → Verify in responses

3. **Response Analytics Flow:**
   - View responses → Toggle table/list → View details → Verify slide types and answer types

---

## 🔮 Future Considerations

### Known Limitations (As of v2.0.0)

1. **No User Authentication**
   - Single-user platform
   - Anyone with URL can access
   - **Future:** Add Supabase Auth or Auth0

2. **No Multi-user Support**
   - No user management
   - No permissions/roles
   - **Future:** Add user_id to campaigns table

3. **CSV Export Placeholder**
   - Export button exists but doesn't work
   - **Future:** Implement with Papa Parse or similar

4. **No Video Processing**
   - No compression
   - No thumbnail generation
   - Large files slow to upload
   - **Future:** Add FFmpeg processing

5. **Basic Analytics**
   - Only count and completion tracking
   - **Future:** Add time-on-slide, drop-off rates, conversion funnels

### Potential Enhancements

**High Priority:**
- [ ] User authentication (Supabase Auth)
- [ ] CSV export functionality
- [ ] Video compression/optimization
- [ ] Campaign templates
- [ ] Duplicate campaign with data

**Medium Priority:**
- [ ] Advanced analytics dashboard
- [ ] Email notifications for responses
- [ ] Custom branding/theming
- [ ] Webhook integrations
- [ ] Campaign scheduling (publish/unpublish dates)

**Low Priority:**
- [ ] A/B testing capabilities
- [ ] Multi-language support
- [ ] API documentation
- [ ] White-label solution
- [ ] Mobile app (React Native)

### Technical Debt

1. **API Route Consolidation:** Some endpoints could be combined
2. **State Management:** Consider Zustand or Redux for complex state
3. **Type Safety:** Add TypeScript for better type checking
4. **Error Handling:** More comprehensive error messages
5. **Loading States:** Better loading indicators throughout app
6. **Accessibility:** Add ARIA labels, keyboard navigation
7. **SEO:** Add meta tags, Open Graph tags
8. **Performance:** Implement React.memo, useMemo where needed

---

## 📞 Resources & Links

**Production:**
- Live Site: https://int-video.vercel.app
- GitHub Repo: https://github.com/anup1969/int-video
- Vercel Dashboard: https://vercel.com/dashboard

**Development:**
- Supabase Dashboard: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk
- Local Dev: http://localhost:3000

**Documentation:**
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- React Flow Docs: https://reactflow.dev
- Tailwind CSS: https://tailwindcss.com/docs

---

## 🤝 Handoff Checklist

When handing off to a new developer, ensure they have:

- [ ] Access to GitHub repository (anup1969/int-video)
- [ ] Supabase credentials (URL, anon key, service role key)
- [ ] Vercel account access (optional, for deployments)
- [ ] Local development environment setup and working
- [ ] Read this handoff document completely
- [ ] Reviewed README.md for user-facing documentation
- [ ] Run all setup scripts successfully
- [ ] Tested creating and completing a campaign locally
- [ ] Understand JSONB data access patterns
- [ ] Know where to find debug scripts
- [ ] Have questions answered about architecture

---

## 💡 Quick Tips for New Developers

1. **Always check browser console** - Most issues show errors there
2. **Use debug scripts** - They're in `/scripts` folder
3. **Hard refresh after deploy** - Ctrl+Shift+R to clear cache
4. **JSONB fields are tricky** - Remember `data.sessionId` not `session_id`
5. **Test on mobile** - Video behavior differs significantly
6. **Response count logic** - Shows ALL responses, not just completed
7. **Slide type is critical** - Must be saved in response payload
8. **RLS policies matter** - Check Supabase if queries fail
9. **Build before deploy** - Run `npm run build` to catch errors early
10. **Version logging helps** - Add console.log with version number

---

**Document Version:** 1.0.0
**Last Updated:** November 2, 2025
**Maintained By:** Development Team
**Questions?** Check README.md or debug scripts first

---

**Happy Coding! 🚀**
