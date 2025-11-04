/**
 * Integration test for Facebook Auto-Login API
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testProxyAPI() {
  console.log('\n🧪 Testing Proxy API...\n');

  // Test adding proxies
  console.log('1. Adding proxies...');
  const addResponse = await fetch(`${BASE_URL}/api/proxy/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proxies: [
        '45.76.214.123:8080:user1:pass1',
        '192.168.1.100:3128:user2:pass2'
      ]
    })
  });
  const addData = await addResponse.json();
  console.log('✅ Add proxies:', addData);

  // Test listing proxies
  console.log('\n2. Listing proxies...');
  const listResponse = await fetch(`${BASE_URL}/api/proxy/list`);
  const listData = await listResponse.json();
  console.log('✅ List proxies:', listData);

  return listData.proxies && listData.proxies.length > 0;
}

async function testFacebookLoginAPI() {
  console.log('\n🧪 Testing Facebook Login API...\n');

  // Test initiating login
  console.log('1. Initiating Facebook login...');
  const loginResponse = await fetch(`${BASE_URL}/api/facebook/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123'
    })
  });
  const loginData = await loginResponse.json();
  console.log('✅ Login initiated:', loginData);

  if (!loginData.accountId) {
    console.error('❌ Failed to initiate login');
    return false;
  }

  const accountId = loginData.accountId;

  // Wait a bit for logs to be created
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test getting logs
  console.log('\n2. Getting login logs...');
  const logsResponse = await fetch(`${BASE_URL}/api/facebook/logs/${accountId}`);
  const logsData = await logsResponse.json();
  console.log('✅ Login logs:', JSON.stringify(logsData, null, 2));

  return logsData.success && logsData.logs.length > 0;
}

async function testCookieAPI() {
  console.log('\n🧪 Testing Cookie API...\n');

  // Test listing cookies
  console.log('1. Listing cookies...');
  const listResponse = await fetch(`${BASE_URL}/api/cookies/list`);
  const listData = await listResponse.json();
  console.log('✅ List cookies:', listData);

  return listData.success;
}

async function testTelegramAPI() {
  console.log('\n🧪 Testing Telegram API...\n');

  // Test Telegram config
  console.log('1. Testing Telegram configuration...');
  const configResponse = await fetch(`${BASE_URL}/api/telegram/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      botToken: '1234567890:ABCDefGhIjKlMnOpQrStUvWxYz',
      chatId: '123456789'
    })
  });
  const configData = await configResponse.json();
  console.log('✅ Telegram config:', configData);

  return configData.success;
}

async function runAllTests() {
  console.log('🚀 Starting Facebook Auto-Login API Integration Tests\n');
  console.log('Make sure the backend server is running on port 3000\n');

  try {
    const results = {
      proxy: await testProxyAPI(),
      facebookLogin: await testFacebookLoginAPI(),
      cookie: await testCookieAPI(),
      telegram: await testTelegramAPI()
    };

    console.log('\n\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Proxy API:          ${results.proxy ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Facebook Login API: ${results.facebookLogin ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Cookie API:         ${results.cookie ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Telegram API:       ${results.telegram ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r);
    console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error running tests:', error);
    process.exit(1);
  }
}

runAllTests();
