#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🔍 Checking Test Sign-In Page');
console.log('==============================\n');

async function checkTestSignIn() {
  try {
    const response = await fetch('http://localhost:3000/test-signin');
    const html = await response.text();
    
    console.log('📄 Test Sign-In Page Analysis:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content Length: ${html.length} characters`);
    
    // Check for key components
    const checks = {
      'Sign in text': html.includes('Sign in'),
      'onClick handlers': html.includes('onClick'),
      'React hydration': html.includes('__NEXT_DATA__'),
      'Client components': html.includes('"use client"') || html.includes('client'),
      'SSR bailout': html.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING'),
      'Button elements': html.includes('<button'),
      'Router usage': html.includes('router.push') || html.includes('useRouter'),
      'Alert function': html.includes('alert'),
      'Console.log': html.includes('console.log'),
    };
    
    console.log('\n🔍 Component Analysis:');
    for (const [check, result] of Object.entries(checks)) {
      console.log(`   ${result ? '✅' : '❌'} ${check}: ${result}`);
    }
    
    // Look for specific patterns
    console.log('\n🎯 Key Patterns Found:');
    
    // Extract button elements
    const buttonMatches = html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
    console.log(`   Button elements: ${buttonMatches.length}`);
    buttonMatches.forEach((match, i) => {
      const truncated = match.length > 100 ? match.substring(0, 100) + '...' : match;
      console.log(`     ${i + 1}. ${truncated.replace(/\s+/g, ' ').trim()}`);
    });
    
    // Check for JavaScript functionality
    const hasJavaScript = html.includes('<script') || html.includes('_next/static');
    console.log(`   JavaScript files: ${hasJavaScript ? 'Present' : 'Missing'}`);
    
    // Check for hydration data
    const hasHydrationData = html.includes('__NEXT_DATA__');
    console.log(`   Next.js hydration data: ${hasHydrationData ? 'Present' : 'Missing'}`);
    
    console.log('\n📊 DIAGNOSIS:');
    console.log('==============');
    
    if (response.status !== 200) {
      console.log('❌ PRIMARY ISSUE: Page not loading properly');
      console.log(`   HTTP Status: ${response.status}`);
    } else if (checks['SSR bailout']) {
      console.log('⚠️  SSR BAILOUT DETECTED!');
      console.log('   The page is falling back to client-side rendering');
    } else if (!hasJavaScript) {
      console.log('❌ PRIMARY ISSUE: Missing JavaScript');
      console.log('   Client-side functionality may not work');
    } else if (!hasHydrationData) {
      console.log('⚠️  HYDRATION ISSUE DETECTED!');
      console.log('   Missing Next.js hydration data');
    } else {
      console.log('✅ Page appears to be rendering correctly');
      console.log('   All basic checks passed');
    }
    
  } catch (error) {
    console.error('❌ Error checking test sign-in page:', error.message);
  }
}

checkTestSignIn();
