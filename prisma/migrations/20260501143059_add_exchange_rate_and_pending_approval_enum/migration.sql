-- Adds the ExchangeRate model (referenced by lib/exchange-rates.ts and the
-- /api/exchange-rates routes) and the PENDING_APPROVAL variant of the
-- ExternalRoyaltyStatus enum. Both have lived in prisma/schema.prisma without
-- a backing migration, which made any fresh `prisma migrate deploy` produce
-- a database that the application cannot run against.
--
-- Statements are guarded with IF NOT EXISTS so that environments that already
-- have these objects (created out-of-band via prior `prisma db push` or manual
-- SQL) re-converge cleanly when this migration is applied.

-- AlterEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ExternalRoyaltyStatus'
      AND e.enumlabel = 'PENDING_APPROVAL'
  ) THEN
    ALTER TYPE "ExternalRoyaltyStatus" ADD VALUE 'PENDING_APPROVAL';
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ExchangeRate" (
    "id" UUID NOT NULL,
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExchangeRate_base_idx" ON "ExchangeRate"("base");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExchangeRate_quote_idx" ON "ExchangeRate"("quote");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExchangeRate_updatedAt_idx" ON "ExchangeRate"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ExchangeRate_base_quote_key" ON "ExchangeRate"("base", "quote");
