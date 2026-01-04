-- DropForeignKey
ALTER TABLE "ExternalLibraryItem" DROP CONSTRAINT "ExternalLibraryItem_userId_fkey";

-- AlterTable
ALTER TABLE "ExternalLibraryItem" ALTER COLUMN "id" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "ExternalLibraryItem_user_provider_external_idx" RENAME TO "ExternalLibraryItem_userId_provider_externalId_key";
