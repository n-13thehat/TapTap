import fetch from 'node-fetch';

async function testAuthenticatedAccess() {
  try {
    console.log('🔍 Testing authenticated access...');
    
    const baseUrl = 'http://localhost:3000';
    const email = 'vx9@taptap.local';
    const password = 'N13thehat';
    
    // Step 1: Login and get session cookie
    console.log('🔐 Logging in...');
    const signinResponse = await fetch(`${baseUrl}/api/auth/signin`);
    const signinHtml = await signinResponse.text();
    const csrfMatch = signinHtml.match(/name="csrfToken"[^>]*value="([^"]+)"/);
    const csrfToken = csrfMatch[1];
    
    const loginData = new URLSearchParams({
      csrfToken: csrfToken,
      email: email,
      password: password,
      callbackUrl: `${baseUrl}/`,
      json: 'true'
    });
    
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': signinResponse.headers.get('set-cookie') || ''
      },
      body: loginData,
      redirect: 'manual'
    });
    
    const sessionCookie = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful, got session cookie');
    
    // Step 2: Test session endpoint
    console.log('📊 Testing session endpoint...');
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      headers: {
        'Cookie': sessionCookie || ''
      }
    });
    
    const sessionData = await sessionResponse.json();
    console.log('Session data:', sessionData);
    
    // Step 3: Test admin dashboard stats
    console.log('🔧 Testing admin dashboard stats...');
    const adminResponse = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
      headers: {
        'Cookie': sessionCookie || ''
      }
    });
    
    console.log('Admin stats response status:', adminResponse.status);
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('✅ Admin dashboard accessible:', Object.keys(adminData));
    } else {
      const errorText = await adminResponse.text();
      console.log('❌ Admin dashboard error:', errorText.substring(0, 200));
    }
    
    // Step 4: Test wallet balance
    console.log('💰 Testing wallet balance...');
    const walletResponse = await fetch(`${baseUrl}/api/wallet/balance`, {
      headers: {
        'Cookie': sessionCookie || ''
      }
    });
    
    console.log('Wallet response status:', walletResponse.status);
    if (walletResponse.ok) {
      const walletData = await walletResponse.json();
      console.log('✅ Wallet accessible:', walletData);
    } else {
      const errorText = await walletResponse.text();
      console.log('❌ Wallet error:', errorText.substring(0, 200));
    }
    
    console.log('\n🎯 AUTHENTICATION TEST COMPLETE!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  }
}

testAuthenticatedAccess();
