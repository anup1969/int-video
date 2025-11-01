# Changelog

All notable changes to the Interactive Video Platform will be documented in this file.

The format follows [Semantic Versioning](https://semver.org/):
- MAJOR version (X.0.0) for incompatible API changes
- MINOR version (0.X.0) for new functionality in a backwards compatible manner
- PATCH version (0.0.X) for backwards compatible bug fixes

## [1.2.0] - 2025-11-01

### Description
Added video autoplay with unmute functionality for better user engagement.

### Features Added
- Video autoplay on muted state for immediate engagement
- Unmute button overlay in top-left corner of video
- Click unmute button to restart video from beginning with sound
- Auto-hide unmute button after clicking
- Translucent button design with mute icon and clear call-to-action
- playsInline attribute for better mobile compatibility

### User Experience
- Videos now start playing automatically when user lands on campaign
- Muted autoplay respects browser policies
- Clear visual prompt to unmute and replay with sound
- Smooth transition from muted to unmuted playback

### Technical Details
- Commit: (will be added after commit)
- Files Modified:
  - pages/campaign/[id].js - Added video autoplay, unmute button, and state management
  - package.json - Version bump to 1.2.0
  - CHANGELOG.md - This entry

### Rollback Instructions
To rollback to v1.1.1:
```bash
git checkout 26513e1
vercel --prod
vercel alias <deployment-url> int-video.vercel.app
```

---

## [1.1.1] - 2025-11-01

### Description
Bug fixes for logic rules and URL redirects.

### Fixed
- Logic rule matching for button conditions (button_0, button_1, etc.) now works correctly
- URL redirects now automatically add https:// protocol if missing
- Campaign viewer no longer shows "campaign not found" error when clicking URL redirect buttons

### Technical Details
- Commit: 26513e1
- Files Modified:
  - pages/campaign/[id].js - Fixed logic rule matching and URL protocol handling
  - package.json - Version bump to 1.1.1
  - CHANGELOG.md - This entry

### Rollback Instructions
To rollback to v1.1.0:
```bash
git checkout 05865b9
vercel --prod
vercel alias <deployment-url> int-video.vercel.app
```

---

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
- Commit: 05865b9
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
