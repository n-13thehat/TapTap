#!/usr/bin/env node

/**
 * Test the sign-in flow by simulating the button click
 */

console.log('🔐 Testing Sign-In Flow');
console.log('======================\n');

// Test 1: Check if /login page works
console.log('📝 Testing /login page...');
try {
  const response = await fetch('http://localhost:3000/login');
  console.log(`✅ /login page status: ${response.status}`);
  
  if (response.status === 200) {
    const html = await response.text();
    if (html.includes('Redirecting') || html.includes('Checking authentication')) {
      console.log('✅ Login page is working (shows loading/redirect)');
    } else {
      console.log('⚠️ Login page content might be unexpected');
    }
  }
} catch (error) {
  console.log(`❌ /login page failed: ${error.message}`);
}

// Test 2: Check if /api/auth/signin works
console.log('\n🌐 Testing /api/auth/signin...');
try {
  const response = await fetch('http://localhost:3000/api/auth/signin');
  console.log(`✅ /api/auth/signin status: ${response.status}`);
  
  if (response.status === 200) {
    const html = await response.text();
    if (html.includes('Sign in') || html.includes('credentials')) {
      console.log('✅ NextAuth signin page is rendering');
    } else {
      console.log('⚠️ NextAuth signin page content might be unexpected');
    }
  }
} catch (error) {
  console.log(`❌ /api/auth/signin failed: ${error.message}`);
}

// Test 3: Check if we can access the home page
console.log('\n🏠 Testing home page...');
try {
  const response = await fetch('http://localhost:3000/home');
  console.log(`✅ /home page status: ${response.status}`);
} catch (error) {
  console.log(`❌ /home page failed: ${error.message}`);
}

// Test 4: Check if we can access the root page
console.log('\n🌍 Testing root page...');
try {
  const response = await fetch('http://localhost:3000/');
  console.log(`✅ Root page status: ${response.status}`);
} catch (error) {
  console.log(`❌ Root page failed: ${error.message}`);
}

console.log('\n🔍 Sign-in flow test completed!');
console.log('\n💡 Next steps:');
console.log('1. Open http://localhost:3000 in your browser');
console.log('2. Open browser DevTools (F12)');
console.log('3. Click the "Sign in" button');
console.log('4. Check the Console tab for any error messages');
console.log('5. Check the Network tab to see which requests are failing');
