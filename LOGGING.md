# API Logging System

## Overview

The application includes a file-based logging system for tracking API requests, responses, and errors. This helps with debugging and monitoring the application.

## Log Location

All logs are stored in:
```
/logs/api.log
```

This file is automatically created when the first API call is made.

## Viewing Logs

### Method 1: Using the npm script (Recommended)
```bash
npm run logs
```

This will display the last 50 log entries in a color-coded format.

### Method 2: Direct file access
```bash
# Windows
type logs\api.log

# Mac/Linux
cat logs/api.log

# Tail the file (watch in real-time)
tail -f logs/api.log
```

## Log Format

Each log entry is a JSON object with the following structure:

```json
{
  "timestamp": "2025-10-31T10:30:45.123Z",
  "level": "INFO",
  "message": "Save campaign request",
  "data": {
    "campaignId": "abc-123",
    "nodeCount": 3,
    "connectionCount": 2
  }
}
```

### Log Levels

- **INFO** - General information (green)
- **WARN** - Warning messages (yellow)
- **ERROR** - Error messages (red)
- **DEBUG** - Debug information (cyan)

## What Gets Logged

### Campaign Operations
- **Save Campaign**: Campaign ID, node count, connection count, ID mappings
- **Load Campaign**: Campaign ID, step count, connection count
- **Step Insertion**: Step count, generated UUID mappings
- **Connection Creation**: Connection count, from/to node mappings

### Error Scenarios
- Database errors with full error messages and stack traces
- Invalid node references in connections
- Missing or malformed data

## Usage in Code

To add logging to your API routes:

```javascript
import logger from '../../../lib/logger'

// Info level
logger.info('Operation completed', { userId: '123', action: 'save' })

// Error level
logger.error('Operation failed', { error: error.message, stack: error.stack })

// Warning level
logger.warn('Invalid data detected', { field: 'email', value: 'invalid' })

// Debug level
logger.debug('Processing data', { data: complexObject })
```

## Maintenance

### Clearing Logs

To clear old logs:

```bash
# Windows
del logs\api.log

# Mac/Linux
rm logs/api.log
```

The file will be automatically recreated on the next API call.

### Log Rotation

For production environments, consider implementing log rotation to prevent the file from growing too large. You can use tools like:
- **logrotate** (Linux)
- **Windows Task Scheduler** with custom scripts
- Cloud logging services (CloudWatch, Loggly, etc.)

## Production Notes

**Important**: In production (Vercel), file-based logging won't work because the filesystem is read-only. Logs will only appear in the Vercel function logs. Use:

```bash
vercel logs [deployment-url]
```

For production logging, consider migrating to:
- Vercel's built-in logging
- External logging services (Datadog, Sentry, LogRocket)
- Database-based logging
