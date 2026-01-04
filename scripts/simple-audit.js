#!/usr/bin/env node

console.log('🔍 TapTap Matrix - Simple App Audit');
console.log('===================================\n');

async function testServer() {
  console.log('📡 Testing Development Server...');
  try {
    const response = await fetch('http://localhost:3000');
    console.log(`   ✅ Server Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Server: Not running`);
    return false;
  }
}

async function testHomePage() {
  console.log('\n🏠 Testing Home Page...');
  try {
    const response = await fetch('http://localhost:3000/home');
    const html = await response.text();
    
    const hasSignIn = html.includes('Sign in');
    const hasLoginRoute = html.includes('/login');
    const hasRouterPush = html.includes('routerPush');
    
    console.log(`   ${hasSignIn ? '✅' : '❌'} Sign-in text: ${hasSignIn}`);
    console.log(`   ${hasLoginRoute ? '✅' : '❌'} Login route: ${hasLoginRoute}`);
    console.log(`   ${hasRouterPush ? '✅' : '❌'} Router function: ${hasRouterPush}`);
    
    return hasSignIn && hasLoginRoute;
  } catch (error) {
    console.log(`   ❌ Home page failed: ${error.message}`);
    return false;
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing Auth Endpoints...');
  const endpoints = [
    '/api/auth/providers',
    '/api/auth/signin',
    '/api/auth/session'
  ];
  
  let working = 0;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      const status = response.status;
      if (status === 200 || status === 405) {
        console.log(`   ✅ ${endpoint}: ${status}`);
        working++;
      } else {
        console.log(`   ⚠️ ${endpoint}: ${status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint}: Failed`);
    }
  }
  return working >= 2;
}

async function testDebugPage() {
  console.log('\n🐛 Testing Debug Page...');
  try {
    const response = await fetch('http://localhost:3000/debug-signin');
    console.log(`   ${response.status === 200 ? '✅' : '❌'} Debug page: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ Debug page failed`);
    return false;
  }
}

async function testJavaScriptErrors() {
  console.log('\n🔧 Testing for Common Issues...');
  try {
    const response = await fetch('http://localhost:3000/home');
    const html = await response.text();
    
    // Check for common error patterns
    const hasHydrationError = html.includes('hydration') || html.includes('Hydration');
    const hasReactError = html.includes('React') && html.includes('error');
    const hasNextError = html.includes('Application error');
    const hasAuthError = html.includes('useAuth') && html.includes('error');
    
    console.log(`   ${!hasHydrationError ? '✅' : '❌'} No hydration errors: ${!hasHydrationError}`);
    console.log(`   ${!hasReactError ? '✅' : '❌'} No React errors: ${!hasReactError}`);
    console.log(`   ${!hasNextError ? '✅' : '❌'} No Next.js errors: ${!hasNextError}`);
    console.log(`   ${!hasAuthError ? '✅' : '❌'} No auth errors: ${!hasAuthError}`);
    
    return !hasHydrationError && !hasReactError && !hasNextError && !hasAuthError;
  } catch (error) {
    console.log(`   ❌ Error check failed`);
    return false;
  }
}

async function runAudit() {
  const results = {
    server: await testServer(),
    homePage: await testHomePage(),
    authEndpoints: await testAuthEndpoints(),
    debugPage: await testDebugPage(),
    noErrors: await testJavaScriptErrors()
  };
  
  console.log('\n📊 AUDIT RESULTS');
  console.log('================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  console.log(`\n🎯 Score: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  if (!results.server) {
    console.log('\n⚠️ CRITICAL: Dev server is not running!');
    console.log('   Run: npm run dev');
  } else if (!results.homePage) {
    console.log('\n⚠️ ISSUE: Sign-in button not working on home page');
    console.log('   Check: http://localhost:3000/debug-signin for detailed testing');
  } else if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! App should be working.');
  } else {
    console.log('\n⚠️ Some issues detected. Check browser console for errors.');
  }
  
  console.log('\n🔗 Quick Links:');
  console.log('   • Home: http://localhost:3000/home');
  console.log('   • Debug: http://localhost:3000/debug-signin');
  console.log('   • Auth: http://localhost:3000/api/auth/signin');
  
  return results;
}

runAudit().catch(console.error);
