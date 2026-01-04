#!/usr/bin/env node

console.log('🔍 Checking Home Page for Errors');
console.log('=================================\n');

async function checkHomePage() {
  try {
    const response = await fetch('http://localhost:3000/home');
    const html = await response.text();
    
    console.log('📄 Home Page Analysis:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content Length: ${html.length} characters`);
    
    // Check for sign-in button
    const signInMatches = html.match(/Sign in/g) || [];
    const loginRouteMatches = html.match(/\/login/g) || [];
    const routerPushMatches = html.match(/routerPush/g) || [];
    
    console.log('\n🔘 Sign-in Button Analysis:');
    console.log(`   "Sign in" text occurrences: ${signInMatches.length}`);
    console.log(`   "/login" route occurrences: ${loginRouteMatches.length}`);
    console.log(`   "routerPush" function occurrences: ${routerPushMatches.length}`);
    
    // Check for errors
    const errorPatterns = [
      { name: 'React Error', pattern: /React.*error/gi },
      { name: 'Hydration Error', pattern: /hydration.*error/gi },
      { name: 'Next.js Error', pattern: /Application error/gi },
      { name: 'Auth Error', pattern: /useAuth.*error/gi },
      { name: 'JavaScript Error', pattern: /Uncaught.*Error/gi },
      { name: 'Console Error', pattern: /console\.error/gi },
      { name: 'TypeError', pattern: /TypeError/gi },
      { name: 'ReferenceError', pattern: /ReferenceError/gi }
    ];
    
    console.log('\n❌ Error Detection:');
    let hasErrors = false;
    for (const { name, pattern } of errorPatterns) {
      const matches = html.match(pattern) || [];
      if (matches.length > 0) {
        console.log(`   ⚠️ ${name}: ${matches.length} occurrences`);
        hasErrors = true;
        // Show first few matches
        matches.slice(0, 3).forEach((match, i) => {
          console.log(`      ${i + 1}. ${match}`);
        });
      } else {
        console.log(`   ✅ ${name}: None found`);
      }
    }
    
    // Check for specific component issues
    console.log('\n🧩 Component Analysis:');
    const componentChecks = [
      { name: 'AuthPanel', pattern: /AuthPanel/g },
      { name: 'useRouter', pattern: /useRouter/g },
      { name: 'LogIn icon', pattern: /LogIn/g },
      { name: 'Button onClick', pattern: /onClick/g },
      { name: 'Router push', pattern: /router\.push/g }
    ];
    
    for (const { name, pattern } of componentChecks) {
      const matches = html.match(pattern) || [];
      console.log(`   ${matches.length > 0 ? '✅' : '❌'} ${name}: ${matches.length} occurrences`);
    }
    
    // Check if the page is server-side rendered or client-side
    const hasNextData = html.includes('__NEXT_DATA__');
    const hasReactRoot = html.includes('__next');
    
    console.log('\n🏗️ Rendering Analysis:');
    console.log(`   ✅ Next.js data: ${hasNextData}`);
    console.log(`   ✅ React root: ${hasReactRoot}`);
    
    // Extract any inline script errors
    const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
    console.log(`   📜 Inline scripts: ${scriptMatches.length}`);
    
    // Look for specific error messages in scripts
    for (const script of scriptMatches) {
      if (script.includes('error') || script.includes('Error')) {
        console.log('   ⚠️ Script with error found:');
        console.log('      ' + script.substring(0, 200) + '...');
      }
    }
    
    return {
      status: response.status,
      hasSignIn: signInMatches.length > 0,
      hasLoginRoute: loginRouteMatches.length > 0,
      hasRouterPush: routerPushMatches.length > 0,
      hasErrors,
      isSSR: hasNextData && hasReactRoot
    };
    
  } catch (error) {
    console.error('❌ Failed to check home page:', error.message);
    return null;
  }
}

async function checkDebugPage() {
  try {
    console.log('\n🐛 Debug Page Analysis:');
    const response = await fetch('http://localhost:3000/debug-signin');
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('   ✅ Debug page is accessible');
      console.log('   💡 Try visiting: http://localhost:3000/debug-signin');
    }
    
    return response.status === 200;
  } catch (error) {
    console.log('   ❌ Debug page failed:', error.message);
    return false;
  }
}

async function main() {
  const homePageResult = await checkHomePage();
  const debugPageResult = await checkDebugPage();
  
  console.log('\n📊 SUMMARY');
  console.log('===========');
  
  if (homePageResult) {
    console.log(`✅ Home page loads: ${homePageResult.status === 200}`);
    console.log(`${homePageResult.hasSignIn ? '✅' : '❌'} Sign-in text present: ${homePageResult.hasSignIn}`);
    console.log(`${homePageResult.hasLoginRoute ? '✅' : '❌'} Login route present: ${homePageResult.hasLoginRoute}`);
    console.log(`${homePageResult.hasRouterPush ? '✅' : '❌'} Router function present: ${homePageResult.hasRouterPush}`);
    console.log(`${!homePageResult.hasErrors ? '✅' : '❌'} No errors detected: ${!homePageResult.hasErrors}`);
    console.log(`${homePageResult.isSSR ? '✅' : '❌'} Proper SSR: ${homePageResult.isSSR}`);
  }
  
  console.log(`${debugPageResult ? '✅' : '❌'} Debug page accessible: ${debugPageResult}`);
  
  console.log('\n🎯 RECOMMENDATIONS:');
  if (homePageResult && !homePageResult.hasLoginRoute) {
    console.log('   • The sign-in button code exists but may not be rendering properly');
    console.log('   • Check browser console (F12) for JavaScript errors');
    console.log('   • Try the debug page: http://localhost:3000/debug-signin');
  }
  
  if (homePageResult && homePageResult.hasErrors) {
    console.log('   • JavaScript errors detected in the page');
    console.log('   • Open browser dev tools to see specific errors');
  }
  
  console.log('   • Test the debug page for isolated sign-in testing');
  console.log('   • Check browser console for runtime errors');
}

main().catch(console.error);
