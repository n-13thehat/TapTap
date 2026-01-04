#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🔍 Checking Home Page Rendering');
console.log('================================\n');

async function checkHomeRendering() {
  try {
    const response = await fetch('http://localhost:3000/home');
    const html = await response.text();
    
    console.log('📄 Home Page Analysis:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content Length: ${html.length} characters`);
    
    // Check for key components
    const checks = {
      'Sign in text': html.includes('Sign in'),
      'AuthPanel component': html.includes('AuthPanel'),
      'Router push': html.includes('routerPush'),
      'Login route': html.includes('/login'),
      'Signup route': html.includes('/signup'),
      'LogIn icon': html.includes('LogIn'),
      'Button onClick': html.includes('onClick'),
      'React hydration': html.includes('__NEXT_DATA__'),
      'Client components': html.includes('"use client"') || html.includes('client'),
      'SSR bailout': html.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING'),
      'Error messages': html.includes('Error:') || html.includes('error'),
      'Loading states': html.includes('loading') || html.includes('Loading'),
    };
    
    console.log('\n🔍 Component Analysis:');
    for (const [check, result] of Object.entries(checks)) {
      console.log(`   ${result ? '✅' : '❌'} ${check}: ${result}`);
    }
    
    // Look for specific patterns
    console.log('\n🎯 Key Patterns Found:');
    
    // Extract relevant sections
    const signInMatches = html.match(/Sign in[^<]*</gi) || [];
    const buttonMatches = html.match(/<button[^>]*>[^<]*Sign in[^<]*<\/button>/gi) || [];
    const routerMatches = html.match(/routerPush\([^)]*\)/gi) || [];
    
    console.log(`   Sign-in text occurrences: ${signInMatches.length}`);
    signInMatches.forEach((match, i) => console.log(`     ${i + 1}. ${match.trim()}`));
    
    console.log(`   Sign-in buttons: ${buttonMatches.length}`);
    buttonMatches.forEach((match, i) => console.log(`     ${i + 1}. ${match.trim().substring(0, 100)}...`));
    
    console.log(`   Router calls: ${routerMatches.length}`);
    routerMatches.forEach((match, i) => console.log(`     ${i + 1}. ${match.trim()}`));
    
    // Check for SSR issues
    if (html.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING')) {
      console.log('\n⚠️  SSR BAILOUT DETECTED!');
      console.log('   The page is falling back to client-side rendering');
      console.log('   This explains why the sign-in button is not working');
    }
    
    // Check for hydration issues
    if (!html.includes('__NEXT_DATA__')) {
      console.log('\n⚠️  HYDRATION ISSUE DETECTED!');
      console.log('   Missing Next.js hydration data');
      console.log('   React components may not be interactive');
    }
    
    // Summary
    console.log('\n📊 DIAGNOSIS:');
    console.log('==============');
    
    if (checks['SSR bailout']) {
      console.log('❌ PRIMARY ISSUE: SSR Bailout');
      console.log('   The page is not rendering server-side components properly');
      console.log('   This prevents the sign-in button from being interactive');
    } else if (!checks['Button onClick']) {
      console.log('❌ PRIMARY ISSUE: Missing Button Interactivity');
      console.log('   Sign-in buttons are not properly wired with onClick handlers');
    } else if (!checks['Router push']) {
      console.log('❌ PRIMARY ISSUE: Missing Router Logic');
      console.log('   Router push functions are not being rendered');
    } else {
      console.log('✅ Components appear to be rendering correctly');
    }
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    if (checks['SSR bailout']) {
      console.log('1. Fix SSR bailout issues in provider configuration');
      console.log('2. Ensure all providers are properly available during SSR');
      console.log('3. Check for client-only code running on server');
    }
    if (!checks['Button onClick']) {
      console.log('1. Verify AuthPanel component is rendering properly');
      console.log('2. Check if routerPush prop is being passed correctly');
      console.log('3. Ensure client-side JavaScript is loading');
    }
    
  } catch (error) {
    console.error('❌ Failed to check home page:', error.message);
  }
}

checkHomeRendering();
