# Interactive Video Campaign Platform

**Version:** 1.8.0 (Ad-Hoc Bug & Suggestion Reporting)
**Date:** November 7, 2025
**Status:** Production - Fully Functional
**Live URL:** https://int-video.vercel.app
**Tester Dashboard:** https://int-video.vercel.app/tester

---

## 🎯 Project Overview

A complete web-based platform for creating interactive video-based conversation flows with conditional branching logic. Similar to VideoAsk, this platform enables users to create engaging video campaigns for feedback collection, async interviews, appointment scheduling, FAQs, and lead qualification.

---

## 🚀 Current Status

### ✅ FULLY IMPLEMENTED & DEPLOYED

**Campaign Builder:**
- Visual flow builder with drag-and-drop canvas
- Multiple slide types (Video Slides, Text Slides)
- Answer type configuration (MCQ, Open-ended, Contact Forms, Buttons)
- Logic branching with conditional rules
- Video upload to Supabase Storage
- Real-time preview
- Save/Load campaigns from database
- Campaign management dashboard

**Dashboard:**
- Campaign cards with statistics
- Response count tracking
- Action buttons (Edit, Copy URL, View Responses, Duplicate, Delete)
- Status indicators (Draft, Active, Archived)
- Grid and list view modes
- Campaign duplication

**Campaign Viewer (End-User Experience):**
- Mobile-responsive video playback
- Text slides with custom styling
- Multiple answer types support
- Contact form collection
- Progress tracking
- Session management
- Response submission to database

**Response Management:**
- Google Forms-style spreadsheet view
- List view with detailed information
- Response details modal with slide type and answer type
- Filter by status (completed/incomplete)
- Search by name or email
- Export functionality (placeholder)

**Additional Features:**
- Volume control and unmute button
- Button delay with configurable timing
- Multiple response types (Video, Audio, Text)
- **Audio/Video Recording**: End-users can record video or audio responses directly in the browser
- Contact form with customizable fields
- Conditional logic based on answers
- Campaign scheduler with start/end date/time (IST timezone)
- Video progress bar

---

## 🏗️ Tech Stack

**Frontend:**
- React 18
- Next.js 14 (Pages Router)
- Tailwind CSS
- Font Awesome (icons)
- React Flow (canvas)

**Backend:**
- Next.js API routes
- Supabase (PostgreSQL database)
- Supabase Storage (video files)

**Deployment:**
- Vercel (Production)
- GitHub (version control: anup1969/int-video)

---

## 📁 Project Structure

```
/int-video
├── /pages
│   ├── index.js                    # Campaign builder/editor
│   ├── dashboard.js                # Campaign management dashboard
│   ├── /campaign
│   │   └── [id].js                 # Public campaign viewer
│   ├── /responses
│   │   └── [id].js                 # Response viewer & analytics
│   └── /api
│       ├── /campaigns
│       │   ├── index.js            # List/create campaigns
│       │   └── /[id]
│       │       ├── index.js        # Get/update/delete campaign
│       │       ├── save.js         # Save campaign structure
│       │       └── responses.js     # Get/create responses
│       └── /upload
│           └── video.js            # Video upload to Supabase
├── /lib
│   ├── supabase.js                 # Supabase client configuration
│   └── logger.js                   # Logging utility
├── /scripts
│   ├── setup-database.js           # Database schema creation
│   └── create-storage-bucket.js    # Storage setup
├── /styles
│   └── globals.css                 # Global styles
├── .env.local                      # Environment variables
├── package.json                    # Dependencies
└── README.md                       # This file
```

---

## 🎨 Features

### Campaign Builder
- **Visual Canvas**: Drag-and-drop interface with pan/zoom controls
- **Slide Types**:
  - 🎬 Video Slide: Upload video, add thumbnail
  - 📄 Text Slide: Rich text content with custom styling
- **Answer Types**:
  - Open-Ended (video/audio/text responses)
  - Multiple Choice
  - Button/CTA
  - Contact Form (customizable fields)
- **Logic Branching**:
  - Conditional routing based on answers
  - Go to step
  - Redirect to URL
  - End campaign
- **Configuration**:
  - Button delay timing
  - Enabled response types
  - Contact form fields
  - Volume control

### Dashboard
- Campaign cards with response counts
- Quick actions (Edit, Copy URL, View Responses, Duplicate, Delete)
- Filter by status
- Search campaigns
- Grid/List view toggle

### Response Analytics
- **Table View**: Google Forms-style spreadsheet with:
  - Sticky name column
  - Dynamic columns for each question
  - Slide type and answer type headers
  - Clean spreadsheet design
- **List View**: Detailed view with status, device, duration
- **Response Details Modal**: Individual response journey with slide types
- Filters and search

---

## 🗃️ Database Schema

### Supabase Tables

**campaigns**
- `id` (uuid, primary key)
- `name` (text)
- `status` (text: 'draft', 'active', 'archived')
- `settings` (jsonb)
- `data` (jsonb: stores nodes and connections)
- `created_at`, `updated_at` (timestamp)

**steps**
- `id` (uuid, primary key)
- `campaign_id` (uuid, foreign key)
- `step_number` (integer)
- `label` (text)
- `answer_type` (text)
- `data` (jsonb: all node configuration including slideType, videoUrl, mcOptions, etc.)
- `created_at`, `updated_at` (timestamp)

**connections**
- `id` (uuid, primary key)
- `campaign_id` (uuid, foreign key)
- `from_step` (uuid, nullable for start node)
- `to_step` (uuid)
- `connection_type` (text)
- `created_at` (timestamp)

**responses**
- `id` (uuid, primary key)
- `campaign_id` (uuid, foreign key)
- `user_name` (text)
- `email` (text)
- `completed` (boolean)
- `duration` (integer, seconds)
- `data` (jsonb: contains sessionId, steps array with answers, slideType, deviceType)
- `completed_at`, `created_at` (timestamp)

---

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🚀 How to Run Locally

1. **Clone repository:**
   ```bash
   git clone https://github.com/anup1969/int-video.git
   cd int-video
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in Supabase credentials

4. **Set up database:**
   ```bash
   node scripts/setup-database.js
   node scripts/create-storage-bucket.js
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Open browser:**
   Navigate to `http://localhost:3000`

---

## 🌐 Deployment

**Vercel Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set alias
vercel alias <deployment-url> int-video.vercel.app
```

**Current Production URL:** https://int-video.vercel.app

---

## 📊 API Endpoints

### Campaigns
- `GET /api/campaigns` - List all campaigns with response counts
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign
- `POST /api/campaigns/[id]/save` - Save complete campaign structure

### Responses
- `GET /api/campaigns/[id]/responses` - Get all responses for campaign
- `POST /api/campaigns/[id]/responses` - Submit/update response

### Upload
- `POST /api/upload/video` - Upload video to Supabase Storage

---

## 🎓 User Guide

### Creating a Campaign

1. Go to Dashboard
2. Click "New Campaign"
3. Add slides by dragging from sidebar or clicking canvas
4. Configure each slide:
   - Upload video or add text content
   - Set answer type
   - Configure options (MCQ, buttons, etc.)
   - Add logic rules
5. Save campaign
6. Copy campaign URL from dashboard
7. Share URL with participants

### Viewing Responses

1. Go to Dashboard
2. Click "View Responses" on any campaign
3. Toggle between Table view (spreadsheet) or List view
4. Click "View Details" to see individual response journey
5. Filter and search responses
6. Export to CSV (coming soon)

---

## 🔄 Recent Updates

### Version 1.8.0 - November 7, 2025 (TESTING)
- ✅ **Ad-Hoc Bug & Suggestion Reporting**:
  - Floating orange "+" button for quick report access
  - Report modal with comprehensive form (Bug/Suggestion/Improvement)
  - Severity levels for bugs (Critical, High, Medium, Low)
  - Steps to reproduce field for detailed bug documentation
  - Screenshot upload support for visual evidence
  - Database table with status tracking (open, in_progress, resolved, wont_fix)
  - Automatic browser and device detection
  - Lighter modal overlay for better readability

### Version 1.7.0 - November 7, 2025 (TESTING)
- ✅ **Enhanced Tester Dashboard**:
  - Delete button for uploaded test files
  - Replace file functionality
  - Color-coded file upload status (green for new, blue for existing)
  - Enhanced changelog display with gradient background
  - Known Issues section display
  - Better icon visibility with circular backgrounds
  - Type labels for changelog items (Feature/Fix/Improvement)
  - Storage DELETE policy for complete file management

### Version 1.6.0 - November 7, 2025 (TESTING)
- ✅ **Tester Dashboard & QA System**: `/tester`
  - Version history with expandable rows
  - Detailed test cases with step-by-step instructions
  - 4-column testing table (Instructions, Notes, Status, Upload)
  - Test report submission with file uploads
  - Pass rate statistics and analytics
  - Spreadsheet-style test tracking
  - Data persistence across page reloads

### Version 1.5.0 - November 7, 2025 (STABLE)
- ✅ **Password Protection Feature**:
  - Password protection for campaigns
  - Auto-generated readable passwords (e.g., happy-cloud-42)
  - Password management in builder settings
  - Password entry screen for viewers
  - Session storage for password validation

### Version 1.4.0 - November 4, 2025
- ✅ **Audio/Video Recording**: End-users can record video or audio responses directly in browser
  - Live camera preview while recording
  - Recording timer display
  - Re-record functionality
  - Automatic upload to Supabase Storage
  - Cross-device compatibility (desktop, mobile, tablet)
- ✅ Campaign scheduler with start/end date/time (IST timezone support)
- ✅ Video progress bar for tracking playback completion
- ✅ Improved timezone handling (UTC storage, IST display)

### Version 1.3.x - October-November 2025
- ✅ Campaign scheduling with start/end dates
- ✅ Video completion progress bar
- ✅ IST timezone support for scheduling
- ✅ Bug fixes for schedule validation

### Version 2.0.0 - November 2, 2025
- ✅ Added Google Forms-style spreadsheet table view for responses
- ✅ Fixed slide type display in response details (shows once with answer type)
- ✅ Added view toggle (Table/List) for responses
- ✅ Moved all dashboard action buttons outside with icons (consistent UI)
- ✅ Added response count on dashboard cards (matches responses page)
- ✅ Added Copy URL button for campaigns
- ✅ Added Delete button for campaigns
- ✅ Button delay feature without waiting message
- ✅ Text slides with custom background and font
- ✅ Volume control and unmute button
- ✅ Slide type tracking in responses (Video Slide vs Text Slide)

---

## 📝 Known Limitations

1. **No User Authentication**: Single-user platform currently
2. **No Multi-user Support**: No user management or permissions
3. **CSV Export**: Placeholder only (not yet implemented)
4. **Video Processing**: No video compression or optimization
5. **Analytics**: Basic analytics only (no advanced metrics)

---

## 🐛 Troubleshooting

### Common Issues

**Campaign not saving:**
- Check browser console for errors
- Verify Supabase connection
- Check database RLS policies

**Videos not uploading:**
- Check video file size (must be < 50MB)
- Verify Supabase Storage bucket exists
- Check storage policies

**Responses not showing:**
- Hard refresh the page (Ctrl+Shift+R)
- Check if responses are marked as completed
- Verify sessionId is being stored correctly

---

## 📞 Resources

- **Live Site:** https://int-video.vercel.app
- **GitHub:** https://github.com/anup1969/int-video
- **Supabase Dashboard:** https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk

---

## 🔄 Version History

- **v0.1.0 - v0.4.0** (Oct 2025) - Initial development phases
- **v1.0.0** (Nov 1, 2025) - Full campaign builder + viewer
- **v1.5.0** (Nov 2, 2025) - Dashboard + response management
- **v2.0.0** (Nov 2, 2025) - Spreadsheet view, UI polish, production release

---

**Last Updated:** November 2, 2025
**Status:** Production Ready
**Maintainer:** anup1969
