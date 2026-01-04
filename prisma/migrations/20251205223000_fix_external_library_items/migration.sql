-- Restore default UUID and foreign key for ExternalLibraryItem after prior migration adjustments
ALTER TABLE "ExternalLibraryItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "ExternalLibraryItem"
  ADD CONSTRAINT "ExternalLibraryItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ensure supporting index exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'ExternalLibraryItem_userId_idx'
  ) THEN
    CREATE INDEX "ExternalLibraryItem_userId_idx" ON "ExternalLibraryItem"("userId");
  END IF;
END $$;
