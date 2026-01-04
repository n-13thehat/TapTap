#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🔗 Testing Sign-In Button Routing Flow');
console.log('======================================\n');

async function testSignInRouting() {
  try {
    console.log('1️⃣ Testing Home Page Sign-In Button...');
    
    // Test home page
    const homeResponse = await fetch('http://localhost:3000/home');
    const homeHtml = await homeResponse.text();
    
    // Check for sign-in button and routing
    const hasSignInButton = homeHtml.includes('Sign in') && homeHtml.includes('LogIn');
    const hasLoginRoute = homeHtml.includes('routerPush("/login")');
    const hasSignupRoute = homeHtml.includes('routerPush("/signup")');
    
    console.log(`   ✅ Home page loads: ${homeResponse.status === 200}`);
    console.log(`   ${hasSignInButton ? '✅' : '❌'} Sign-in button present: ${hasSignInButton}`);
    console.log(`   ${hasLoginRoute ? '✅' : '❌'} Login route configured: ${hasLoginRoute}`);
    console.log(`   ${hasSignupRoute ? '✅' : '❌'} Signup route configured: ${hasSignupRoute}`);
    
    console.log('\n2️⃣ Testing /login Route...');
    
    // Test login page
    const loginResponse = await fetch('http://localhost:3000/login');
    const loginHtml = await loginResponse.text();
    
    // Check if login page redirects properly
    const hasAuthRedirect = loginHtml.includes('/api/auth/signin') || loginHtml.includes('Redirecting');
    const hasLoadingState = loginHtml.includes('Checking authentication') || loginHtml.includes('loading');
    
    console.log(`   ✅ Login page loads: ${loginResponse.status === 200}`);
    console.log(`   ${hasAuthRedirect ? '✅' : '❌'} Auth redirect configured: ${hasAuthRedirect}`);
    console.log(`   ${hasLoadingState ? '✅' : '❌'} Loading state present: ${hasLoadingState}`);
    
    console.log('\n3️⃣ Testing /signup Route...');
    
    // Test signup page
    const signupResponse = await fetch('http://localhost:3000/signup');
    const signupHtml = await signupResponse.text();
    
    const hasSignupRedirect = signupHtml.includes('/api/auth/signin') || signupHtml.includes('Redirecting');
    const hasSignupLoading = signupHtml.includes('Checking authentication') || signupHtml.includes('loading');
    
    console.log(`   ✅ Signup page loads: ${signupResponse.status === 200}`);
    console.log(`   ${hasSignupRedirect ? '✅' : '❌'} Auth redirect configured: ${hasSignupRedirect}`);
    console.log(`   ${hasSignupLoading ? '✅' : '❌'} Loading state present: ${hasSignupLoading}`);
    
    console.log('\n4️⃣ Testing Final Auth Endpoint...');
    
    // Test auth endpoint
    const authResponse = await fetch('http://localhost:3000/api/auth/signin');
    console.log(`   ✅ NextAuth signin page: ${authResponse.status === 200}`);
    
    // Summary
    console.log('\n📊 ROUTING FLOW ANALYSIS');
    console.log('=========================');
    
    const homeWorking = homeResponse.status === 200 && hasSignInButton && hasLoginRoute;
    const loginWorking = loginResponse.status === 200 && hasAuthRedirect;
    const signupWorking = signupResponse.status === 200 && hasSignupRedirect;
    const authWorking = authResponse.status === 200;
    
    console.log(`🏠 Home → Sign-in Button: ${homeWorking ? '✅ WORKING' : '❌ ISSUES'}`);
    console.log(`🔗 /login → Auth Redirect: ${loginWorking ? '✅ WORKING' : '❌ ISSUES'}`);
    console.log(`📝 /signup → Auth Redirect: ${signupWorking ? '✅ WORKING' : '❌ ISSUES'}`);
    console.log(`🔐 Auth Endpoint: ${authWorking ? '✅ WORKING' : '❌ ISSUES'}`);
    
    console.log('\n🎯 ROUTING FLOW:');
    console.log('================');
    console.log('1. User clicks "Sign in" button on /home');
    console.log('2. Button calls routerPush("/login")');
    console.log('3. /login page checks auth status');
    console.log('4. If not authenticated → redirects to /api/auth/signin');
    console.log('5. NextAuth handles authentication');
    
    if (homeWorking && loginWorking && authWorking) {
      console.log('\n🎉 ROUTING IS WORKING CORRECTLY!');
      console.log('✅ Sign-in button → /login → /api/auth/signin flow is complete');
    } else {
      console.log('\n⚠️  Issues detected in routing flow');
      if (!homeWorking) console.log('   🔧 Fix: Check home page sign-in button implementation');
      if (!loginWorking) console.log('   🔧 Fix: Check /login page redirect logic');
      if (!authWorking) console.log('   🔧 Fix: Check NextAuth configuration');
    }
    
  } catch (error) {
    console.error('❌ Routing test failed:', error.message);
  }
}

testSignInRouting();
