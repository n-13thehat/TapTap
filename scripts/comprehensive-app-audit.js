#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

console.log('🔍 TapTap Matrix - Comprehensive App Audit');
console.log('==========================================\n');

// Test 1: Check if dev server is running
async function testDevServer() {
  console.log('📡 Testing Development Server...');
  try {
    const response = await fetch('http://localhost:3000');
    const status = response.status;
    console.log(`   ✅ Dev Server: Running (Status: ${status})`);
    return true;
  } catch (error) {
    console.log(`   ❌ Dev Server: Not running (${error.message})`);
    return false;
  }
}

// Test 2: Check critical files
async function testCriticalFiles() {
  console.log('\n📁 Testing Critical Files...');
  const criticalFiles = [
    'package.json',
    'next.config.js',
    'app/layout.jsx',
    'app/home/page.tsx',
    'auth.config.js',
    'lib/prisma.js',
    'providers/AuthProvider.tsx',
    'providers/ConsolidatedProvider.tsx',
    'hooks/useAuth.ts',
    'components/ClientLayoutWrapper.tsx',
    'app/api/auth/[...nextauth]/route.ts'
  ];

  let allFilesExist = true;
  for (const file of criticalFiles) {
    try {
      await fs.access(file);
      console.log(`   ✅ ${file}: Exists`);
    } catch (error) {
      console.log(`   ❌ ${file}: Missing`);
      allFilesExist = false;
    }
  }
  return allFilesExist;
}

// Test 3: Check authentication endpoints
async function testAuthEndpoints() {
  console.log('\n🔐 Testing Authentication Endpoints...');
  const endpoints = [
    '/api/auth/signin',
    '/api/auth/providers',
    '/api/auth/session',
    '/api/auth/csrf'
  ];

  let allEndpointsWork = true;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      const status = response.status;
      if (status === 200 || status === 405) { // 405 is OK for some endpoints
        console.log(`   ✅ ${endpoint}: Working (${status})`);
      } else {
        console.log(`   ⚠️ ${endpoint}: Unexpected status (${status})`);
        allEndpointsWork = false;
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint}: Failed (${error.message})`);
      allEndpointsWork = false;
    }
  }
  return allEndpointsWork;
}

// Test 4: Check page accessibility
async function testPageAccessibility() {
  console.log('\n🌐 Testing Page Accessibility...');
  const pages = [
    '/',
    '/home',
    '/login',
    '/signup',
    '/debug-signin'
  ];

  let allPagesAccessible = true;
  for (const page of pages) {
    try {
      const response = await fetch(`http://localhost:3000${page}`);
      const status = response.status;
      if (status === 200) {
        console.log(`   ✅ ${page}: Accessible`);
      } else {
        console.log(`   ⚠️ ${page}: Status ${status}`);
        if (status >= 400) allPagesAccessible = false;
      }
    } catch (error) {
      console.log(`   ❌ ${page}: Failed (${error.message})`);
      allPagesAccessible = false;
    }
  }
  return allPagesAccessible;
}

// Test 5: Check sign-in button presence
async function testSignInButton() {
  console.log('\n🔘 Testing Sign-In Button...');
  try {
    const response = await fetch('http://localhost:3000/home');
    const html = await response.text();
    
    const hasSignInButton = html.includes('Sign in') || html.includes('signin');
    const hasLoginRoute = html.includes('/login') || html.includes('routerPush');
    const hasLogInIcon = html.includes('LogIn') || html.includes('log-in');
    
    console.log(`   ${hasSignInButton ? '✅' : '❌'} Sign-in text: ${hasSignInButton ? 'Present' : 'Missing'}`);
    console.log(`   ${hasLoginRoute ? '✅' : '❌'} Login route: ${hasLoginRoute ? 'Present' : 'Missing'}`);
    console.log(`   ${hasLogInIcon ? '✅' : '❌'} LogIn icon: ${hasLogInIcon ? 'Present' : 'Missing'}`);
    
    return hasSignInButton && hasLoginRoute;
  } catch (error) {
    console.log(`   ❌ Sign-in button test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Check environment variables
async function testEnvironmentVariables() {
  console.log('\n🌍 Testing Environment Variables...');
  try {
    const envContent = await fs.readFile('.env.local', 'utf8');
    
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET'
    ];
    
    let allVarsPresent = true;
    for (const varName of requiredVars) {
      const isPresent = envContent.includes(`${varName}=`);
      console.log(`   ${isPresent ? '✅' : '❌'} ${varName}: ${isPresent ? 'Set' : 'Missing'}`);
      if (!isPresent) allVarsPresent = false;
    }
    
    return allVarsPresent;
  } catch (error) {
    console.log(`   ❌ Environment variables test failed: ${error.message}`);
    return false;
  }
}

// Test 7: Check database connection
async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...');
  try {
    const { spawn } = await import('child_process');
    return new Promise((resolve) => {
      const dbCheck = spawn('node', ['scripts/check-database-health.js'], {
        stdio: 'pipe'
      });
      
      let output = '';
      dbCheck.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      dbCheck.on('close', (code) => {
        const isHealthy = output.includes('HEALTHY') || output.includes('Connected');
        console.log(`   ${isHealthy ? '✅' : '❌'} Database: ${isHealthy ? 'Connected' : 'Failed'}`);
        resolve(isHealthy);
      });
      
      setTimeout(() => {
        dbCheck.kill();
        console.log('   ⚠️ Database: Timeout');
        resolve(false);
      }, 10000);
    });
  } catch (error) {
    console.log(`   ❌ Database test failed: ${error.message}`);
    return false;
  }
}

// Main audit function
async function runComprehensiveAudit() {
  const results = {
    devServer: await testDevServer(),
    criticalFiles: await testCriticalFiles(),
    authEndpoints: await testAuthEndpoints(),
    pageAccessibility: await testPageAccessibility(),
    signInButton: await testSignInButton(),
    environmentVariables: await testEnvironmentVariables(),
    databaseConnection: await testDatabaseConnection()
  };
  
  console.log('\n📊 AUDIT SUMMARY');
  console.log('================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });
  
  console.log(`\n🎯 Overall Score: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Your app should be working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the issues above.');
  }
  
  return results;
}

// Run the audit
runComprehensiveAudit().catch(console.error);
