-- Token Forge: multi-token registry, on-chain deployments, audit log

-- CreateEnum
CREATE TYPE "ChainId" AS ENUM ('SOLANA_DEVNET', 'SOLANA_TESTNET', 'SOLANA_MAINNET');

-- CreateEnum
CREATE TYPE "TokenKind" AS ENUM ('ROOT', 'LAYER', 'PARTNER', 'EXPERIMENTAL');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('DRAFT', 'DEPLOYED', 'FROZEN', 'RETIRED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'DEPLOYED', 'FROZEN', 'FAILED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "ManagedToken" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "description" TEXT,
  "kind" "TokenKind" NOT NULL DEFAULT 'EXPERIMENTAL',
  "parentTokenId" UUID,
  "status" "TokenStatus" NOT NULL DEFAULT 'DRAFT',
  "decimals" INTEGER NOT NULL DEFAULT 0,
  "supplyCap" BIGINT,
  "holderCap" INTEGER,
  "freezeOnDeploy" BOOLEAN NOT NULL DEFAULT false,
  "metadataUri" TEXT,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ManagedToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ManagedTokenDeployment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tokenId" UUID NOT NULL,
  "chain" "ChainId" NOT NULL,
  "mintAddress" TEXT NOT NULL,
  "mintAuthorityCipher" TEXT NOT NULL,
  "mintAuthorityPubkey" TEXT NOT NULL,
  "freezeAuthorityPubkey" TEXT,
  "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
  "supplyMinted" BIGINT NOT NULL DEFAULT 0,
  "txCreate" TEXT,
  "txFreeze" TEXT,
  "deployedAt" TIMESTAMP(3),
  "deployedById" UUID,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ManagedTokenDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TokenAuditEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tokenId" UUID NOT NULL,
  "deploymentId" UUID,
  "action" TEXT NOT NULL,
  "actorUserId" UUID NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TokenAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ManagedToken_symbol_kind_key" ON "ManagedToken" ("symbol", "kind");
CREATE INDEX IF NOT EXISTS "ManagedToken_kind_idx" ON "ManagedToken" ("kind");
CREATE INDEX IF NOT EXISTS "ManagedToken_status_idx" ON "ManagedToken" ("status");
CREATE INDEX IF NOT EXISTS "ManagedToken_parentTokenId_idx" ON "ManagedToken" ("parentTokenId");

CREATE UNIQUE INDEX IF NOT EXISTS "ManagedTokenDeployment_mintAddress_key" ON "ManagedTokenDeployment" ("mintAddress");
CREATE UNIQUE INDEX IF NOT EXISTS "ManagedTokenDeployment_tokenId_chain_key" ON "ManagedTokenDeployment" ("tokenId", "chain");
CREATE INDEX IF NOT EXISTS "ManagedTokenDeployment_chain_status_idx" ON "ManagedTokenDeployment" ("chain", "status");
CREATE INDEX IF NOT EXISTS "ManagedTokenDeployment_tokenId_idx" ON "ManagedTokenDeployment" ("tokenId");

CREATE INDEX IF NOT EXISTS "TokenAuditEvent_tokenId_createdAt_idx" ON "TokenAuditEvent" ("tokenId", "createdAt");
CREATE INDEX IF NOT EXISTS "TokenAuditEvent_action_idx" ON "TokenAuditEvent" ("action");
CREATE INDEX IF NOT EXISTS "TokenAuditEvent_deploymentId_idx" ON "TokenAuditEvent" ("deploymentId");
