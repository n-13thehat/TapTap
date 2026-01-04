// Simple test to check if the sign-in flow is working

async function testSignInFlow() {
  console.log('🔍 Testing sign-in flow...');
  
  // Test 1: Check if home page loads
  console.log('\n1️⃣ Testing home page...');
  try {
    const homeResponse = await fetch('http://localhost:3000');
    console.log(`✅ Home page status: ${homeResponse.status}`);
    
    if (homeResponse.status === 200) {
      const homeHtml = await homeResponse.text();
      const hasSignInButton = homeHtml.includes('Sign in');
      console.log(`✅ Sign-in button present: ${hasSignInButton}`);
      
      // Check for any obvious JavaScript errors in the HTML
      const hasJSErrors = homeHtml.includes('SyntaxError') || homeHtml.includes('ReferenceError');
      console.log(`❌ JavaScript errors in HTML: ${hasJSErrors}`);
    }
  } catch (error) {
    console.error('❌ Home page error:', error.message);
  }
  
  // Test 2: Check if login page exists
  console.log('\n2️⃣ Testing login page...');
  try {
    const loginResponse = await fetch('http://localhost:3000/login');
    console.log(`✅ Login page status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      const loginHtml = await loginResponse.text();
      const hasNextAuth = loginHtml.includes('nextauth') || loginHtml.includes('signin');
      console.log(`✅ NextAuth elements present: ${hasNextAuth}`);
    }
  } catch (error) {
    console.error('❌ Login page error:', error.message);
  }
  
  // Test 3: Check NextAuth signin endpoint
  console.log('\n3️⃣ Testing NextAuth signin endpoint...');
  try {
    const authResponse = await fetch('http://localhost:3000/api/auth/signin');
    console.log(`✅ Auth signin status: ${authResponse.status}`);
  } catch (error) {
    console.error('❌ Auth signin error:', error.message);
  }
  
  // Test 4: Check NextAuth providers endpoint
  console.log('\n4️⃣ Testing NextAuth providers endpoint...');
  try {
    const providersResponse = await fetch('http://localhost:3000/api/auth/providers');
    console.log(`✅ Auth providers status: ${providersResponse.status}`);
    
    if (providersResponse.status === 200) {
      const providers = await providersResponse.json();
      console.log(`✅ Available providers:`, Object.keys(providers));
    }
  } catch (error) {
    console.error('❌ Auth providers error:', error.message);
  }
  
  console.log('\n🎯 Manual Testing Instructions:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Console tab');
  console.log('4. Click the "Sign in" button');
  console.log('5. Look for any red error messages in the console');
  console.log('6. Check if the page navigates to /login or /api/auth/signin');
  
  console.log('\n🔧 Common Issues to Check:');
  console.log('- JavaScript errors in browser console');
  console.log('- Network errors in Network tab');
  console.log('- Missing environment variables');
  console.log('- Database connection issues');
  console.log('- NextAuth configuration problems');
}

// Use node-fetch if available, otherwise provide manual instructions
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch not available in this Node.js version');
  console.log('🔧 Please test manually:');
  console.log('1. Open http://localhost:3000');
  console.log('2. Press F12 to open Developer Tools');
  console.log('3. Click "Sign in" button');
  console.log('4. Check Console tab for errors');
} else {
  testSignInFlow();
}
