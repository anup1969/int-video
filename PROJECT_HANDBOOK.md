# Interactive Video Campaign Platform - Project Handbook

**Last Updated**: October 31, 2025
**Version**: 1.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Schema](#database-schema)
4. [Key Features](#key-features)
5. [File Structure](#file-structure)
6. [API Endpoints](#api-endpoints)
7. [Component Guide](#component-guide)
8. [Common Operations](#common-operations)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)
11. [Recent Fixes & Known Issues](#recent-fixes--known-issues)
12. [Development Workflow](#development-workflow)

---

## Project Overview

An interactive video campaign platform that allows users to:
- Create multi-step video campaigns with a visual flow builder
- Define branching logic based on user responses
- Collect user responses (video, audio, text, multiple choice, etc.)
- Track and analyze campaign responses

**Production URL**: https://int-video.vercel.app
**Local Development**: http://localhost:3002

---

## Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 14 (Pages Router)
- **UI**: React 18 with Tailwind CSS
- **State Management**: React hooks (useState, useEffect, useRef)
- **Icons**: Font Awesome

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Not implemented yet
- **File Storage**: Supabase Storage (for videos)

### Deployment
- **Platform**: Vercel
- **Environment Variables**: `.env.local` (see below)

### Required Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Database Schema

### Tables

#### `campaigns`
```sql
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `steps`
```sql
CREATE TABLE steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  label TEXT NOT NULL,
  answer_type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Important**: The `data` JSONB field stores all step properties:
- `originalId`: Frontend UUID for mapping
- `position`: { x, y } coordinates in flow builder
- `videoUrl`: URL to uploaded video
- `videoThumbnail`: Thumbnail image URL
- `videoPlaceholder`: Emoji placeholder
- `mcOptions`: Array of multiple choice options
- `buttonOptions`: Array of button configs
- `buttonShowTime`: When to show buttons (in seconds)
- `enabledResponseTypes`: { video, audio, text }
- `showContactForm`: Boolean
- `contactFormFields`: Array of form field configs
- `logicRules`: Array of branching logic rules

#### `connections`
```sql
CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  from_step UUID REFERENCES steps(id) ON DELETE CASCADE,
  to_step UUID REFERENCES steps(id) ON DELETE CASCADE,
  connection_type TEXT DEFAULT 'logic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Note**: When `from_step` is NULL, it means the connection starts from the campaign start node.

#### `responses`
```sql
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_name TEXT,
  email TEXT,
  responses JSONB DEFAULT '[]',
  completed BOOLEAN DEFAULT FALSE,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Note**: `responses` JSONB field is an array of response objects:
```json
[
  {
    "stepId": "uuid",
    "stepNumber": 1,
    "answerType": "button",
    "answerData": { "type": "option", "value": "Next" },
    "timestamp": "2025-10-31T..."
  }
]
```

---

## Key Features

### 1. Visual Flow Builder (`/builder/[id]`)

**Location**: `components/builder/FlowBuilder.js`

- Drag-and-drop canvas for creating campaign flows
- Node types: Start node, Video nodes
- Visual connections between nodes
- Right-side panel for node configuration

**Answer Types Supported**:
- `open-ended`: Video/audio/text responses
- `multiple-choice`: Predefined options
- `button`: CTA buttons with actions
- `contact-form`: Custom form fields
- `nps`: 0-10 rating scale

**Logic Rules**:
Each node can have multiple logic rules that determine:
- Next step to navigate to
- URL to redirect to
- When to end the campaign
- Custom end messages and CTAs

### 2. Campaign Viewer (`/campaign/[id]`)

**Location**: `pages/campaign/[id].js`

End-user facing interface where users:
- Watch videos step-by-step
- Provide responses based on answer type
- Navigate through campaign flow based on logic rules
- See completion message at the end

**Key Features**:
- Autoplay video (muted by default)
- Prominent unmute button (red, blinking)
- Response tracking with session IDs
- All responses saved to database automatically

### 3. Campaign Dashboard (`/`)

**Location**: `pages/index.js`

- List all campaigns
- Create new campaigns
- Edit existing campaigns
- View campaign responses
- Publish/unpublish campaigns
- Delete campaigns

### 4. Response Tracking (`/responses/[id]`)

**Location**: `pages/responses/[id].js`

- View all responses for a campaign
- Session-by-session breakdown
- Export functionality (planned)

---

## File Structure

```
int-video/
├── components/
│   ├── builder/
│   │   └── FlowBuilder.js          # Visual flow builder component
│   ├── layout/
│   │   └── Layout.js               # Main layout wrapper
│   └── [other components]
├── pages/
│   ├── api/
│   │   ├── campaigns/
│   │   │   ├── index.js            # List/create campaigns
│   │   │   └── [id]/
│   │   │       ├── index.js        # Get campaign
│   │   │       ├── save.js         # Save campaign (nodes/connections)
│   │   │       ├── responses.js    # Save/get responses
│   │   │       └── publish.js      # Publish campaign
│   │   ├── upload-video.js         # Video upload endpoint
│   │   └── [other endpoints]
│   ├── builder/
│   │   └── [id].js                 # Campaign builder page
│   ├── campaign/
│   │   └── [id].js                 # End-user campaign viewer
│   ├── responses/
│   │   └── [id].js                 # Campaign responses page
│   └── index.js                    # Dashboard/home page
├── lib/
│   ├── supabase.js                 # Supabase client
│   └── logger.js                   # File-based logging utility
├── scripts/
│   ├── setup-database.js           # Database initialization
│   ├── test-save-load.js           # Save/load functionality test
│   └── view-logs.js                # Log viewer utility
├── supabase/
│   └── create-tables.sql           # SQL schema definitions
├── logs/
│   └── api.log                     # API logs (auto-generated)
├── .env.local                      # Environment variables
├── package.json
└── PROJECT_HANDBOOK.md             # This file
```

---

## API Endpoints

### Campaign Management

#### `GET /api/campaigns`
List all campaigns

**Response**:
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Campaign Name",
      "status": "draft|published",
      "created_at": "timestamp"
    }
  ]
}
```

#### `POST /api/campaigns`
Create a new campaign

**Request Body**:
```json
{
  "name": "Campaign Name",
  "status": "draft"
}
```

#### `GET /api/campaigns/[id]`
Get campaign details with steps and connections

**Response**:
```json
{
  "campaign": { "id": "uuid", "name": "...", ... },
  "steps": [ /* array of step objects */ ],
  "connections": [ /* array of connection objects */ ]
}
```

#### `POST /api/campaigns/[id]/save`
Save campaign (nodes, connections, settings)

**Request Body**:
```json
{
  "nodes": [ /* array of node objects */ ],
  "connections": [ /* array of connection objects */ ],
  "settings": { "name": "..." }
}
```

**Critical Implementation Details**:
1. Deletes all existing steps and connections
2. Inserts new steps and gets back database-generated UUIDs
3. Creates ID mapping: frontend UUID → database UUID
4. Maps connections to use database UUIDs
5. Stores original frontend ID in `step.data.originalId`

See `pages/api/campaigns/[id]/save.js` lines 33-102 for full implementation.

#### `DELETE /api/campaigns/[id]`
Delete a campaign

### Response Management

#### `POST /api/campaigns/[id]/responses`
Save user response

**Request Body**:
```json
{
  "sessionId": "session-12345",
  "stepId": "uuid",
  "stepNumber": 1,
  "answerType": "button",
  "answerData": { "type": "option", "value": "Next" },
  "userName": "John Doe",
  "email": "john@example.com",
  "completed": false,
  "duration": 45
}
```

**How it works**:
1. First response from a session creates a new response record
2. Subsequent responses from same session update the existing record
3. Responses are appended to the `responses` JSONB array
4. `completed` and `duration` are updated with each call

#### `GET /api/campaigns/[id]/responses`
Get all responses for a campaign

### Video Upload

#### `POST /api/upload-video`
Upload video to Supabase storage

**Request**: `multipart/form-data` with video file

**Response**:
```json
{
  "publicUrl": "https://...",
  "path": "videos/filename.mp4"
}
```

---

## Component Guide

### FlowBuilder Component

**Location**: `components/builder/FlowBuilder.js`

**Key Functions**:

- `loadCampaignFromURL()` (lines 77-149): Loads campaign data and transforms it to nodes/connections format
- `handleSave()` (lines 151-186): Saves campaign to database
- `addNode()` (lines 188-234): Adds new video node to canvas
- `deleteNode()` (lines 236-258): Removes node and its connections
- `handleNodeClick()` (lines 260-289): Opens node editor panel
- `handleVideoUpload()` (lines 291-343): Uploads video and updates node

**Important State Variables**:
- `nodes`: Array of all nodes (start + video nodes)
- `connections`: Array of connections between nodes
- `selectedNode`: Currently selected node for editing
- `campaignName`: Campaign title

**Data Flow**:
1. Load campaign → Transform steps to nodes
2. User edits nodes/connections
3. Save → Transform nodes to steps with ID mapping
4. Load again → Transform steps back to nodes

### Campaign Viewer Component

**Location**: `pages/campaign/[id].js`

**Key Functions**:

- `loadCampaign()` (lines 33-70): Fetches campaign data
- `saveResponse()` (lines 72-98): Saves user response to database
- `handleSubmitResponse()` (lines 167-239): Processes answer submission and navigation
- `toggleMute()`: Unmutes video

**Important State Variables**:
- `currentStepIndex`: Index of current step in steps array
- `sessionId`: Unique session identifier
- `startTime`: Session start timestamp
- `isMuted`: Video mute state
- `showResponseUI`: Which response type UI to show (video/audio/text)
- `textResponse`: Text response content
- `formData`: Contact form data

**Navigation Logic**:
1. User submits response
2. System saves response to database
3. System checks for matching logic rule
4. If rule found: navigate to target (node/end/url)
5. If no rule: go to next step or end campaign

---

## Common Operations

### Creating a New Campaign

1. Navigate to dashboard (`/`)
2. Click "Create New Campaign"
3. Enter campaign name
4. Click on campaign to open builder
5. Add video nodes by clicking "Add Step"
6. Configure each node (video, answer type, logic)
7. Draw connections between nodes
8. Click "Save Campaign"

### Uploading a Video

1. In node editor panel, click "Upload Video"
2. Select video file (MP4 recommended)
3. Wait for upload to complete
4. Video URL is automatically saved

### Configuring Logic Rules

Logic rules determine campaign flow based on user responses.

**Rule Structure**:
```javascript
{
  label: "Button: Next",           // Display label
  condition: "response_type",      // or other condition
  value: "video",                  // condition value
  targetType: "node|end|url",      // where to navigate
  target: "step-uuid",             // target node ID (if targetType=node)
  url: "https://...",              // URL (if targetType=url)
  endMessage: "Thank you!",        // message (if targetType=end)
  ctaText: "Visit Website",        // CTA text (if targetType=end)
  ctaUrl: "https://..."            // CTA URL (if targetType=end)
}
```

### Testing Campaign Flow

Use the test script:

```bash
npm run test:save
```

This script:
1. Creates a test campaign
2. Saves nodes and connections
3. Loads campaign back
4. Verifies data integrity
5. Cleans up test data

### Viewing Logs

```bash
npm run logs
```

Or manually:
```bash
node scripts/view-logs.js
```

Logs are stored in `logs/api.log` with timestamps and structured data.

---

## Deployment Guide

### Prerequisites

1. Vercel account
2. Supabase project
3. Environment variables configured

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize database (first time only)
node scripts/setup-database.js

# Start dev server
npm run dev
```

Server will run on http://localhost:3002 (or next available port)

### Production Deployment

```bash
# Login to Vercel (first time only)
vercel login

# Deploy to production
vercel --prod

# Get the deployment URL from output
# Example: https://int-video-xyz.vercel.app

# Update domain alias
vercel alias [deployment-url] int-video.vercel.app
```

**Important**: Always alias after deployment to ensure the production URL points to the latest version.

### Environment Variables in Vercel

Add these in Vercel dashboard → Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "Campaign saved" but data disappears on refresh

**Cause**: ID mapping between frontend UUIDs and database UUIDs broken

**Solution**: Check `pages/api/campaigns/[id]/save.js` - ensure:
1. Steps are inserted with `.select()` to get back database IDs
2. ID mapping is created: `idMapping[step.data.originalId] = step.id`
3. Connections use mapped IDs: `from_step: idMapping[conn.from]`

**Fixed**: October 31, 2025

---

#### Issue: Campaign viewer shows "Application error"

**Cause 1**: Infinite re-render loop from useEffect dependencies
**Solution**: Check useEffect dependency arrays - avoid object dependencies

**Cause 2**: Campaign data in wrong format
**Solution**: Ensure campaign viewer transforms `steps` to `nodes` format

**Fixed**: October 31, 2025

---

#### Issue: Video doesn't autoplay with sound

**Cause**: Browser autoplay policies block unmuted autoplay

**Solution**: Video autoplays muted, with prominent unmute button overlay
- Red button with blinking animation
- Located at top-right of video
- User clicks to unmute

**Implemented**: October 31, 2025

---

#### Issue: User responses not being saved

**Cause**: Campaign viewer wasn't calling the response API

**Solution**:
1. Added `sessionId` and `startTime` state
2. Created `saveResponse()` function
3. Integrated into `handleSubmitResponse()`
4. Saves before every navigation/completion

**Fixed**: October 31, 2025

---

#### Issue: Connections not visible after load

**Cause**: Connections reference wrong step IDs after save/load

**Solution**: Save stores `originalId`, load uses database `id`, connections use database IDs

---

#### Issue: Deploy creates new URL but domain doesn't update

**Cause**: Vercel doesn't auto-update domain aliases

**Solution**: Always run after deploy:
```bash
vercel alias [new-deployment-url] int-video.vercel.app
```

---

### Debugging Tools

#### 1. Logging System

**Logger Functions** (`lib/logger.js`):
```javascript
logger.info('Message', { data: 'value' })
logger.error('Error message', { error: errorObj })
logger.warn('Warning', { detail: 'info' })
logger.debug('Debug info', { value: 123 })
```

**View Logs**:
```bash
npm run logs
```

#### 2. Test Script

```bash
npm run test:save
```

Runs comprehensive save/load test with data verification.

#### 3. Browser Console

- Campaign viewer: Check console for `saveResponse` logs
- Builder: Check console for save/load operations
- Network tab: Monitor API calls

#### 4. Supabase Dashboard

- Direct database access
- View tables and data
- Check RLS policies
- Monitor storage

---

## Recent Fixes & Known Issues

### Recent Fixes (October 2025)

✅ **Save/Load Persistence** - Fixed ID mapping between frontend and database
✅ **Campaign Viewer Crashes** - Fixed infinite re-render loop
✅ **Production Domain** - Fixed Vercel alias configuration
✅ **Video Autoplay** - Implemented unmute button approach
✅ **Response Saving** - Connected campaign viewer to response API
✅ **Logic Rules Not Working** - Fixed connection mapping in save API
✅ **Null Constraint Violations** - Added default values for required fields

### Known Limitations

⚠️ **Video/Audio Recording** - UI placeholders exist but recording not implemented
⚠️ **Authentication** - No user auth system yet (planned)
⚠️ **Response Export** - No CSV/Excel export yet (planned)
⚠️ **Analytics Dashboard** - Basic response view only (enhancement planned)
⚠️ **Multi-language Support** - English only currently
⚠️ **Mobile Optimization** - Desktop-first, mobile needs testing

### Future Enhancements

🔮 Actual video/audio recording with MediaRecorder API
🔮 User authentication and role-based access
🔮 Response analytics and visualization
🔮 A/B testing capabilities
🔮 Email notifications for responses
🔮 Webhook integrations
🔮 Custom branding and themes
🔮 Response export (CSV, Excel, JSON)

---

## Development Workflow

### Adding a New Feature

1. **Plan**: Break down feature into tasks
2. **Database**: Update schema if needed (add to `supabase/create-tables.sql`)
3. **API**: Create/update API endpoints
4. **Frontend**: Build UI components
5. **Integration**: Connect frontend to API
6. **Test**: Use test scripts and manual testing
7. **Log**: Add logging for debugging
8. **Deploy**: Deploy to Vercel and update alias
9. **Document**: Update this handbook

### Code Style Guidelines

- Use functional components with hooks
- Keep components under 500 lines (extract if larger)
- Use meaningful variable names
- Add comments for complex logic
- Handle errors gracefully with try/catch
- Log important operations
- Use TypeScript type hints where helpful

### Git Workflow (if using Git)

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "Descriptive message"

# Push and deploy
git push origin feature/feature-name
vercel --prod
vercel alias [deployment-url] int-video.vercel.app
```

### Testing Checklist

Before deploying:

- [ ] Test save/load functionality
- [ ] Test campaign viewer flow
- [ ] Test all answer types
- [ ] Test logic rules and navigation
- [ ] Test video upload
- [ ] Check browser console for errors
- [ ] Check API logs for errors
- [ ] Test on mobile (basic check)
- [ ] Verify responses are being saved

---

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test:save       # Test save/load functionality

# Utilities
npm run logs            # View API logs
node scripts/setup-database.js     # Initialize database

# Deployment
vercel --prod           # Deploy to production
vercel alias [url] int-video.vercel.app  # Update domain
vercel logs int-video.vercel.app  # View production logs
```

### Important File Locations

- **Main builder logic**: `components/builder/FlowBuilder.js`
- **Campaign viewer**: `pages/campaign/[id].js`
- **Save API**: `pages/api/campaigns/[id]/save.js`
- **Response API**: `pages/api/campaigns/[id]/responses.js`
- **Database schema**: `supabase/create-tables.sql`
- **Logger**: `lib/logger.js`
- **Supabase client**: `lib/supabase.js`

### Key Concepts

**UUID Mapping**: Frontend generates UUIDs for nodes, database generates different UUIDs for steps. Mapping between them is critical for connections.

**JSONB Storage**: Most step properties are stored in a flexible `data` JSONB column, allowing easy addition of new properties without schema changes.

**Logic Rules**: Determine campaign flow. Each rule can target a node, URL, or campaign end.

**Session Tracking**: Each viewer session gets a unique `sessionId` used to group all responses from that user.

**Response Aggregation**: Multiple step responses from same session are stored in single response record with JSONB array.

---

## Support & Contact

For questions or issues:

1. Check this handbook first
2. Review API logs (`npm run logs`)
3. Check browser console
4. Review recent fixes section
5. Test with `npm run test:save`

---

## Version History

### v1.0 (October 31, 2025)
- Initial project handbook created
- Documented all core features and fixes
- Added comprehensive troubleshooting guide
- Included deployment procedures

---

**End of Handbook**

This document should be updated whenever significant changes are made to the project. Keep it as the single source of truth for project understanding and development.
