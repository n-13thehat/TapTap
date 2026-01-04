import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testAuthEndpoints() {
  console.log('🔐 Testing Authentication Endpoints...\n');

  try {
    // Test 1: Check if auth endpoints are responding
    console.log('1. Testing NextAuth endpoints...');
    
    const authResponse = await fetch(`${BASE_URL}/api/auth/providers`);
    console.log(`   GET /api/auth/providers: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const providers = await authResponse.json();
      console.log(`   Available providers: ${Object.keys(providers).join(', ')}`);
    }

    // Test 2: Test CSRF token endpoint
    console.log('\n2. Testing CSRF token...');
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    console.log(`   GET /api/auth/csrf: ${csrfResponse.status}`);
    
    if (csrfResponse.ok) {
      const csrf = await csrfResponse.json();
      console.log(`   CSRF token received: ${csrf.csrfToken ? 'Yes' : 'No'}`);
    }

    // Test 3: Test session endpoint
    console.log('\n3. Testing session endpoint...');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    console.log(`   GET /api/auth/session: ${sessionResponse.status}`);
    
    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      console.log(`   Session data: ${JSON.stringify(session, null, 2)}`);
    }

    // Test 4: Test admin dashboard stats (should require auth)
    console.log('\n4. Testing admin endpoints (should be protected)...');
    const adminResponse = await fetch(`${BASE_URL}/api/admin/dashboard-stats`);
    console.log(`   GET /api/admin/dashboard-stats: ${adminResponse.status}`);
    
    if (!adminResponse.ok) {
      console.log(`   Expected protection: ${adminResponse.statusText}`);
    }

    console.log('\n✅ Authentication endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Error testing auth endpoints:', error.message);
  }
}

// Run the test
testAuthEndpoints();
