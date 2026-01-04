/**
 * Database connection utility with fallback support
 */

import { PrismaClient } from '@prisma/client';

// Global Prisma instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Database connection options
const getDatabaseUrl = () => {
  // Priority order: LOCAL -> NEON -> SUPABASE
  const localUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  
  if (localUrl && !localUrl.includes('file:')) {
    console.log('🔗 Using local/cloud PostgreSQL database');
    return localUrl;
  }
  
  if (supabaseUrl) {
    console.log('🔗 Using Supabase database (fallback)');
    return supabaseUrl;
  }
  
  throw new Error('No database URL configured. Please set DATABASE_URL or SUPABASE_DATABASE_URL');
};

// Create Prisma client with connection pooling
const createPrismaClient = () => {
  const databaseUrl = getDatabaseUrl();
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Singleton pattern for Prisma client
export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Database utilities
export const db = {
  // User operations
  user: prisma.user,
  
  // Music operations
  artist: prisma.artist,
  album: prisma.album,
  track: prisma.track,
  playlist: prisma.playlist,
  
  // Social operations
  post: prisma.post,
  comment: prisma.comment,
  like: prisma.likeTarget,
  
  // Raw queries
  $queryRaw: prisma.$queryRaw,
  $executeRaw: prisma.$executeRaw,
  
  // Transactions
  $transaction: prisma.$transaction,
};

export default prisma;
