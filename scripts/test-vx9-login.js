import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testVx9Login() {
  try {
    console.log('🔐 Testing Vx9 login credentials...\n');
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: 'vx9@taptap.local' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.username);
    console.log('📧 Email:', user.email);
    console.log('🔐 Has hashed password:', !!user.hashedPassword);
    
    if (!user.hashedPassword) {
      console.log('❌ No password set for user');
      return;
    }
    
    // Test the password
    const testPassword = 'N13thehat';
    const isValidPassword = await bcrypt.compare(testPassword, user.hashedPassword);
    
    console.log('🧪 Testing password "N13thehat":', isValidPassword ? '✅ VALID' : '❌ INVALID');
    
    if (isValidPassword) {
      console.log('\n🎉 LOGIN TEST SUCCESSFUL!');
      console.log('✅ Credentials are working correctly');
      console.log('✅ User can authenticate with:');
      console.log('   - Email: vx9@taptap.local');
      console.log('   - Password: N13thehat');
      
      // Check TapPass requirement
      if (!user.hasTapPass) {
        console.log('\n⚠️  WARNING: User does not have TapPass');
        console.log('   - This may prevent login if TapPass is required');
        console.log('   - Consider setting hasTapPass to true');
      }
      
      // Check if user needs additional setup
      console.log('\n📋 User Status Check:');
      console.log('- Role:', user.role);
      console.log('- Status:', user.status);
      console.log('- Verified:', user.verified);
      console.log('- Has TapPass:', user.hasTapPass);
      console.log('- Created:', user.createdAt);
      
    } else {
      console.log('\n❌ LOGIN TEST FAILED!');
      console.log('❌ Password does not match');
      console.log('❌ User cannot authenticate');
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testVx9Login();
