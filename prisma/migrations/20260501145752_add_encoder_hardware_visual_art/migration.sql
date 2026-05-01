-- Encoder + Hardware/Supply + Visual Art pillars
-- All statements are idempotent so this migration converges cleanly on
-- fresh databases and on environments that already received any of these
-- objects via a prior `prisma db push` or hand-applied SQL.

-- CreateEnum
DO $$ BEGIN CREATE TYPE "ChipType" AS ENUM ('NTAG213', 'NTAG215', 'NTAG216'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FormFactor" AS ENUM ('KEYCHAIN', 'WRISTBAND', 'TAG', 'STICKER', 'ART_TAG', 'CARD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BatchStatus" AS ENUM ('GENERATED', 'ENCODING', 'ENCODED', 'SHIPPED', 'DEPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ChipStatus" AS ENUM ('UNENCODED', 'ENCODED', 'ACTIVATED', 'FLAGGED', 'RETIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PayloadType" AS ENUM ('TRACK', 'ALBUM', 'PLAYLIST', 'VISUAL_ART', 'EXTERNAL_URL', 'CUSTOM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FraudSignalKind" AS ENUM ('DUPLICATE_UID', 'GEO_VELOCITY', 'REPLAY_BURST', 'UID_MISMATCH', 'UNKNOWN_UID'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CreatorOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ENCODING', 'SHIPPED', 'DELIVERED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "HardwareSku" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chipType" "ChipType" NOT NULL DEFAULT 'NTAG215',
    "formFactor" "FormFactor" NOT NULL DEFAULT 'KEYCHAIN',
    "unitCostCents" INTEGER NOT NULL DEFAULT 0,
    "retailCents" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HardwareSku_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChipBatch" (
    "id" UUID NOT NULL,
    "skuId" UUID NOT NULL,
    "size" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'GENERATED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChipBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EncodedChip" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "ttid" TEXT NOT NULL,
    "uid" TEXT,
    "status" "ChipStatus" NOT NULL DEFAULT 'UNENCODED',
    "payloadType" "PayloadType",
    "payloadId" TEXT,
    "creatorId" UUID,
    "encodedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EncodedChip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChipActivation" (
    "id" UUID NOT NULL,
    "chipId" UUID NOT NULL,
    "userId" UUID,
    "ip" TEXT,
    "userAgent" TEXT,
    "countryCode" TEXT,
    "isFirst" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChipActivation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChipFraudSignal" (
    "id" UUID NOT NULL,
    "chipId" UUID NOT NULL,
    "kind" "FraudSignalKind" NOT NULL,
    "severity" "FraudSeverity" NOT NULL DEFAULT 'LOW',
    "details" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChipFraudSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CreatorOrder" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "status" "CreatorOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "shippingAddr" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreatorOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CreatorOrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "skuId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "payloadType" "PayloadType",
    "payloadId" TEXT,
    "unitCostCents" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CreatorOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VisualArtPiece" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "chipId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "process" TEXT,
    "story" TEXT,
    "meaning" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VisualArtPiece_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HardwareSku_code_key" ON "HardwareSku"("code");
CREATE INDEX IF NOT EXISTS "HardwareSku_code_idx" ON "HardwareSku"("code");
CREATE INDEX IF NOT EXISTS "HardwareSku_active_idx" ON "HardwareSku"("active");
CREATE INDEX IF NOT EXISTS "ChipBatch_skuId_idx" ON "ChipBatch"("skuId");
CREATE INDEX IF NOT EXISTS "ChipBatch_status_idx" ON "ChipBatch"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "EncodedChip_ttid_key" ON "EncodedChip"("ttid");
CREATE UNIQUE INDEX IF NOT EXISTS "EncodedChip_uid_key" ON "EncodedChip"("uid");
CREATE INDEX IF NOT EXISTS "EncodedChip_ttid_idx" ON "EncodedChip"("ttid");
CREATE INDEX IF NOT EXISTS "EncodedChip_uid_idx" ON "EncodedChip"("uid");
CREATE INDEX IF NOT EXISTS "EncodedChip_batchId_idx" ON "EncodedChip"("batchId");
CREATE INDEX IF NOT EXISTS "EncodedChip_status_idx" ON "EncodedChip"("status");
CREATE INDEX IF NOT EXISTS "EncodedChip_creatorId_idx" ON "EncodedChip"("creatorId");
CREATE INDEX IF NOT EXISTS "ChipActivation_chipId_idx" ON "ChipActivation"("chipId");
CREATE INDEX IF NOT EXISTS "ChipActivation_userId_idx" ON "ChipActivation"("userId");
CREATE INDEX IF NOT EXISTS "ChipActivation_createdAt_idx" ON "ChipActivation"("createdAt");
CREATE INDEX IF NOT EXISTS "ChipFraudSignal_chipId_idx" ON "ChipFraudSignal"("chipId");
CREATE INDEX IF NOT EXISTS "ChipFraudSignal_kind_idx" ON "ChipFraudSignal"("kind");
CREATE INDEX IF NOT EXISTS "ChipFraudSignal_resolved_idx" ON "ChipFraudSignal"("resolved");
CREATE INDEX IF NOT EXISTS "CreatorOrder_creatorId_idx" ON "CreatorOrder"("creatorId");
CREATE INDEX IF NOT EXISTS "CreatorOrder_status_idx" ON "CreatorOrder"("status");
CREATE INDEX IF NOT EXISTS "CreatorOrderItem_orderId_idx" ON "CreatorOrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "CreatorOrderItem_skuId_idx" ON "CreatorOrderItem"("skuId");
CREATE UNIQUE INDEX IF NOT EXISTS "VisualArtPiece_chipId_key" ON "VisualArtPiece"("chipId");
CREATE INDEX IF NOT EXISTS "VisualArtPiece_creatorId_idx" ON "VisualArtPiece"("creatorId");
CREATE INDEX IF NOT EXISTS "VisualArtPiece_chipId_idx" ON "VisualArtPiece"("chipId");
