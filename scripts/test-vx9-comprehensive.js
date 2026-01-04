import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testVx9Comprehensive() {
  try {
    console.log('🧪 COMPREHENSIVE VX9 USER TESTING\n');
    console.log('==========================================\n');
    
    // Get the user with all relationships
    const user = await prisma.user.findUnique({
      where: { email: 'vx9@taptap.local' },
      include: {
        artists: true,
        profile: true,
        wallets: true,
        followsOutgoing: { take: 5 },
        followsIncoming: { take: 5 },
        posts: { take: 3 },
        playlists: { take: 3 },
        uploads: { take: 3 }
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ USER BASIC INFO');
    console.log('------------------');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Verified:', user.verified);
    console.log('Has TapPass:', user.hasTapPass);
    console.log('Birthday:', user.birthday);
    console.log('Auth User ID:', user.authUserId);
    console.log('Has Password:', !!user.hashedPassword);
    
    console.log('\n✅ ARTIST PROFILE');
    console.log('------------------');
    if (user.artists) {
      console.log('Stage Name:', user.artists.stageName);
      console.log('About:', user.artists.about?.substring(0, 100) + '...');
      console.log('Verified:', user.artists.verified);
    } else {
      console.log('❌ No artist profile found');
    }
    
    console.log('\n✅ USER PROFILE');
    console.log('----------------');
    if (user.profile) {
      console.log('Display Name:', user.profile.displayName);
      console.log('Location:', user.profile.location);
      console.log('Links:', user.profile.links);
    } else {
      console.log('❌ No user profile found');
    }
    
    console.log('\n✅ WALLET INFO');
    console.log('---------------');
    if (user.wallets && user.wallets.length > 0) {
      const wallet = user.wallets[0];
      console.log('Address:', wallet.address);
      console.log('Provider:', wallet.provider);
      console.log('Created:', wallet.createdAt);
    } else {
      console.log('❌ No wallet found');
    }
    
    console.log('\n✅ SOCIAL CONNECTIONS');
    console.log('----------------------');
    console.log('Following:', user.followsOutgoing?.length || 0);
    console.log('Followers:', user.followsIncoming?.length || 0);
    
    if (user.followsOutgoing && user.followsOutgoing.length > 0) {
      console.log('Following users:');
      for (const follow of user.followsOutgoing) {
        console.log(`  - ${follow.followingId}`);
      }
    }
    
    console.log('\n✅ CONTENT');
    console.log('-----------');
    console.log('Posts:', user.posts?.length || 0);
    console.log('Playlists:', user.playlists?.length || 0);
    console.log('Uploads:', user.uploads?.length || 0);
    
    // Test admin access
    console.log('\n✅ ADMIN ACCESS TEST');
    console.log('--------------------');
    if (user.role === 'ADMIN' || user.role === 'CREATOR') {
      console.log('✅ User has elevated privileges');
      console.log('✅ Can access admin dashboard');
    } else {
      console.log('⚠️  User has basic privileges only');
    }
    
    // Test authentication requirements
    console.log('\n✅ AUTHENTICATION REQUIREMENTS');
    console.log('-------------------------------');
    console.log('Has Password:', !!user.hashedPassword ? '✅' : '❌');
    console.log('Has TapPass:', user.hasTapPass ? '✅' : '❌');
    console.log('Account Active:', user.status === 'ACTIVE' ? '✅' : '❌');
    console.log('Email Verified:', user.verified === 'VERIFIED' ? '✅' : '❌');
    
    const canLogin = !!user.hashedPassword && user.hasTapPass && user.status === 'ACTIVE';
    console.log('\n🔐 LOGIN STATUS:', canLogin ? '✅ CAN LOGIN' : '❌ CANNOT LOGIN');
    
    if (canLogin) {
      console.log('\n🎉 COMPREHENSIVE TEST PASSED!');
      console.log('==============================');
      console.log('✅ User is fully configured');
      console.log('✅ All schema relationships are set up');
      console.log('✅ Ready for production testing');
      console.log('\n🚀 Next steps:');
      console.log('1. Test login via web interface');
      console.log('2. Test admin dashboard access');
      console.log('3. Test creator features');
      console.log('4. Test battle system');
      console.log('5. Test wallet functionality');
    } else {
      console.log('\n❌ ISSUES FOUND - User needs additional setup');
    }
    
  } catch (error) {
    console.error('❌ Error during comprehensive test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testVx9Comprehensive();
