#!/usr/bin/env node

console.log('🧪 Testing TapTap Matrix Dashboard');
console.log('==================================\n');

async function testDashboard() {
  try {
    console.log('🚀 Testing dashboard route...');
    
    const response = await fetch('http://localhost:3000/dashboard');
    const html = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📏 Content Length: ${html.length} bytes`);
    
    // Check for key dashboard elements
    const checks = {
      'Dashboard Page': html.includes('Welcome back'),
      'Sidebar Navigation': html.includes('TapTap Matrix') && html.includes('Dashboard'),
      'User Info': html.includes('CREATOR') || html.includes('ADMIN') || html.includes('LISTENER'),
      'Navigation Items': html.includes('Social') && html.includes('Library'),
      'Featured Sections': html.includes('Trending Now') || html.includes('Social Feed'),
      'Interactive Elements': html.includes('href=') && html.includes('button'),
      'Styling': html.includes('bg-gradient-to-br') && html.includes('text-white'),
      'React Hydration': html.includes('__NEXT_DATA__'),
      'No Errors': !html.includes('Error') && !html.includes('error')
    };
    
    console.log('\n✅ Dashboard Feature Checks:');
    console.log('============================');
    
    let passCount = 0;
    const totalChecks = Object.keys(checks).length;
    
    for (const [feature, passed] of Object.entries(checks)) {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${feature.padEnd(20)} - ${passed ? 'PASS' : 'FAIL'}`);
      if (passed) passCount++;
    }
    
    console.log(`\n📈 Dashboard Health: ${passCount}/${totalChecks} (${Math.round((passCount/totalChecks)*100)}%)`);
    
    if (passCount === totalChecks) {
      console.log('\n🎉 Dashboard is fully functional!');
      console.log('✨ Ready for user testing and sign-in flow');
    } else if (passCount >= totalChecks * 0.8) {
      console.log('\n⚠️  Dashboard is mostly working with minor issues');
      console.log('🔧 Consider addressing failed checks for optimal experience');
    } else {
      console.log('\n❌ Dashboard has significant issues');
      console.log('🚨 Requires immediate attention before user testing');
    }
    
    // Test sign-in redirect flow
    console.log('\n🔐 Testing Sign-in Redirect Flow:');
    console.log('=================================');
    
    try {
      const loginResponse = await fetch('http://localhost:3000/login', { redirect: 'manual' });
      console.log(`📍 Login redirect status: ${loginResponse.status}`);
      
      if (loginResponse.status === 302 || loginResponse.status === 307) {
        const location = loginResponse.headers.get('location');
        console.log(`🎯 Redirects to: ${location}`);
        
        if (location && location.includes('/api/auth/signin')) {
          console.log('✅ Login flow correctly redirects to NextAuth');
        } else if (location && location.includes('/dashboard')) {
          console.log('✅ Already authenticated - redirects to dashboard');
        } else {
          console.log('⚠️  Unexpected redirect location');
        }
      } else {
        console.log('ℹ️  Login page loads directly (no redirect)');
      }
    } catch (error) {
      console.log(`❌ Login flow test failed: ${error.message}`);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Test sign-in with credentials: vx9@taptap.local / N13thehat');
    console.log('2. Verify dashboard loads after authentication');
    console.log('3. Test navigation between all sidebar routes');
    console.log('4. Verify featured content displays correctly');
    console.log('5. Test responsive design on mobile devices');
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Ensure development server is running on port 3000');
    console.log('- Check for any build errors or missing dependencies');
    console.log('- Verify database connection is working');
  }
}

testDashboard();
