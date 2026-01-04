#!/usr/bin/env node

console.log('🎵 TapTap Matrix - Quick Database Setup');
console.log('=====================================\n');

console.log('Your Supabase project is paused, so let\'s get you a free PostgreSQL database!\n');

console.log('🚀 FASTEST OPTION - Neon (30 seconds):');
console.log('1. Visit: https://neon.tech');
console.log('2. Sign up with GitHub');
console.log('3. Create project: "TapTap Matrix Dev"');
console.log('4. Copy the connection string');
console.log('5. Update your .env file:\n');

console.log('   DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"\n');

console.log('6. Then run these commands:');
console.log('   pnpm run prisma:generate');
console.log('   pnpm run prisma:push');
console.log('   pnpm run db:seed');
console.log('   pnpm run dev:fast\n');

console.log('✨ Alternative options:');
console.log('• Supabase (new project): https://supabase.com');
console.log('• Local Docker: Start Docker Desktop first\n');

console.log('💡 Neon is recommended - it has the best free tier!');
console.log('📖 Full instructions: ./scripts/get-free-database.md\n');

console.log('Once you have the connection string, let me know and I\'ll help complete the setup! 🎯');
