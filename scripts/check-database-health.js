/**
 * TapTap Matrix Database Health Check
 * Verifies local-first configuration with Supabase fallback
 */

import { getDatabaseStatus } from '../lib/config/database.ts';
import { prisma } from '../lib/prisma.js';

async function checkDatabaseHealth() {
  console.log('🏥 TapTap Matrix Database Health Check');
  console.log('=====================================\n');

  try {
    // Get database status
    console.log('📊 Checking database configuration...');
    const status = await getDatabaseStatus();
    
    console.log('🔧 Configuration:');
    console.log(`   Local URL: ${status.local.url}`);
    console.log(`   Local Host: ${status.local.host}:${status.local.port}`);
    console.log(`   Local Database: ${status.local.database}`);
    console.log(`   Supabase Configured: ${status.supabase.configured ? 'Yes' : 'No'}`);
    console.log(`   Fallback Enabled: ${status.fallbackEnabled ? 'Yes' : 'No'}`);
    console.log(`   Primary Database: ${status.primary}\n`);

    // Test local database
    console.log('🔗 Testing Local PostgreSQL...');
    if (status.local.available) {
      console.log('   ✅ Local PostgreSQL: Connected');
      
      try {
        // Test Prisma connection
        await prisma.$connect();
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
        console.log(`   ✅ Prisma Client: Connected (${result[0]?.count || 0} users)`);
        
        // Test basic operations
        const trackCount = await prisma.track.count();
        console.log(`   ✅ Track Operations: Working (${trackCount} tracks)`);
        
        const albumCount = await prisma.album.count();
        console.log(`   ✅ Album Operations: Working (${albumCount} albums)`);
        
      } catch (error) {
        console.log(`   ⚠️ Prisma Operations: ${error.message}`);
      }
    } else {
      console.log('   ❌ Local PostgreSQL: Not Available');
    }

    // Test Supabase fallback
    console.log('\n☁️ Testing Supabase Fallback...');
    if (status.supabase.configured) {
      if (status.supabase.available) {
        console.log('   ✅ Supabase: Connected');
        console.log(`   ✅ Project: ${status.supabase.projectRef}`);
      } else {
        console.log('   ⚠️ Supabase: Configured but not accessible');
      }
    } else {
      console.log('   ⚠️ Supabase: Not configured');
    }

    // Test Music For The Future collection
    console.log('\n🎵 Testing Music For The Future Collection...');
    try {
      const vxUser = await prisma.user.findFirst({
        where: { username: 'vx' }
      });

      if (vxUser) {
        console.log('   ✅ VX User: Found');
        
        const vxTracks = await prisma.track.count({
          where: {
            artist: {
              userId: vxUser.id
            }
          }
        });
        
        console.log(`   ✅ VX Tracks: ${vxTracks} tracks available`);
        
        const vxAlbums = await prisma.album.count({
          where: {
            artistId: {
              in: await prisma.artist.findMany({
                where: { userId: vxUser.id },
                select: { id: true }
              }).then(artists => artists.map(a => a.id))
            }
          }
        });
        
        console.log(`   ✅ VX Albums: ${vxAlbums} albums available`);
      } else {
        console.log('   ⚠️ VX User: Not found (run import script)');
      }
    } catch (error) {
      console.log(`   ❌ Music Collection Test: ${error.message}`);
    }

    // Performance test
    console.log('\n⚡ Performance Test...');
    const startTime = Date.now();
    try {
      await prisma.track.findMany({ take: 10 });
      const queryTime = Date.now() - startTime;
      console.log(`   ✅ Query Performance: ${queryTime}ms (10 tracks)`);
      
      if (queryTime < 100) {
        console.log('   🚀 Performance: Excellent');
      } else if (queryTime < 500) {
        console.log('   ✅ Performance: Good');
      } else {
        console.log('   ⚠️ Performance: Slow (consider optimization)');
      }
    } catch (error) {
      console.log(`   ❌ Performance Test: ${error.message}`);
    }

    // Summary
    console.log('\n📋 Health Check Summary:');
    console.log('========================');
    
    if (status.primary === 'local') {
      console.log('✅ Status: HEALTHY (Local Primary)');
      console.log('🏠 Using local PostgreSQL database');
      console.log('☁️ Supabase available as fallback');
    } else if (status.primary === 'supabase') {
      console.log('⚠️ Status: DEGRADED (Supabase Fallback)');
      console.log('☁️ Using Supabase database');
      console.log('🏠 Local PostgreSQL not available');
    } else {
      console.log('❌ Status: CRITICAL (No Database)');
      console.log('💥 No database connection available');
    }

    console.log('\n🎯 Recommendations:');
    if (status.primary !== 'local') {
      console.log('   • Start local PostgreSQL: docker-compose up -d');
      console.log('   • Check DATABASE_URL in .env.local');
      console.log('   • Run: npm run db:setup');
    }
    
    if (!status.supabase.configured && status.fallbackEnabled) {
      console.log('   • Configure Supabase credentials for fallback');
    }
    
    if (status.primary === 'local') {
      console.log('   • System is optimally configured! 🎉');
    }

  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run health check
checkDatabaseHealth()
  .then(() => {
    console.log('\n🏥 Database health check completed!');
  })
  .catch((error) => {
    console.error('💥 Health check crashed:', error);
    process.exit(1);
  });
