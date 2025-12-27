#!/usr/bin/env node
/**
 * PMS Integration Script for Int-Video
 * Enables automatic two-way communication with PMS for version tracking
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const PMS_BASE_URL = 'https://pms.globaltechtrums.com';
const PMS_API_KEY = process.env.PMS_API_KEY;

if (!PMS_API_KEY) {
  console.error('Error: PMS_API_KEY not found in .env.local');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

function getArg(name) {
  const index = args.indexOf(`--${name}`);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return null;
}

async function pushVersion() {
  const version = getArg('version');
  const title = getArg('title');
  const changesFile = getArg('changes-file');
  const webhookUrl = getArg('webhook-url');

  if (!version) {
    console.error('Error: --version is required');
    console.log('Usage: node scripts/pms-integration.js push --version 2.0.5 --title "Bug Fixes"');
    process.exit(1);
  }

  let payload = {
    version_number: version,
    project_name: 'int-video',
    api_key: PMS_API_KEY,
    webhook_url: 'https://int-video.vercel.app/api/pms-webhook'
  };

  // Load from changes file if provided
  if (changesFile) {
    try {
      const filePath = path.resolve(changesFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const releaseNotes = JSON.parse(fileContent);
      payload = { ...payload, ...releaseNotes };
    } catch (error) {
      console.error(`Error reading changes file: ${error.message}`);
      process.exit(1);
    }
  } else if (title) {
    payload.release_title = title;
  }

  if (webhookUrl) {
    payload.webhook_url = webhookUrl;
  }

  console.log(`Pushing version ${version} to PMS...`);

  try {
    const response = await fetch(`${PMS_BASE_URL}/api/integrations/register-version`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PMS_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Success! Version pushed to PMS.');
      console.log(`Version ID: ${result.version_id || result.id}`);
      console.log(`Status: ${result.status || 'testing'}`);
      console.log(`\nTesters can view at: ${PMS_BASE_URL}/versions/${result.version_id || result.id}`);
    } else {
      console.error('Failed to push version:', result.error || result.message);
    }
  } catch (error) {
    console.error('Error connecting to PMS:', error.message);
  }
}

async function checkStatus() {
  const version = getArg('version');

  console.log('Checking PMS status...');

  try {
    let url = `${PMS_BASE_URL}/api/integrations/register-version?api_key=${PMS_API_KEY}&project_name=int-video`;
    if (version) {
      url += `&version_number=${version}`;
    }

    const response = await fetch(url, {
      headers: {
        'X-API-Key': PMS_API_KEY
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('\n=== PMS Status ===');
      if (Array.isArray(result.versions)) {
        result.versions.forEach(v => {
          console.log(`\nVersion: ${v.version_number}`);
          console.log(`  Status: ${v.status}`);
          console.log(`  Rebuild Requested: ${v.rebuild_requested ? 'YES' : 'No'}`);
          if (v.rebuild_notes) {
            console.log(`  Rebuild Notes: ${v.rebuild_notes}`);
          }
        });
      } else {
        console.log(`Version: ${result.version_number}`);
        console.log(`Status: ${result.status}`);
        console.log(`Rebuild Requested: ${result.rebuild_requested ? 'YES' : 'No'}`);
        if (result.rebuild_notes) {
          console.log(`Rebuild Notes: ${result.rebuild_notes}`);
        }
      }
    } else {
      console.error('Failed to get status:', result.error || result.message);
    }
  } catch (error) {
    console.error('Error connecting to PMS:', error.message);
  }
}

async function getFeedback() {
  const versionId = getArg('id');

  if (!versionId) {
    console.error('Error: --id is required');
    console.log('Usage: node scripts/pms-integration.js feedback --id <version-id>');
    process.exit(1);
  }

  console.log(`Getting feedback for version ${versionId}...`);

  try {
    const response = await fetch(`${PMS_BASE_URL}/api/integrations/version-feedback/${versionId}`, {
      headers: {
        'X-API-Key': PMS_API_KEY
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('\n=== Tester Feedback ===');
      console.log(`Version: ${result.version_number}`);
      console.log(`Overall Status: ${result.status}`);

      if (result.test_results && result.test_results.length > 0) {
        console.log('\nTest Results:');
        result.test_results.forEach((test, idx) => {
          console.log(`\n  ${idx + 1}. ${test.title}`);
          console.log(`     Status: ${test.status}`);
          if (test.notes) {
            console.log(`     Notes: ${test.notes}`);
          }
        });
      }

      console.log(`\nPassed: ${result.passed_count || 0}`);
      console.log(`Failed: ${result.failed_count || 0}`);
      console.log(`Pending: ${result.pending_count || 0}`);
    } else {
      console.error('Failed to get feedback:', result.error || result.message);
    }
  } catch (error) {
    console.error('Error connecting to PMS:', error.message);
  }
}

// Main
switch (command) {
  case 'push':
    pushVersion();
    break;
  case 'status':
    checkStatus();
    break;
  case 'feedback':
    getFeedback();
    break;
  default:
    console.log(`
PMS Integration Script for Int-Video

Commands:
  push      Push a new version to PMS
  status    Check version status and rebuild requests
  feedback  Get detailed tester feedback

Examples:
  node scripts/pms-integration.js push --version 2.0.5 --title "Bug Fixes"
  node scripts/pms-integration.js push --version 2.0.5 --changes-file release-notes.json
  node scripts/pms-integration.js status
  node scripts/pms-integration.js status --version 2.0.5
  node scripts/pms-integration.js feedback --id <version-id>
    `);
}
