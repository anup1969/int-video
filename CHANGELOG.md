# Changelog

All notable changes to the Interactive Video Platform will be documented in this file.

The format follows [Semantic Versioning](https://semver.org/):
- MAJOR version (X.0.0) for incompatible API changes
- MINOR version (0.X.0) for new functionality in a backwards compatible manner
- PATCH version (0.0.X) for backwards compatible bug fixes

## [1.1.0] - 2025-11-01

### Description
Added campaign response tracking and analytics.

### Features Added
- Session-based user response tracking
- Automatic response saving to database on each step
- Campaign completion tracking
- Duration/time tracking for each session
- Device type detection (mobile/desktop)
- User agent tracking
- Contact information capture (name, email) when provided

### Technical Details
- Commit: (will be added after commit)
- Files Modified:
  - pages/campaign/[id].js - Added saveResponse function and session tracking
  - package.json - Version bump to 1.1.0
  - CHANGELOG.md - This entry

### How It Works
- Generates unique session ID per campaign visitor
- Saves response after each step interaction
- Tracks total duration from campaign start
- Marks campaign as completed when user finishes all steps
- Stores all data in responses table via /api/campaigns/[id]/responses endpoint

### Rollback Instructions
To rollback to v1.0.0:
```bash
git checkout 577b95e
vercel --prod
vercel alias <deployment-url> int-video.vercel.app
```

---

## [1.0.0] - 2025-11-01

### Description
Stable baseline version with working campaign viewer.

### Features
- Campaign builder with drag-and-drop interface
- Multiple answer types: Multiple Choice, Button/CTA, Contact Form, NPS, Open-Ended
- Logic rules for conditional navigation between steps
- Video player with placeholder for steps without videos
- Card-based campaign viewer layout
- Responsive design (mobile, tablet, desktop)
- Supabase integration for data storage
- API endpoints for campaigns, steps, and responses

### Fixed
- API response structure transformation (steps → nodes mapping)
- Campaign viewer properly handles new API format

### Technical Details
- Commit: 32e5e57
- Deployment URL: https://int-video.vercel.app
- Files: All core campaign builder and viewer functionality

### Rollback Instructions
To rollback to this version:
```bash
git checkout 32e5e57
vercel --prod
vercel alias <deployment-url> int-video.vercel.app
```

---

## Version History

| Version | Date | Commit | Description | Status |
|---------|------|--------|-------------|--------|
| 1.0.0 | 2025-11-01 | 32e5e57 | Stable baseline with API fix | ✅ Current |

---

## Notes

- Always update this file when making significant changes
- Include commit hash for easy rollback
- Mark breaking changes clearly
- Include rollback instructions for critical versions
