-- DropForeignKey
ALTER TABLE "ExternalLibraryItem" DROP CONSTRAINT "ExternalLibraryItem_userId_fkey";

-- AlterTable
ALTER TABLE "ExternalLibraryItem" ALTER COLUMN "id" DROP DEFAULT;
