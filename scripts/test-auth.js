#!/usr/bin/env node

/**
 * Test NextAuth configuration and endpoints
 */

console.log('🔐 Testing NextAuth Configuration');
console.log('=================================\n');

// Test 1: Check if auth config can be imported
console.log('📋 Testing auth config import...');
try {
  // Try to import the auth config
  const authConfig = await import('../auth.config.js');
  console.log('✅ Auth config imported successfully');
  console.log(`✅ NextAuth instance: ${typeof authConfig.default}`);
} catch (error) {
  console.log(`❌ Auth config import failed: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
}

// Test 2: Check NextAuth API endpoint
console.log('\n🌐 Testing NextAuth API endpoint...');
try {
  const response = await fetch('http://localhost:3000/api/auth/providers');
  if (response.ok) {
    const providers = await response.json();
    console.log('✅ NextAuth API is responding');
    console.log(`✅ Available providers: ${Object.keys(providers).join(', ')}`);
  } else {
    console.log(`❌ NextAuth API returned status: ${response.status}`);
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 200)}...`);
  }
} catch (error) {
  console.log(`❌ NextAuth API request failed: ${error.message}`);
}

// Test 3: Check signin page
console.log('\n📝 Testing signin page...');
try {
  const response = await fetch('http://localhost:3000/api/auth/signin');
  if (response.ok) {
    console.log('✅ NextAuth signin page is accessible');
  } else {
    console.log(`❌ NextAuth signin page returned status: ${response.status}`);
  }
} catch (error) {
  console.log(`❌ NextAuth signin page request failed: ${error.message}`);
}

// Test 4: Check environment variables
console.log('\n🌍 Checking auth environment variables...');
const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DATABASE_URL'
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} is set`);
  } else {
    console.log(`❌ ${envVar} is missing`);
  }
});

console.log('\n🔍 Auth test completed!');
