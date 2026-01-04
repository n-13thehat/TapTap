#!/usr/bin/env node

/**
 * TapTap Matrix App Diagnostic Tool
 * Helps identify common runtime issues
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 TapTap Matrix App Diagnostics');
console.log('================================\n');

// Check if dev server is running
async function checkDevServer() {
  console.log('📡 Checking dev server...');
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Dev server is responding');
      return true;
    } else {
      console.log(`❌ Dev server returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Dev server not accessible: ${error.message}`);
    return false;
  }
}

// Check critical files
function checkCriticalFiles() {
  console.log('\n📁 Checking critical files...');
  const criticalFiles = [
    'app/layout.jsx',
    'components/ClientLayoutWrapper.tsx',
    'providers/ConsolidatedProvider.tsx',
    'lib/utils/dynamic-imports.tsx',
    'app/home/page.tsx',
    'package.json',
    '.env.local'
  ];

  let allFilesExist = true;
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// Check for common issues in package.json
function checkPackageJson() {
  console.log('\n📦 Checking package.json...');
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check Next.js version
    const nextVersion = pkg.dependencies?.next || pkg.devDependencies?.next;
    console.log(`✅ Next.js version: ${nextVersion}`);
    
    // Check React version
    const reactVersion = pkg.dependencies?.react || pkg.devDependencies?.react;
    console.log(`✅ React version: ${reactVersion}`);
    
    // Check if dev script exists
    if (pkg.scripts?.dev) {
      console.log(`✅ Dev script: ${pkg.scripts.dev}`);
    } else {
      console.log('❌ No dev script found');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

// Check environment variables
function checkEnvironment() {
  console.log('\n🌍 Checking environment...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  let allEnvVarsPresent = true;
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} is set`);
    } else {
      console.log(`⚠️ ${envVar} is not set`);
      allEnvVarsPresent = false;
    }
  });
  
  return allEnvVarsPresent;
}

// Main diagnostic function
async function runDiagnostics() {
  const serverRunning = await checkDevServer();
  const filesExist = checkCriticalFiles();
  const packageOk = checkPackageJson();
  const envOk = checkEnvironment();
  
  console.log('\n📋 Diagnostic Summary');
  console.log('====================');
  console.log(`Dev Server: ${serverRunning ? '✅ Running' : '❌ Not Running'}`);
  console.log(`Critical Files: ${filesExist ? '✅ All Present' : '❌ Missing Files'}`);
  console.log(`Package Config: ${packageOk ? '✅ OK' : '❌ Issues Found'}`);
  console.log(`Environment: ${envOk ? '✅ OK' : '⚠️ Missing Variables'}`);
  
  if (serverRunning && filesExist && packageOk) {
    console.log('\n🎉 Basic setup looks good!');
    console.log('\nIf you\'re still experiencing issues, please describe:');
    console.log('1. What specific problems are you seeing?');
    console.log('2. Are there errors in the browser console? (Press F12)');
    console.log('3. Is the page loading at all?');
    console.log('4. Are specific features not working?');
  } else {
    console.log('\n🚨 Issues detected that may be causing problems.');
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);
