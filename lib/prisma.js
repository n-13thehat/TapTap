import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

// Development-friendly database configuration with fallback handling
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

  console.log('🔗 Attempting to connect to database...');
  console.log('📍 Database URL:', databaseUrl ? 'Set' : 'Not set');

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ["error", "warn"] : ["error"],
    errorFormat: 'pretty',
  });
}

// Create a wrapper that handles connection failures gracefully
async function createSafePrismaClient() {
  try {
    const client = createPrismaClient();
    // Test the connection
    await client.$connect();
    console.log('✅ Database connection successful');
    return client;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('🔄 Application will continue in development mode');

    // Return a mock client for development
    return createMockPrismaClient();
  }
}

// Mock Prisma client for development when database is unavailable
function createMockPrismaClient() {
  console.log('🚧 Using mock database client for development');

  return {
    user: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async (data) => ({ id: 'mock-id', ...data.data }),
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id }),
    },
    notification: {
      findMany: async () => [],
      create: async (data) => ({ id: 'mock-notification-id', ...data.data }),
    },
    // Add other models as needed
    $connect: async () => {},
    $disconnect: async () => {},
  };
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
