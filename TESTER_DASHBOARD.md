# Tester Dashboard Documentation

**Last Updated:** November 7, 2025
**Current Version:** 1.7.0 (testing)
**Status:** Fully Functional
**URL:** https://int-video.vercel.app/tester

---

## Overview

The Tester Dashboard is a comprehensive QA testing system that allows testers to:
- View version history with detailed changelogs
- Execute test cases with step-by-step instructions
- Submit test reports with file uploads
- Track pass rates and testing progress
- Manage uploaded documentation

---

## Features

### Version Management
- **Version Tracking**: All releases tracked with version numbers (1.5.0, 1.6.0, 1.7.0, etc.)
- **Status Badges**:
  - 🔵 Testing - Currently under QA
  - 🟢 Stable - Production-ready
  - ⚪ Deprecated - No longer recommended
- **Release Information**: Date, time (IST), title, description
- **Expandable Rows**: Click + icon to view full testing details

### Changelog Display (v1.7.0 Enhancement)
- **Prominent Design**: Gradient background (violet to blue)
- **Color-coded Icons**:
  - ✅ Green - New features
  - 🔧 Blue - Bug fixes
  - ⬆️ Purple - Improvements
- **Type Labels**: Each change labeled as Feature/Fix/Improvement
- **Known Issues Section**: Amber-colored section for known bugs

### Test Case Management
- **Detailed Instructions**: Step-by-step test procedures
- **Categories**: ui-interaction, ui-display, form-input, file-upload, etc.
- **Priority Levels**: Critical, High, Medium, Low
- **Expected Results**: Clear pass criteria for each step

### Testing Table (4 Columns)
1. **Test Instructions**: Title, description, numbered steps
2. **Tester Notes**: Multi-line textarea for observations
3. **Status Dropdown**:
   - Properly Working (pass)
   - Not Working (fail)
   - Partially Working (blocked)
4. **Upload Docs**: File management (upload, view, delete, replace)

### File Management (v1.7.0 Feature)
- **Upload**: Images, PDFs, screenshots
- **Delete**: Trash icon with confirmation dialog
- **Replace**: Update existing files
- **Color-coded Status**:
  - 🟢 Green background - Newly uploaded file
  - 🔵 Blue background - Previously saved file
- **Storage**: Files stored in Supabase Storage (campaign-files bucket)

### Test Report Submission
- **Save Button**: Saves all test results for a version
- **Data Persistence**: Results load automatically on page refresh
- **Browser Detection**: Automatically captures browser and device info
- **Session Support**: Maintains test state across page reloads

---

## Database Schema

### Tables

#### `versions`
```sql
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number TEXT NOT NULL UNIQUE,
  release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'testing',
  title TEXT NOT NULL,
  description TEXT,
  changelog JSONB DEFAULT '[]'::jsonb,
  known_issues JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Changelog Format**:
```json
[
  { "type": "feature", "description": "New feature description" },
  { "type": "fix", "description": "Bug fix description" },
  { "type": "improvement", "description": "Enhancement description" }
]
```

#### `test_cases`
```sql
CREATE TABLE test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Steps Format**:
```json
[
  { "step": 1, "action": "What to do", "expected": "What should happen" },
  { "step": 2, "action": "Next action", "expected": "Expected result" }
]
```

#### `test_reports`
```sql
CREATE TABLE test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  tester_name TEXT NOT NULL,
  status TEXT NOT NULL, -- pass, fail, blocked, skip
  notes TEXT,
  bug_description TEXT,
  severity TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  browser TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Screenshots Format**: Array of Supabase Storage URLs
```json
["https://...storage.../test-reports/file1.png", "..."]
```

### Storage Policies

**Bucket**: `campaign-files`
**Folder**: `test-reports/`

```sql
-- Allow public uploads
CREATE POLICY "Allow public uploads to test-reports"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'campaign-files' AND (storage.foldername(name))[1] = 'test-reports');

-- Allow public reads
CREATE POLICY "Allow public read access to test-reports"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'campaign-files' AND (storage.foldername(name))[1] = 'test-reports');

-- Allow public updates
CREATE POLICY "Allow public updates to test-reports"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'campaign-files' AND (storage.foldername(name))[1] = 'test-reports');

-- Allow public deletes
CREATE POLICY "Allow public deletes from test-reports"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'campaign-files' AND (storage.foldername(name))[1] = 'test-reports');
```

---

## Version History

### v1.7.0 - Enhanced Tester Dashboard (November 7, 2025)
**Status**: Testing

**Features**:
- ✅ Delete button for uploaded test files
- ✅ Replace file functionality
- ✅ Color-coded file upload status
- ✅ Enhanced changelog display with gradient background
- ✅ Known Issues section in expanded view
- ✅ Better icon visibility with circular backgrounds
- ✅ Type labels for changelog items
- ✅ Storage DELETE policy for file management

**Test Cases**: 6 test cases covering file management and UI improvements

---

### v1.6.0 - Tester Dashboard & QA System (November 7, 2025)
**Status**: Testing

**Features**:
- ✅ Tester dashboard at /tester
- ✅ Version history and changelog display
- ✅ Test case management
- ✅ Test report submission and viewing
- ✅ Pass rate statistics and analytics

**Test Cases**: 9 detailed test cases covering all UI components

---

### v1.5.0 - Password Protection (November 7, 2025)
**Status**: Stable

**Features**:
- ✅ Password protection for campaigns
- ✅ Auto-generated readable passwords (e.g., happy-cloud-42)
- ✅ Password management in builder settings
- ✅ Password entry screen for viewers
- ✅ Session storage for password validation

---

## Usage Guide

### For QA Testers

#### Running Tests
1. Navigate to https://int-video.vercel.app/tester
2. Find the version to test (usually the one with "testing" status)
3. Click the + icon to expand the version row
4. Review the "What's New" changelog
5. For each test case:
   - Read the test instructions carefully
   - Follow each numbered step
   - Record observations in Tester Notes
   - Select appropriate status (Properly Working/Not Working/Partially Working)
   - Upload screenshots if needed (optional but recommended for bugs)
6. Click "Save Test Results" at the bottom
7. Results are saved automatically - you can refresh to verify

#### Uploading Files
1. Click "Choose file" button
2. Select screenshot, image, or PDF
3. File uploads to cloud storage
4. Green checkmark appears when successful
5. To remove: Click trash icon and confirm
6. To replace: Click "Replace File" button

#### Best Practices
- ✅ Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- ✅ Test on different devices (Desktop, Mobile, Tablet)
- ✅ Include screenshots for any issues found
- ✅ Write clear, detailed notes about what you observed
- ✅ Mark as "Partially Working" if feature works but has minor issues
- ✅ Mark as "Not Working" only if feature is completely broken

---

### For Developers

#### Adding a New Version

1. **Create Version Script**:
```javascript
// scripts/add-version-X.X.X.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVersion() {
  const { data: version, error } = await supabase
    .from('versions')
    .insert({
      version_number: 'X.X.X',
      title: 'Feature Title',
      description: 'Brief description',
      status: 'testing', // ALWAYS start with 'testing'
      changelog: [
        { type: 'feature', description: 'New feature' },
        { type: 'fix', description: 'Bug fix' },
        { type: 'improvement', description: 'Enhancement' }
      ],
      known_issues: []
    })
    .select()
    .single();

  // Add test cases...
}

addVersion();
```

2. **Run Script**:
```bash
node scripts/add-version-X.X.X.js
```

3. **Version Status Workflow**:
   - Start: `testing` (automatically set)
   - After QC Pass: Update to `stable`
   - When Deprecated: Update to `deprecated`

#### Updating Version Status

After QC team confirms all tests pass:
```javascript
await supabase
  .from('versions')
  .update({ status: 'stable' })
  .eq('version_number', 'X.X.X');
```

#### Fetching Test Reports

```javascript
// scripts/fetch-test-reports.js
const { data: reports } = await supabase
  .from('test_reports')
  .select('*')
  .eq('version_id', versionId)
  .order('created_at', { ascending: false });
```

---

## API Endpoints

### Get Versions
```http
GET https://int-video.vercel.app/api/versions
```

Returns all versions with test cases.

### Get Test Reports
```http
GET https://int-video.vercel.app/api/test-reports?version_id={id}
```

Returns all test reports for a specific version.

### Submit Test Report
```http
POST https://int-video.vercel.app/api/test-reports
Content-Type: application/json

{
  "test_case_id": "uuid",
  "version_id": "uuid",
  "tester_name": "Tester",
  "status": "pass",
  "notes": "Test notes",
  "screenshots": ["url1", "url2"],
  "browser": "Chrome",
  "device": "Desktop"
}
```

---

## Troubleshooting

### File Upload Issues

**Problem**: "Failed to upload" error

**Solutions**:
1. Check storage policies are set up (run `scripts/setup-test-reports-storage.sql`)
2. Verify bucket exists: `campaign-files`
3. Check folder permissions: `test-reports/`
4. Check file size (limit: 50MB)

**Problem**: File deleted but still shows

**Solutions**:
1. Hard refresh the page (Ctrl+Shift+R)
2. Check browser cache
3. Verify file was deleted from storage

### Data Persistence Issues

**Problem**: Test results disappear after refresh

**Solutions**:
1. Ensure test reports are being saved (check console for errors)
2. Verify database connection
3. Check browser local storage

### Changelog Not Displaying

**Solutions**:
1. Verify changelog is JSONB array format
2. Check for empty changelog array
3. Ensure version has been saved properly

---

## File Locations

**Main Page**: `pages/tester.js`
**Database Scripts**: `scripts/setup-tester-tables.sql`
**Seed Data**: `scripts/seed-tester-data.js`
**Storage Policies**: `scripts/setup-test-reports-storage.sql`
**Version Scripts**: `scripts/add-version-*.js`
**Fetch Reports**: `scripts/fetch-test-reports.js`

---

## Future Enhancements

- [ ] Email notifications when new version is ready for testing
- [ ] Pass rate charts and graphs
- [ ] Test history timeline
- [ ] Bulk actions (mark multiple as pass/fail)
- [ ] Test assignment to specific testers
- [ ] Integration with GitHub issues
- [ ] Automated test result exports
- [ ] Screenshot annotations
- [ ] Video recording for bug reproduction

---

**Last Updated**: November 7, 2025
**Maintained By**: Development Team
**Version**: 1.7.0
