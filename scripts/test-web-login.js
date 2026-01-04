import fetch from 'node-fetch';

async function testWebLogin() {
  try {
    console.log('🔍 Testing web login functionality...');
    
    const baseUrl = 'http://localhost:3000';
    const email = 'vx9@taptap.local';
    const password = 'N13thehat';
    
    // Step 1: Get CSRF token from signin page
    console.log('📄 Getting signin page...');
    const signinResponse = await fetch(`${baseUrl}/api/auth/signin`);
    const signinHtml = await signinResponse.text();
    
    // Extract CSRF token
    const csrfMatch = signinHtml.match(/name="csrfToken"[^>]*value="([^"]+)"/);
    if (!csrfMatch) {
      console.log('❌ Could not find CSRF token');
      return;
    }
    
    const csrfToken = csrfMatch[1];
    console.log('✅ CSRF token obtained:', csrfToken.substring(0, 20) + '...');
    
    // Step 2: Attempt login
    console.log('🔐 Attempting login...');
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
    
    console.log('📊 Login response status:', loginResponse.status);
    console.log('📊 Login response headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.status === 302) {
      const location = loginResponse.headers.get('location');
      console.log('✅ Login successful! Redirecting to:', location);
      
      if (location && location.includes('error')) {
        console.log('❌ Login failed - redirected to error page');
        const errorResponse = await fetch(`${baseUrl}${location}`);
        const errorText = await errorResponse.text();
        console.log('Error page content:', errorText.substring(0, 500));
      } else {
        console.log('🎯 LOGIN TEST SUCCESSFUL!');
        console.log('User can now authenticate through the web interface');
      }
    } else {
      const responseText = await loginResponse.text();
      console.log('❌ Unexpected response:', responseText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Web login test failed:', error.message);
  }
}

testWebLogin();
