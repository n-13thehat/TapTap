#!/usr/bin/env node

/**
 * Debug the sign-in crash by checking all related components
 */

import fs from 'fs';

console.log('🐛 Debugging Sign-In Crash');
console.log('==========================\n');

// Check if critical auth files exist and have no syntax errors
const criticalFiles = [
  'app/login/page.tsx',
  'app/signup/page.tsx', 
  'hooks/useAuth.ts',
  'providers/AuthProvider.tsx',
  'components/ClientLayoutWrapper.tsx',
  'auth.config.js',
  'app/api/auth/[...nextauth]/route.ts'
];

console.log('📁 Checking critical auth files...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
    
    // Check for common issues
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for missing imports
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (content.includes('useRouter') && !content.includes('from "next/navigation"') && !content.includes('from \'next/navigation\'')) {
        console.log(`   ⚠️ ${file} uses useRouter but might be missing import`);
      }
      
      if (content.includes('useAuth') && !content.includes('@/hooks/useAuth') && !content.includes('./hooks/useAuth')) {
        console.log(`   ⚠️ ${file} uses useAuth but might be missing import`);
      }
      
      if (content.includes('"use client"') || content.includes("'use client'")) {
        console.log(`   ✅ ${file} is marked as client component`);
      } else if (file.includes('page.tsx') && !file.includes('api')) {
        console.log(`   ⚠️ ${file} might need "use client" directive`);
      }
    }
  } else {
    console.log(`❌ ${file} is missing`);
  }
});

// Check for common crash patterns
console.log('\n🔍 Checking for common crash patterns...');

// Check if AuthProvider is properly configured
if (fs.existsSync('providers/AuthProvider.tsx')) {
  const authProvider = fs.readFileSync('providers/AuthProvider.tsx', 'utf8');
  if (authProvider.includes('SessionProvider')) {
    console.log('✅ AuthProvider includes SessionProvider');
  } else {
    console.log('⚠️ AuthProvider might be missing SessionProvider');
  }
}

// Check if ClientLayoutWrapper is properly set up
if (fs.existsSync('components/ClientLayoutWrapper.tsx')) {
  const wrapper = fs.readFileSync('components/ClientLayoutWrapper.tsx', 'utf8');
  if (wrapper.includes('"use client"')) {
    console.log('✅ ClientLayoutWrapper is marked as client component');
  } else {
    console.log('❌ ClientLayoutWrapper is missing "use client" directive');
  }
  
  if (wrapper.includes('AuthProvider') || wrapper.includes('SessionProvider')) {
    console.log('✅ ClientLayoutWrapper includes auth providers');
  } else {
    console.log('⚠️ ClientLayoutWrapper might be missing auth providers');
  }
}

console.log('\n💡 Debugging suggestions:');
console.log('1. Open browser DevTools (F12) before clicking sign in');
console.log('2. Go to Console tab to see JavaScript errors');
console.log('3. Go to Network tab to see failed requests');
console.log('4. Try clicking sign in and look for:');
console.log('   - Red error messages in Console');
console.log('   - Failed network requests (red entries)');
console.log('   - Any hydration errors');
console.log('5. If you see specific errors, share them for targeted fixes');

console.log('\n🔧 Quick fixes to try:');
console.log('1. Hard refresh the page (Ctrl+Shift+R)');
console.log('2. Clear browser cache');
console.log('3. Try in incognito/private mode');
console.log('4. Try a different browser');

console.log('\n🐛 Debug completed!');
