// Script to view API logs
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(process.cwd(), 'logs', 'api.log');

console.log('📋 API Logs:');
console.log('═══════════════════════════════════════════════════════════\n');

if (!fs.existsSync(LOG_FILE)) {
  console.log('⚠️  No log file found yet. Logs will be created when API routes are called.\n');
  console.log(`Expected location: ${LOG_FILE}\n`);
  process.exit(0);
}

const logs = fs.readFileSync(LOG_FILE, 'utf8');
const lines = logs.trim().split('\n');

// Show last 50 lines
const recentLines = lines.slice(-50);

recentLines.forEach(line => {
  try {
    const log = JSON.parse(line);
    const timestamp = new Date(log.timestamp).toLocaleString();
    const levelColor = {
      'INFO': '\x1b[32m',    // Green
      'ERROR': '\x1b[31m',   // Red
      'WARN': '\x1b[33m',    // Yellow
      'DEBUG': '\x1b[36m',   // Cyan
    }[log.level] || '\x1b[0m';

    console.log(`${levelColor}[${log.level}]\x1b[0m ${timestamp} - ${log.message}`);
    if (log.data) {
      console.log('  Data:', JSON.stringify(log.data, null, 2));
    }
    console.log();
  } catch (e) {
    console.log(line);
  }
});

console.log('═══════════════════════════════════════════════════════════');
console.log(`Total log entries: ${lines.length}`);
console.log(`Showing: Last ${recentLines.length} entries`);
