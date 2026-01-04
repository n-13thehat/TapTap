const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building TapTap Matrix Electron App...\n');

try {
  // Step 1: Build Next.js app
  console.log('1. 📦 Building Next.js application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 2: Check if electron-builder is installed
  console.log('\n2. 🔧 Checking electron-builder...');
  try {
    execSync('npx electron-builder --version', { stdio: 'pipe' });
    console.log('✅ electron-builder is available');
  } catch (error) {
    console.log('⚠️  Installing electron-builder...');
    execSync('npm install --save-dev electron-builder', { stdio: 'inherit' });
  }

  // Step 3: Build Electron app
  console.log('\n3. ⚡ Building Electron application...');
  const platform = process.platform;
  let buildCommand = 'npx electron-builder';

  if (platform === 'win32') {
    buildCommand += ' --win';
  } else if (platform === 'darwin') {
    buildCommand += ' --mac';
  } else {
    buildCommand += ' --linux';
  }

  execSync(buildCommand, { stdio: 'inherit' });

  console.log('\n🎉 Electron build completed successfully!');
  console.log('📁 Check the dist-electron folder for your packaged app.');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
