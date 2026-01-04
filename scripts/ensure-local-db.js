/**
 * Ensure Local Database is Running
 * Starts Docker PostgreSQL if not running, creates database if needed
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function ensureLocalDatabase() {
  console.log('🐳 Ensuring local PostgreSQL database is running...');

  try {
    // Check if Docker is available
    console.log('🔍 Checking Docker availability...');
    await execAsync('docker --version');
    console.log('✅ Docker is available');

    // Check if PostgreSQL container is running
    console.log('🔍 Checking PostgreSQL container status...');
    try {
      const { stdout } = await execAsync('docker ps --filter "name=postgres" --format "{{.Names}}"');
      
      if (stdout.includes('postgres')) {
        console.log('✅ PostgreSQL container is already running');
      } else {
        console.log('🚀 Starting PostgreSQL container...');
        
        // Try to start existing container first
        try {
          await execAsync('docker start postgres');
          console.log('✅ Started existing PostgreSQL container');
        } catch (startError) {
          // If no existing container, create a new one
          console.log('🆕 Creating new PostgreSQL container...');
          await execAsync(`
            docker run -d \
              --name postgres \
              -e POSTGRES_DB=taptap_dev \
              -e POSTGRES_USER=postgres \
              -e POSTGRES_HOST_AUTH_METHOD=trust \
              -p 5432:5432 \
              postgres:15-alpine
          `);
          console.log('✅ Created and started new PostgreSQL container');
        }
      }
    } catch (error) {
      console.log('🆕 No PostgreSQL container found, creating one...');
      await execAsync(`
        docker run -d \
          --name postgres \
          -e POSTGRES_DB=taptap_dev \
          -e POSTGRES_USER=postgres \
          -e POSTGRES_HOST_AUTH_METHOD=trust \
          -p 5432:5432 \
          postgres:15-alpine
      `);
      console.log('✅ Created and started PostgreSQL container');
    }

    // Wait for database to be ready
    console.log('⏳ Waiting for database to be ready...');
    let retries = 30;
    while (retries > 0) {
      try {
        await execAsync('docker exec postgres pg_isready -U postgres');
        console.log('✅ Database is ready');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error('Database failed to become ready');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Test connection
    console.log('🔗 Testing database connection...');
    const { Client } = await import('pg');
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'taptap_dev',
      user: 'postgres',
    });

    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    console.log('✅ Database connection successful');

    // Check if we need to run migrations
    console.log('🔍 Checking database schema...');
    try {
      const client2 = new Client({
        host: 'localhost',
        port: 5432,
        database: 'taptap_dev',
        user: 'postgres',
      });

      await client2.connect();
      const result = await client2.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      `);
      await client2.end();

      if (parseInt(result.rows[0].count) === 0) {
        console.log('🔄 Database schema not found, running migrations...');
        await execAsync('npx prisma migrate dev --name init');
        console.log('✅ Database migrations completed');
      } else {
        console.log('✅ Database schema exists');
      }
    } catch (migrationError) {
      console.log('⚠️ Could not check/run migrations:', migrationError.message);
      console.log('💡 You may need to run: npx prisma migrate dev');
    }

    console.log('\n🎉 Local database is ready!');
    console.log('📊 Connection details:');
    console.log('   Host: localhost');
    console.log('   Port: 5432');
    console.log('   Database: taptap_dev');
    console.log('   User: postgres');
    console.log('   URL: postgresql://postgres@localhost:5432/taptap_dev');

  } catch (error) {
    console.error('❌ Failed to ensure local database:', error.message);
    console.log('\n🔧 Manual setup options:');
    console.log('1. Install Docker and run:');
    console.log('   docker run -d --name postgres -e POSTGRES_DB=taptap_dev -e POSTGRES_USER=postgres -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres:15-alpine');
    console.log('2. Or use docker-compose:');
    console.log('   docker-compose up -d');
    console.log('3. Or install PostgreSQL locally on port 5432');
    
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureLocalDatabase()
    .then(() => {
      console.log('✅ Local database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Local database setup failed:', error);
      process.exit(1);
    });
}

export { ensureLocalDatabase };
