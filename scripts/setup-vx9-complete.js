import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function setupVx9Complete() {
  try {
    console.log('🚀 Setting up Vx9 user with complete schema relationships...\n');
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: 'vx9@taptap.local' }
    });
    
    if (!user) {
      console.log('❌ Vx9 user not found');
      return;
    }
    
    console.log('✅ Found user:', user.username);
    
    // 1. Enable TapPass
    await prisma.user.update({
      where: { id: user.id },
      data: { hasTapPass: true }
    });
    console.log('✅ Enabled TapPass');
    
    // 2. Create/ensure wallet exists
    let wallet = await prisma.wallet.findFirst({
      where: { userId: user.id }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          address: `tap_${randomUUID().substring(0, 8)}`,
          provider: 'SOLANA'
        }
      });
      console.log('✅ Created wallet');
    } else {
      console.log('✅ Wallet already exists');
    }
    
    // 3. Create/ensure artist profile exists
    let artist = await prisma.artist.findUnique({
      where: { userId: user.id }
    });
    
    if (!artist) {
      artist = await prisma.artist.create({
        data: {
          userId: user.id,
          stageName: 'Vx9',
          about: 'Primary creator and visionary behind TapTap Matrix. The anchor artist that connects all users in the ecosystem.',
          verified: true
        }
      });
      console.log('✅ Created artist profile');
    } else {
      console.log('✅ Artist profile already exists');
    }
    
    // 4. Create user profile if needed
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          displayName: 'Vx9 - Matrix Creator',
          location: 'The Matrix'
        }
      });
      console.log('✅ Created user profile');
    } else {
      console.log('✅ User profile already exists');
    }
    
    console.log('\n🎯 SETUP COMPLETE!');
    console.log('==========================================');
    console.log('✅ User has TapPass enabled');
    console.log('✅ Wallet created');
    console.log('✅ Artist profile configured');
    console.log('✅ User profile set up');
    console.log('\n🔐 Login credentials:');
    console.log('   Email: vx9@taptap.local');
    console.log('   Password: N13thehat');
    console.log('\n🚀 User is ready for full system testing!');
    
  } catch (error) {
    console.error('❌ Error setting up user:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

setupVx9Complete();
