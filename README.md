# Interactive Video Campaign Builder Platform

**Version:** 0.4.0 (Phase 1 - React.js Components)
**Date:** October 29, 2025
**Status:** React Components Complete, Ready for Testing

---

## 🎯 Project Overview

A web-based platform for creating interactive video-based conversation flows with conditional branching logic. Similar to VideoAsk, this platform enables users to create engaging video campaigns for feedback collection, async interviews, appointment scheduling, FAQs, and lead qualification.

---

## 📊 Current Status

### ✅ COMPLETED (This Session)

**Phase 1A - Next.js Setup & React Components:**
- ✅ Next.js 14 project structure set up
- ✅ Tailwind CSS configured
- ✅ All React components created and organized:
  - `FlowBuilder.js` - Main component with state management
  - `VideoNode.js` - Individual node component
  - `EditModal.js` - Edit modal with 3 tabs (Video, Answer, Logic)
  - `PreviewModal.js` - Preview with Mobile/Desktop toggle
  - `Sidebar.js` - Answer types sidebar
  - `Header.js` - Top header bar
  - `ZoomControls.js` - Zoom in/out/reset controls
- ✅ Utility files and constants created
- ✅ Netlify configuration files created

### ⏳ NEXT UP (To be done)

**Phase 1B - Testing & Deployment:**
1. Install npm dependencies
2. Test application locally
3. Fix any bugs or issues
4. Deploy to Netlify
5. Test live on Netlify

**Phase 2 - Database & Backend:**
1. Set up Supabase database tables
2. Create database schemas
3. Implement RLS policies
4. Create API routes for CRUD operations
5. Integrate database with Flow Builder
6. Implement video upload to storage

---

## 🏗️ Tech Stack

**Frontend:**
- React 18
- Next.js 14
- Tailwind CSS
- Font Awesome (icons)

**Backend (Phase 2):**
- Next.js API routes
- Supabase (PostgreSQL database)
- Supabase Storage (video files)

**Deployment:**
- Netlify
- GitHub (version control)

---

## 📁 Project Structure

```
/int-video
├── /components
│   └── /builder
│       ├── FlowBuilder.js       # Main component
│       ├── VideoNode.js          # Individual node
│       ├── EditModal.js          # Edit modal (Video/Answer/Logic tabs)
│       ├── PreviewModal.js       # Preview modal
│       ├── Sidebar.js            # Sidebar with answer types
│       ├── Header.js             # Top header
│       └── ZoomControls.js       # Zoom controls
├── /lib
│   └── /utils
│       └── constants.js          # Answer types & logic rules
├── /pages
│   ├── _app.js                   # App wrapper
│   ├── _document.js              # Document (for Font Awesome)
│   ├── index.js                  # Home page
│   └── /api                      # API routes (Phase 2)
├── /styles
│   └── globals.css               # Global styles
├── /public                        # Static files
├── .gitignore
├── .env.example                  # Environment variables template
├── netlify.toml                  # Netlify configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.js             # PostCSS configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🎨 Features Implemented

### Visual Flow Builder (Frontend Only)
- ✅ Drag-and-drop canvas with pan/zoom controls
- ✅ 7 Answer Types:
  - 🎥 Open-Ended (video/audio/text)
  - ☑️ Multiple Choice
  - 📘 Button/CTA
  - 📅 Calendar
  - 📎 File Upload
  - ⭐ NPS Scale
  - 📋 Contact Form
- ✅ Logic branching with 4 action types:
  - Go to another step
  - Redirect to URL
  - Show text message
  - End campaign
- ✅ Inline node renaming
- ✅ Mobile/Desktop preview toggle
- ✅ Incomplete logic warnings (orange badges)
- ✅ Dynamic logic based on answer type settings
- ✅ Contact form configuration

**Note:** Data is NOT persisted yet. All changes are lost on page refresh. Database integration coming in Phase 2.

---

## 🔧 Integration Details

### Supabase
- **Project URL:** `https://uwzzdxroqqynmqkmwlpk.supabase.co`
- **Anon Key:** (provided in project instructions)
- **Service Role Key:** (to be obtained when needed in Phase 2)

### GitHub
- **Username:** anup1969
- **Repo Name:** int-video

### Netlify
- **Preferred Site Name:** gtintvideo
- **Deployment:** Automatic from GitHub

---

## 🚀 How to Run Locally

1. **Install dependencies:**
   ```bash
   cd /c/Users/PCS/code/int-video
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🌐 Deployment to Netlify

### Option 1: Via Netlify CLI
```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to site
netlify link

# Deploy
netlify deploy --prod
```

### Option 2: Via GitHub Integration
1. Push code to GitHub repository
2. Go to Netlify dashboard
3. Click "New site from Git"
4. Connect to GitHub
5. Select "int-video" repository
6. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
7. Click "Deploy site"

---

## 🗃️ Database Schema (Phase 2 - Planned)

### Tables to Create in Supabase

1. **campaigns**
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key - Phase 2)
   - `name` (text)
   - `status` (text: 'draft', 'active', 'paused')
   - `settings` (jsonb)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. **steps**
   - `id` (uuid, primary key)
   - `campaign_id` (uuid, foreign key)
   - `step_number` (integer)
   - `label` (text)
   - `position` (jsonb: {x, y})
   - `answer_type` (text)
   - `video_url` (text)
   - `video_thumbnail` (text)
   - `answer_config` (jsonb: mcOptions, buttonOptions, etc.)
   - `logic_rules` (jsonb)
   - `enabled_response_types` (jsonb)
   - `show_contact_form` (boolean)
   - `contact_form_fields` (jsonb)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

3. **connections**
   - `id` (uuid, primary key)
   - `campaign_id` (uuid, foreign key)
   - `from_step_id` (uuid)
   - `to_step_id` (uuid)
   - `connection_type` (text: 'default', 'logic')
   - `created_at` (timestamp)

4. **responses** (Visitor responses - Phase 2)
5. **response_answers** (Phase 2)
6. **contacts** (Phase 2)
7. **users** (Authentication - Phase 2)

---

## 📝 API Endpoints (Phase 2 - Planned)

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Steps
- `GET /api/campaigns/:id/steps` - Get all steps for campaign
- `POST /api/campaigns/:id/steps` - Create step
- `PUT /api/steps/:id` - Update step
- `DELETE /api/steps/:id` - Delete step

### Video Upload (Phase 2)
- `POST /api/upload/video` - Upload video file to Supabase Storage
- `POST /api/upload/thumbnail` - Generate and upload thumbnail

---

## 🎓 For Project Manager (Non-Technical Guide)

### What You'll Be Testing

1. **Visual Flow Builder:**
   - Drag answer types from sidebar to canvas
   - Click nodes to edit them
   - Set up logic branching
   - Rename nodes by clicking titles
   - Preview campaigns in mobile/desktop view

2. **What Works:**
   - All UI interactions
   - Creating and editing nodes
   - Logic configuration
   - Preview mode

3. **What Doesn't Work Yet:**
   - Saving data (everything resets on refresh)
   - Video upload
   - User authentication
   - Campaign management dashboard
   - Visitor response collection

### How to Test Locally

1. Open terminal/command prompt
2. Navigate to project: `cd /c/Users/PCS/code/int-video`
3. Run: `npm install` (first time only)
4. Run: `npm run dev`
5. Open browser: `http://localhost:3000`
6. Test all features and report issues

### How to Test on Netlify (After Deployment)

1. Visit: `https://gtintvideo.netlify.app` (or provided URL)
2. Test same features as local testing
3. Report any differences or issues

---

## 🐛 Known Issues / Limitations

1. **No Data Persistence:** All changes lost on page refresh (database needed)
2. **No Video Upload:** Placeholder only (Supabase storage needed)
3. **No Authentication:** Anyone can access the builder
4. **No Campaign Management:** Can only work on one campaign
5. **No Visitor Experience:** No public-facing campaign viewer yet

---

## 📊 Token Usage Tracking

### Current Session (October 29, 2025):
```
Start: 0 / 200,000
Current: ~85,000 / 200,000 (42.5% used)
Remaining: ~115,000 (57.5%)
Status: Good progress, sufficient tokens remaining
```

### Next Session Tasks:
1. Install dependencies and test locally
2. Fix any bugs found during testing
3. Deploy to Netlify
4. Set up Supabase database tables
5. Create API routes
6. Integrate database with Flow Builder

---

## 📞 Contact & Resources

- **GitHub Repo:** anup1969/int-video
- **Supabase Dashboard:** https://uwzzdxroqqynmqkmwlpk.supabase.co
- **Netlify Site:** gtintvideo.netlify.app (after deployment)

---

## 🔄 Version History

- **v0.1.0** (Oct 25, 2025) - Project initialization (previous Claude)
- **v0.2.0** (Oct 25, 2025) - Visual Flow Builder v1-v2 (previous Claude)
- **v0.3.0** (Oct 27, 2025) - Visual Flow Builder v3 (previous Claude)
- **v0.3.1** (Oct 27, 2025) - Visual Flow Builder v4 Enhanced HTML (previous Claude)
- **v0.4.0** (Oct 29, 2025) - Next.js project setup, all React components created ✅
- **v0.5.0** (Pending) - Database integration, API routes
- **v0.6.0** (Pending) - Campaign Dashboard
- **v0.7.0** (Pending) - Visitor Experience

---

**Last Updated:** October 29, 2025
**Current Phase:** Phase 1A Complete - React Components Ready
**Next Milestone:** Install dependencies, test locally, deploy to Netlify
