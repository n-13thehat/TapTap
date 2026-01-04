import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkVx9User() {
  try {
    console.log('🔍 Checking Vx9 user in database...\n');
    
    // First, let's just get the basic user info
    const user = await prisma.user.findUnique({
      where: { email: 'vx9@taptap.local' }
    });
    
    if (user) {
      console.log('✅ Vx9 user found!');
      console.log('==========================================');
      console.log('📧 Email:', user.email);
      console.log('👤 Username:', user.username);
      console.log('🎭 Role:', user.role);
      console.log('🎂 Birthday:', user.birthday);
      console.log('🎫 Has TapPass:', user.hasTapPass);
      console.log('✅ Verified:', user.verified);
      console.log('📊 Status:', user.status);
      console.log('🔐 Has Password:', !!user.hashedPassword);
      console.log('🆔 Auth User ID:', user.authUserId);
      console.log('');
      // Now let's try to get related data separately
      try {
        const artistProfile = await prisma.artist.findUnique({
          where: { userId: user.id }
        });
        console.log('🎤 Artist Profile:', !!artistProfile);
        if (artistProfile) {
          console.log('- Stage Name:', artistProfile.stageName);
        }
      } catch (e) {
        console.log('🎤 Artist Profile: Error checking -', e.message);
      }

      try {
        const followCount = await prisma.follow.count({
          where: { followerId: user.id }
        });
        console.log('📈 Following Count:', followCount);
      } catch (e) {
        console.log('📈 Following Count: Error checking -', e.message);
      }

      try {
        const followerCount = await prisma.follow.count({
          where: { followingId: user.id }
        });
        console.log('📈 Follower Count:', followerCount);
      } catch (e) {
        console.log('📈 Follower Count: Error checking -', e.message);
      }
      
    } else {
      console.log('❌ Vx9 user not found in database');
      console.log('');
      console.log('🔍 Checking for similar users...');
      
      const similarUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'vx' } },
            { username: { contains: 'vx' } }
          ]
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true
        }
      });
      
      if (similarUsers.length > 0) {
        console.log('Found similar users:');
        similarUsers.forEach(u => {
          console.log(`- ${u.username} (${u.email}) - ${u.role}`);
        });
      } else {
        console.log('No similar users found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkVx9User();
