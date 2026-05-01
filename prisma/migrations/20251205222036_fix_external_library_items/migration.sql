-- Idempotent variant: this migration originally re-issued the same statements as
-- 20251205221920_add_external_library_items, which made it fail on a fresh DB
-- (the constraint had already been dropped by the prior migration). Adding
-- IF EXISTS makes it a safe no-op when the constraint is already absent, so
-- both fresh deploys and environments that already applied this migration
-- converge to the same state.
-- DropForeignKey
ALTER TABLE "ExternalLibraryItem" DROP CONSTRAINT IF EXISTS "ExternalLibraryItem_userId_fkey";

-- AlterTable
ALTER TABLE "ExternalLibraryItem" ALTER COLUMN "id" DROP DEFAULT;
