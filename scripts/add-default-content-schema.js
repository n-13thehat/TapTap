import { prisma } from '../lib/prisma.js';

async function addDefaultContentSchema() {
  console.log("🔧 Adding default content schema to database...");

  try {
    // Add the tables using raw SQL since they might not be in the Prisma schema yet
    
    // Create DefaultContent table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DefaultContent" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "type" TEXT NOT NULL,
        "contentId" UUID NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "featured" BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "DefaultContent_pkey" PRIMARY KEY ("id")
      );
    `;

    // Create UserLibrary table for tracking user's library items
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserLibrary" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "trackId" UUID NOT NULL,
        "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "source" TEXT NOT NULL DEFAULT 'USER',

        CONSTRAINT "UserLibrary_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "UserLibrary_userId_trackId_key" UNIQUE ("userId", "trackId")
      );
    `;

    // Create UserPlaylist table for tracking user's playlist subscriptions
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserPlaylist" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "playlistId" UUID NOT NULL,
        "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "source" TEXT NOT NULL DEFAULT 'USER',

        CONSTRAINT "UserPlaylist_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "UserPlaylist_userId_playlistId_key" UNIQUE ("userId", "playlistId")
      );
    `;

    // Create MarketplaceItem table for the marketplace
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MarketplaceItem" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "sellerId" UUID NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "currency" TEXT NOT NULL DEFAULT 'TAPCOIN',
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "featured" BOOLEAN NOT NULL DEFAULT false,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "MarketplaceItem_pkey" PRIMARY KEY ("id")
      );
    `;

    // Add foreign key constraints if they don't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "UserLibrary" 
        ADD CONSTRAINT "UserLibrary_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "UserLibrary" 
        ADD CONSTRAINT "UserLibrary_trackId_fkey" 
        FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "UserPlaylist" 
        ADD CONSTRAINT "UserPlaylist_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "UserPlaylist" 
        ADD CONSTRAINT "UserPlaylist_playlistId_fkey" 
        FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "MarketplaceItem" 
        ADD CONSTRAINT "MarketplaceItem_sellerId_fkey" 
        FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Constraint might already exist
    }

    // Add indexes for better performance
    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "DefaultContent_type_idx" ON "DefaultContent"("type");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "DefaultContent_featured_idx" ON "DefaultContent"("featured");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UserLibrary_userId_idx" ON "UserLibrary"("userId");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UserPlaylist_userId_idx" ON "UserPlaylist"("userId");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MarketplaceItem_status_idx" ON "MarketplaceItem"("status");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MarketplaceItem_featured_idx" ON "MarketplaceItem"("featured");`;
    } catch (e) {
      // Indexes might already exist
    }

    console.log("✅ Default content schema added successfully!");

  } catch (error) {
    console.error("❌ Error adding default content schema:", error);
    throw error;
  }
}

// Run the schema addition
addDefaultContentSchema()
  .then(() => {
    console.log("🎉 Schema update completed!");
  })
  .catch((e) => {
    console.error("❌ Schema update failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
