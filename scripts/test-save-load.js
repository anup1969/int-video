// Script to test save and load functionality
const http = require('http');

const BASE_URL = 'http://localhost:3002';

// Test data
const testCampaign = {
  nodes: [
    {
      id: 'test-uuid-1',
      type: 'video',
      stepNumber: 1,
      label: 'Test Node 1',
      answerType: 'button',
      position: { x: 400, y: 200 },
      videoUrl: null,
      mcOptions: [],
      buttonOptions: [{ text: 'Next', target: '', targetType: 'node' }],
      buttonShowTime: 5,
      logicRules: [{ label: 'Button: Next', target: 'test-uuid-2', targetType: 'node' }]
    },
    {
      id: 'test-uuid-2',
      type: 'video',
      stepNumber: 2,
      label: 'Test Node 2',
      answerType: 'button',
      position: { x: 700, y: 200 },
      videoUrl: null,
      mcOptions: [],
      buttonOptions: [{ text: 'End', target: '', targetType: 'end' }],
      buttonShowTime: 3,
      logicRules: []
    }
  ],
  connections: [
    {
      from: 'test-uuid-1',
      to: 'test-uuid-2',
      type: 'logic'
    }
  ],
  settings: {
    name: 'Test Campaign - Save/Load Test'
  }
};

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Testing Save/Load Functionality\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create a campaign
    console.log('📝 Step 1: Creating test campaign...');
    const createRes = await makeRequest('POST', '/api/campaigns', {
      name: 'Test Campaign - Save/Load Test',
      status: 'draft'
    });

    if (createRes.status !== 201) {
      console.error('❌ Failed to create campaign:', createRes);
      return;
    }

    const campaignId = createRes.data.campaign.id;
    console.log(`✅ Campaign created: ${campaignId}\n`);

    // Step 2: Save campaign data
    console.log('💾 Step 2: Saving campaign with test data...');
    console.log('   - 2 nodes');
    console.log('   - 1 connection');
    console.log('   - buttonShowTime: 5s and 3s\n');

    const saveRes = await makeRequest('POST', `/api/campaigns/${campaignId}/save`, testCampaign);

    if (saveRes.status !== 200) {
      console.error('❌ Save failed:', saveRes);
      return;
    }

    console.log('✅ Campaign saved successfully\n');

    // Step 3: Load the campaign back
    console.log('📥 Step 3: Loading campaign...');
    const loadRes = await makeRequest('GET', `/api/campaigns/${campaignId}`);

    if (loadRes.status !== 200) {
      console.error('❌ Load failed:', loadRes);
      return;
    }

    console.log('✅ Campaign loaded successfully\n');

    // Step 4: Verify data
    console.log('🔍 Step 4: Verifying data integrity...\n');

    const { steps, connections } = loadRes.data;

    // Check step count
    if (steps.length !== 2) {
      console.error(`❌ Expected 2 steps, got ${steps.length}`);
      return;
    }
    console.log('✅ Step count: 2');

    // Check connection count
    if (connections.length !== 1) {
      console.error(`❌ Expected 1 connection, got ${connections.length}`);
      return;
    }
    console.log('✅ Connection count: 1');

    // Check buttonShowTime on first step
    const step1 = steps.find(s => s.step_number === 1);
    if (step1.data.buttonShowTime !== 5) {
      console.error(`❌ Step 1 buttonShowTime: Expected 5, got ${step1.data.buttonShowTime}`);
      return;
    }
    console.log('✅ Step 1 buttonShowTime: 5');

    // Check buttonShowTime on second step
    const step2 = steps.find(s => s.step_number === 2);
    if (step2.data.buttonShowTime !== 3) {
      console.error(`❌ Step 2 buttonShowTime: Expected 3, got ${step2.data.buttonShowTime}`);
      return;
    }
    console.log('✅ Step 2 buttonShowTime: 3');

    // Check logic rules
    if (!step1.data.logicRules || step1.data.logicRules.length === 0) {
      console.error('❌ Step 1 has no logic rules');
      return;
    }
    console.log('✅ Step 1 has logic rules');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED! Save/Load is working correctly.');
    console.log('═══════════════════════════════════════════════════════\n');

    // Step 5: Cleanup
    console.log('🧹 Cleaning up test campaign...');
    await makeRequest('DELETE', `/api/campaigns/${campaignId}`);
    console.log('✅ Test campaign deleted\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

runTest();
