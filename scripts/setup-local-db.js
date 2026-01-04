#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🎵 TapTap Matrix - Local Database Setup');
console.log('=====================================');

// Check if Docker is available and running
function checkDocker() {
  try {
    execSync('docker ps', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Setup using Docker
function setupWithDocker() {
  console.log('🐳 Setting up PostgreSQL with Docker...');
  
  try {
    // Start PostgreSQL container
    execSync('docker run -d --name taptap-postgres -e POSTGRES_DB=taptap_dev -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15-alpine', { stdio: 'inherit' });
    
    console.log('✅ PostgreSQL container started');
    console.log('⏳ Waiting for database to be ready...');
    
    // Wait for database to be ready
    setTimeout(() => {
      console.log('🔄 Running Prisma migrations...');
      execSync('npx prisma db push', { stdio: 'inherit' });
      
      console.log('🌱 Seeding database...');
      execSync('node prisma/seed-simple.js', { stdio: 'inherit' });
      
      console.log('✅ Local database setup complete!');
      console.log('📊 Database URL: postgresql://postgres:password@localhost:5432/taptap_dev');
    }, 10000);
    
  } catch (error) {
    console.error('❌ Failed to set up Docker database:', error.message);
    return false;
  }
  
  return true;
}

// Setup using cloud service (Neon)
function setupWithCloud() {
  console.log('☁️ Setting up with cloud PostgreSQL...');
  console.log('💡 Please visit: https://neon.tech (free tier available)');
  console.log('1. Create a free account');
  console.log('2. Create a new project');
  console.log('3. Copy the connection string');
  console.log('4. Update your .env file with the connection string');
  console.log('');
  console.log('Example:');
  console.log('DATABASE_URL="postgresql://username:password@host/database?sslmode=require"');
  console.log('');
  console.log('Then run: pnpm run db:push && pnpm run db:seed');
}

// Main setup logic
async function main() {
  if (checkDocker()) {
    console.log('✅ Docker is available');
    if (setupWithDocker()) {
      return;
    }
  } else {
    console.log('❌ Docker is not available or not running');
  }
  
  console.log('');
  setupWithCloud();
}

main().catch(console.error);
