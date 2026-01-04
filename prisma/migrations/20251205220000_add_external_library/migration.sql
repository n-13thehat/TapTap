-- ExternalLibraryItem to store external provider saves (e.g., Deezer) per user
CREATE TABLE IF NOT EXISTS "ExternalLibraryItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "artist" TEXT NOT NULL,
  "album" TEXT,
  "coverUrl" TEXT,
  "audioUrl" TEXT,
  "deezerUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalLibraryItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExternalLibraryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExternalLibraryItem_user_provider_external_idx" ON "ExternalLibraryItem"("userId","provider","externalId");
CREATE INDEX IF NOT EXISTS "ExternalLibraryItem_userId_idx" ON "ExternalLibraryItem"("userId");
