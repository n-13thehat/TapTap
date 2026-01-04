-- CreateEnum
CREATE TYPE "ExternalRoyaltySource" AS ENUM ('DEEZER', 'BANDCAMP', 'OTHER');

-- CreateEnum
CREATE TYPE "ExternalRoyaltyStatus" AS ENUM ('UNCLAIMED', 'CLAIMED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('PARAMETER_CHANGE', 'TREASURY_SPEND', 'FEATURE_REQUEST', 'PLATFORM_UPGRADE', 'FEE_ADJUSTMENT', 'PARTNERSHIP', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUCCEEDED', 'DEFEATED', 'EXECUTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('FOR', 'AGAINST', 'ABSTAIN');

-- CreateEnum
CREATE TYPE "StakingPoolType" AS ENUM ('BASIC', 'PREMIUM', 'LIQUIDITY', 'NFT_BOOST', 'GOVERNANCE');

-- CreateEnum
CREATE TYPE "StakeStatus" AS ENUM ('ACTIVE', 'UNSTAKING', 'COMPLETED', 'SLASHED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('STAKING_YIELD', 'LIQUIDITY_MINING', 'GOVERNANCE_BONUS', 'NFT_MULTIPLIER', 'COMPOUND_INTEREST');

-- CreateEnum
CREATE TYPE "VestingType" AS ENUM ('LINEAR', 'CLIFF_THEN_LINEAR', 'MILESTONE_BASED', 'PERFORMANCE_BASED', 'HYBRID');

-- CreateEnum
CREATE TYPE "LiquidityRewardType" AS ENUM ('MINING_REWARD', 'TRADING_FEE', 'BONUS_MULTIPLIER', 'IMPERMANENT_LOSS_PROTECTION');

-- CreateEnum
CREATE TYPE "AirdropType" AS ENUM ('SNAPSHOT_BASED', 'ACTIVITY_BASED', 'REFERRAL_BASED', 'CREATOR_REWARDS', 'COMMUNITY_REWARDS', 'RETROACTIVE', 'MERKLE_TREE');

-- CreateEnum
CREATE TYPE "AirdropStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReferralRewardType" AS ENUM ('SIGNUP_BONUS', 'ACTIVITY_BONUS', 'MILESTONE_BONUS', 'PERFORMANCE_BONUS', 'LOYALTY_BONUS');

-- CreateEnum
CREATE TYPE "BridgeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'BRIDGING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NFTStakingType" AS ENUM ('MUSIC_NFTS', 'PROFILE_NFTS', 'UTILITY_NFTS', 'COLLECTION_SPECIFIC', 'CROSS_COLLECTION');

-- CreateEnum
CREATE TYPE "NFTStakeStatus" AS ENUM ('ACTIVE', 'UNSTAKING', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NFTRewardType" AS ENUM ('BASE_STAKING', 'RARITY_BONUS', 'LOYALTY_BONUS', 'COLLECTION_BONUS', 'SPECIAL_EVENT');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('TRANSFER_FEE', 'TRADING_FEE', 'STAKING_FEE', 'BRIDGE_FEE', 'WITHDRAWAL_FEE', 'PREMIUM_FEE');

-- CreateEnum
CREATE TYPE "CongestionLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TreasuryWalletType" AS ENUM ('MAIN_TREASURY', 'DEVELOPMENT_FUND', 'MARKETING_FUND', 'REWARDS_POOL', 'EMERGENCY_FUND', 'COMMUNITY_GRANTS');

-- CreateEnum
CREATE TYPE "TreasuryTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'ALLOCATION', 'GRANT', 'REWARD_DISTRIBUTION', 'EMERGENCY_SPEND', 'DEVELOPMENT_PAYMENT', 'MARKETING_SPEND');

-- CreateEnum
CREATE TYPE "TreasuryTransactionStatus" AS ENUM ('PENDING', 'PARTIALLY_SIGNED', 'FULLY_SIGNED', 'EXECUTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeagueTier" AS ENUM ('MAJOR', 'REGIONAL', 'UNDERGROUND', 'EMERGING');

-- CreateEnum
CREATE TYPE "BattleType" AS ENUM ('HEAD_TO_HEAD', 'TOURNAMENT', 'CYPHER', 'FREESTYLE', 'WRITTEN', 'ACAPELLA');

-- CreateEnum
CREATE TYPE "BattleContentStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'REMOVED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "FeaturedBattleStatus" AS ENUM ('NOMINATION', 'VOTING', 'FEATURED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('FIRE', 'CLAP', 'MIND_BLOWN', 'LAUGHING', 'CRINGE', 'SLEEPY', 'ANGRY', 'LOVE');

-- CreateEnum
CREATE TYPE "WagerType" AS ENUM ('REACTION_COUNT', 'BATTLER_WIN', 'REACTION_TYPE', 'VIEW_MILESTONE');

-- CreateEnum
CREATE TYPE "WagerStatus" AS ENUM ('ACTIVE', 'WON', 'LOST', 'CANCELLED', 'PENDING_SETTLEMENT');

-- CreateEnum
CREATE TYPE "PartnershipType" AS ENUM ('CONTENT_LICENSING', 'EXCLUSIVE_PREMIERE', 'REVENUE_SHARE', 'PROMOTIONAL');

-- CreateEnum
CREATE TYPE "UploadSessionStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LISTENER', 'CREATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('AUDIO', 'IMAGE', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('TEXT', 'TRACK', 'IMAGE', 'VIDEO', 'LINK', 'POLL');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'TRACK', 'IMAGE', 'VIDEO', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FOLLOW', 'LIKE', 'REPOST', 'COMMENT', 'MENTION', 'MESSAGE', 'ORDER_STATUS', 'STREAM_LIVE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'SOLANA', 'VENMO');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PAID', 'FULFILLED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('WEB', 'IOS', 'ANDROID', 'DESKTOP');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('TAP', 'USD', 'SOL');

-- CreateEnum
CREATE TYPE "PassFeature" AS ENUM ('SURF', 'COINS', 'BATTLES', 'LIVE', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARN', 'MUTE', 'SUSPEND', 'BAN', 'DELETE');

-- CreateEnum
CREATE TYPE "FavoriteTargetType" AS ENUM ('USER', 'TRACK', 'PLAYLIST', 'ALBUM', 'ARTIST', 'POST');

-- CreateEnum
CREATE TYPE "LikeTargetType" AS ENUM ('POST', 'COMMENT', 'TRACK');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('REFRESH', 'RESET', 'INVITE');

-- CreateEnum
CREATE TYPE "AIPersona" AS ENUM ('HOPE', 'MUSE', 'TREASURE', 'ZION');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "BmiSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "birthday" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authUserId" UUID NOT NULL,
    "country" TEXT,
    "deletedAt" TIMESTAMP(3),
    "hashedPassword" TEXT,
    "headerUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'LISTENER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "username" TEXT NOT NULL,
    "verified" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "id" UUID NOT NULL,
    "inviteCode" TEXT,
    "walletAddress" TEXT,
    "hasTapPass" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "location" TEXT,
    "links" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL DEFAULT 'WEB',
    "ua" TEXT,
    "lastSeen" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL DEFAULT 'REFRESH',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "stageName" TEXT NOT NULL,
    "about" TEXT,
    "links" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" UUID NOT NULL,
    "artistId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "releaseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waveform" (
    "id" UUID NOT NULL,
    "points" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waveform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" UUID NOT NULL,
    "artistId" UUID NOT NULL,
    "albumId" UUID,
    "title" TEXT NOT NULL,
    "durationMs" INTEGER,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "waveformId" UUID,
    "meta" JSONB,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackStat" (
    "id" UUID NOT NULL,
    "trackId" TEXT NOT NULL,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "repostCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackCredit" (
    "id" UUID NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" UUID NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Library" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryItem" (
    "id" UUID NOT NULL,
    "libraryId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteTarget" (
    "id" UUID NOT NULL,
    "type" "FavoriteTargetType" NOT NULL,
    "refId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followingId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "followerId" TEXT NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "linkUrl" TEXT,
    "mediaType" "MediaType",
    "mediaUrl" TEXT,
    "poll" JSONB,
    "text" TEXT,
    "trackId" TEXT,
    "type" "PostType" NOT NULL DEFAULT 'TEXT',
    "userId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "engagementWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "id" UUID NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,
    "text" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LikeTarget" (
    "id" UUID NOT NULL,
    "type" "LikeTargetType" NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "trackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikeTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repost" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "lastMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" UUID NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT,
    "mediaUrl" TEXT,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "id" UUID NOT NULL,
    "clientRequestId" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" UUID NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "desc" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" UUID NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "items" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalArtistRoyalty" (
    "id" UUID NOT NULL,
    "source" "ExternalRoyaltySource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "claimToken" TEXT,
    "pendingTap" INTEGER NOT NULL DEFAULT 0,
    "claimedByUserId" UUID,
    "status" "ExternalRoyaltyStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalArtistRoyalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalRoyaltyLedger" (
    "id" UUID NOT NULL,
    "artistRoyaltyId" UUID NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerUserId" UUID NOT NULL,
    "tapAmount" INTEGER NOT NULL,
    "grossTap" INTEGER NOT NULL,
    "taxApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalRoyaltyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'SOLANA',
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyerId" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "orderId" TEXT,
    "productId" TEXT,
    "id" UUID NOT NULL,
    "walletId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxEvent" (
    "id" UUID NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL,
    "treasury" INTEGER NOT NULL,
    "burn" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "type" "ProposalType" NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "votingPower" INTEGER NOT NULL DEFAULT 0,
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "votesAbstain" INTEGER NOT NULL DEFAULT 0,
    "quorumReached" BOOLEAN NOT NULL DEFAULT false,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "votingEndsAt" TIMESTAMP(3) NOT NULL,
    "executionData" JSONB,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalVote" (
    "id" UUID NOT NULL,
    "proposalId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "vote" "VoteChoice" NOT NULL,
    "votingPower" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteDelegation" (
    "id" UUID NOT NULL,
    "delegatorId" TEXT NOT NULL,
    "delegateId" TEXT NOT NULL,
    "votingPower" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "VoteDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakingPool" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "poolType" "StakingPoolType" NOT NULL,
    "minStakeAmount" INTEGER NOT NULL,
    "maxStakeAmount" INTEGER,
    "lockPeriodDays" INTEGER NOT NULL,
    "apy" DOUBLE PRECISION NOT NULL,
    "totalStaked" INTEGER NOT NULL DEFAULT 0,
    "totalRewards" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StakingPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stake" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "stakedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unstakedAt" TIMESTAMP(3),
    "lockEndsAt" TIMESTAMP(3) NOT NULL,
    "status" "StakeStatus" NOT NULL DEFAULT 'ACTIVE',
    "rewardsClaimed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Stake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakingReward" (
    "id" UUID NOT NULL,
    "stakeId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StakingReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VestingSchedule" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "beneficiaryId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "claimedAmount" INTEGER NOT NULL DEFAULT 0,
    "vestingType" "VestingType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "cliffDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3) NOT NULL,
    "isRevocable" BOOLEAN NOT NULL DEFAULT false,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VestingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VestingRelease" (
    "id" UUID NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VestingRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VestingMilestone" (
    "id" UUID NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VestingMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityPool" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tokenA" TEXT NOT NULL,
    "tokenB" TEXT NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "totalLiquidity" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalRewards" INTEGER NOT NULL DEFAULT 0,
    "rewardRate" INTEGER NOT NULL,
    "lastUpdateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodFinish" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidityPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityPosition" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "lpTokenAmount" DECIMAL(20,8) NOT NULL,
    "tokenAAmount" DECIMAL(20,8) NOT NULL,
    "tokenBAmount" DECIMAL(20,8) NOT NULL,
    "rewardDebt" INTEGER NOT NULL DEFAULT 0,
    "lastClaimTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidityPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityReward" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "rewardType" "LiquidityRewardType" NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirdropCampaign" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "claimedAmount" INTEGER NOT NULL DEFAULT 0,
    "campaignType" "AirdropType" NOT NULL,
    "status" "AirdropStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "merkleRoot" TEXT,
    "eligibilityCriteria" JSONB NOT NULL,
    "antiSybilEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxClaimPerUser" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirdropCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirdropEligibility" (
    "id" UUID NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "merkleProof" TEXT[],
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "eligibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AirdropEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirdropClaim" (
    "id" UUID NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eligibilityId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT,

    CONSTRAINT "AirdropClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralProgram" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxLevels" INTEGER NOT NULL DEFAULT 3,
    "baseReward" INTEGER NOT NULL DEFAULT 1000,
    "levelMultipliers" JSONB NOT NULL,
    "minReferrals" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" UUID NOT NULL,
    "programId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "level" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" UUID NOT NULL,
    "programId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "rewardType" "ReferralRewardType" NOT NULL,
    "level" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossChainBridge" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sourceChain" TEXT NOT NULL,
    "targetChain" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minAmount" INTEGER NOT NULL DEFAULT 1000,
    "maxAmount" INTEGER NOT NULL DEFAULT 1000000,
    "bridgeFee" INTEGER NOT NULL DEFAULT 100,
    "estimatedTime" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrossChainBridge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossChainTransfer" (
    "id" UUID NOT NULL,
    "bridgeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "bridgeFee" INTEGER NOT NULL,
    "sourceChain" TEXT NOT NULL,
    "targetChain" TEXT NOT NULL,
    "sourceTxHash" TEXT,
    "targetTxHash" TEXT,
    "status" "BridgeStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "CrossChainTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTStakingPool" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "collectionAddress" TEXT,
    "stakingType" "NFTStakingType" NOT NULL,
    "baseRewardRate" INTEGER NOT NULL DEFAULT 100,
    "rarityMultipliers" JSONB NOT NULL,
    "minStakingPeriod" INTEGER NOT NULL DEFAULT 1,
    "maxStakingPeriod" INTEGER,
    "totalStaked" INTEGER NOT NULL DEFAULT 0,
    "totalRewards" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NFTStakingPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTStake" (
    "id" UUID NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "nftMetadata" JSONB NOT NULL,
    "rarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stakingMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "stakedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unstakedAt" TIMESTAMP(3),
    "lockEndsAt" TIMESTAMP(3),
    "status" "NFTStakeStatus" NOT NULL DEFAULT 'ACTIVE',
    "rewardsClaimed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NFTStake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTStakingReward" (
    "id" UUID NOT NULL,
    "poolId" TEXT NOT NULL,
    "stakeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "rewardType" "NFTRewardType" NOT NULL,
    "rarityBonus" INTEGER NOT NULL DEFAULT 0,
    "loyaltyBonus" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NFTStakingReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "feeType" "FeeType" NOT NULL,
    "baseRate" DOUBLE PRECISION NOT NULL,
    "minFee" INTEGER NOT NULL DEFAULT 1,
    "maxFee" INTEGER NOT NULL DEFAULT 10000,
    "tierMultipliers" JSONB NOT NULL,
    "congestionMultipliers" JSONB NOT NULL,
    "volumeDiscounts" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeApplication" (
    "id" UUID NOT NULL,
    "structureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "baseAmount" INTEGER NOT NULL,
    "feeAmount" INTEGER NOT NULL,
    "effectiveRate" DOUBLE PRECISION NOT NULL,
    "tierDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volumeDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "congestionMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkMetrics" (
    "id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "transactionVolume" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "congestionLevel" "CongestionLevel" NOT NULL DEFAULT 'LOW',
    "feeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "NetworkMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryWallet" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "walletAddress" TEXT NOT NULL,
    "walletType" "TreasuryWalletType" NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresMultisig" BOOLEAN NOT NULL DEFAULT true,
    "signatories" JSONB NOT NULL,
    "minSignatures" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryTransaction" (
    "id" UUID NOT NULL,
    "walletId" TEXT NOT NULL,
    "proposalId" TEXT,
    "amount" INTEGER NOT NULL,
    "transactionType" "TreasuryTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "recipient" TEXT,
    "txHash" TEXT,
    "status" "TreasuryTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "signatures" JSONB NOT NULL DEFAULT '[]',
    "requiredSignatures" INTEGER NOT NULL DEFAULT 2,
    "initiatedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryAllocation" (
    "id" UUID NOT NULL,
    "walletId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "allocatedAmount" INTEGER NOT NULL,
    "spentAmount" INTEGER NOT NULL DEFAULT 0,
    "remainingAmount" INTEGER NOT NULL,
    "allocationPeriod" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleLeague" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "youtubeChannelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tier" "LeagueTier" NOT NULL DEFAULT 'MAJOR',
    "totalBattles" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "avgViewCount" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattleLeague_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleContent" (
    "id" UUID NOT NULL,
    "leagueId" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "battlerA" TEXT,
    "battlerB" TEXT,
    "battleType" "BattleType" NOT NULL DEFAULT 'HEAD_TO_HEAD',
    "status" "BattleContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyFeaturedBattle" (
    "id" UUID NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "status" "FeaturedBattleStatus" NOT NULL DEFAULT 'NOMINATION',
    "votingStartsAt" TIMESTAMP(3) NOT NULL,
    "votingEndsAt" TIMESTAMP(3) NOT NULL,
    "featuredBattleId" TEXT,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "totalViewers" INTEGER NOT NULL DEFAULT 0,
    "prizePool" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyFeaturedBattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedBattleNomination" (
    "id" UUID NOT NULL,
    "weeklyFeaturedId" TEXT NOT NULL,
    "battleContentId" TEXT NOT NULL,
    "nominatedBy" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedBattleNomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedBattleVote" (
    "id" UUID NOT NULL,
    "weeklyFeaturedId" TEXT NOT NULL,
    "nominationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votingPower" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedBattleVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleReaction" (
    "id" UUID NOT NULL,
    "battleContentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL,
    "intensity" INTEGER NOT NULL DEFAULT 1,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,

    CONSTRAINT "BattleReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleAnalytics" (
    "id" UUID NOT NULL,
    "battleContentId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalReactions" INTEGER NOT NULL DEFAULT 0,
    "reactionBreakdown" JSONB NOT NULL,
    "activeViewers" INTEGER NOT NULL DEFAULT 0,
    "totalWagers" INTEGER NOT NULL DEFAULT 0,
    "wagerVolume" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "BattleAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaguePartnership" (
    "id" UUID NOT NULL,
    "leagueId" TEXT NOT NULL,
    "partnershipType" "PartnershipType" NOT NULL,
    "status" "PartnershipType" NOT NULL DEFAULT 'REVENUE_SHARE',
    "revenueShare" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "exclusivity" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaguePartnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TapPass" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TapPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TapCoinTransaction" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TapCoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveStream" (
    "id" UUID NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveChatMessage" (
    "id" UUID NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" UUID NOT NULL,
    "aUserId" TEXT NOT NULL,
    "bUserId" TEXT NOT NULL,
    "winnerId" TEXT,
    "rules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" UUID NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VoteType" NOT NULL DEFAULT 'UP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleUnlock" (
    "id" UUID NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT,
    "treasureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "uploadId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "uploadedBytes" INTEGER NOT NULL DEFAULT 0,
    "uploadedChunks" TEXT NOT NULL DEFAULT '[]',
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "status" "UploadSessionStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "tempDir" TEXT,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayEvent" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "trackId" TEXT NOT NULL,
    "deviceId" TEXT,
    "sessionId" TEXT,
    "msPlayed" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" UUID NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "clientTimestamp" TIMESTAMP(3) NOT NULL,
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBatch" (
    "id" UUID NOT NULL,
    "batchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "processedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "clientTimestamp" TIMESTAMP(3),
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "context" TEXT NOT NULL DEFAULT '{}',
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDialog" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "title" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIDialog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITask" (
    "id" UUID NOT NULL,
    "dialogId" TEXT,
    "userId" TEXT,
    "input" TEXT,
    "output" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AITask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "space" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "vector" BYTEA NOT NULL,
    "dims" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIProfile" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "persona" "AIPersona" NOT NULL DEFAULT 'HOPE',
    "systemPrompt" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInteractionLog" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "profileId" TEXT,
    "message" TEXT NOT NULL,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" UUID NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "action" "ModerationActionType" NOT NULL DEFAULT 'WARN',
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIKey" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaInvite" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "claimedByUserId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "userGroups" JSONB DEFAULT '[]',
    "environment" TEXT NOT NULL DEFAULT 'all',
    "expiresAt" TIMESTAMP(3),
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" TEXT,
    "readAt" TIMESTAMP(3),
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurfSession" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "secondsPlayed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SurfSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurfAllowance" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "minutesAvailable" INTEGER NOT NULL DEFAULT 0,
    "refreshedAt" TIMESTAMP(3),

    CONSTRAINT "SurfAllowance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treasure" (
    "id" UUID NOT NULL,
    "creatorId" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TAP',
    "amount" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT,
    "meta" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Treasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMission" (
    "id" UUID NOT NULL,
    "treasureId" TEXT,
    "name" TEXT NOT NULL,
    "desc" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMissionProgress" (
    "id" UUID NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricEvent" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "targetId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchIndex" (
    "id" UUID NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "keywords" JSONB,
    "vector" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tier" (
    "id" UUID NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "perks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "creatorId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "renewsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" UUID NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PENDING',
    "items" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "genre" TEXT,
    "socialLinks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tone" TEXT,
    "vibe" TEXT,
    "signature" TEXT,
    "summary" TEXT,
    "version" TEXT DEFAULT '2.0.0',
    "meta" JSONB,
    "changelog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTool" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AgentTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentDataset" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "AgentDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPlaybook" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AgentPlaybook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentGuardrail" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,

    CONSTRAINT "AgentGuardrail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentHandoff" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "toName" TEXT NOT NULL,

    CONSTRAINT "AgentHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentKPI" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "target" TEXT,

    CONSTRAINT "AgentKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentEval" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AgentEval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentCadence" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentCadence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentABTest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "variants" TEXT,
    "sample" DOUBLE PRECISION,
    "metrics" TEXT,
    "logPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentABTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPrompt" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentReport" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "path" TEXT,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "agentName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "inputs" TEXT,
    "outputs" TEXT,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BmiConnection" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BmiConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BmiOAuthState" (
    "id" UUID NOT NULL,
    "state" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bmiConnectionId" TEXT,

    CONSTRAINT "BmiOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BmiTrackRegistration" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "status" "BmiSyncStatus" NOT NULL DEFAULT 'PENDING',
    "payload" TEXT,
    "response" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bmiConnectionId" TEXT,

    CONSTRAINT "BmiTrackRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BmiPerformanceLog" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "streamDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" DOUBLE PRECISION NOT NULL,
    "audienceCount" INTEGER NOT NULL,
    "payload" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bmiConnectionId" TEXT,

    CONSTRAINT "BmiPerformanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_authUserId_idx" ON "User"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_deviceId_idx" ON "Session"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthToken_userId_idx" ON "AuthToken"("userId");

-- CreateIndex
CREATE INDEX "AuthToken_type_idx" ON "AuthToken"("type");

-- CreateIndex
CREATE INDEX "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_userId_key" ON "Artist"("userId");

-- CreateIndex
CREATE INDEX "Artist_userId_idx" ON "Artist"("userId");

-- CreateIndex
CREATE INDEX "Album_artistId_idx" ON "Album"("artistId");

-- CreateIndex
CREATE INDEX "Track_artistId_idx" ON "Track"("artistId");

-- CreateIndex
CREATE INDEX "Track_albumId_idx" ON "Track"("albumId");

-- CreateIndex
CREATE INDEX "Track_visibility_idx" ON "Track"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "TrackStat_trackId_key" ON "TrackStat"("trackId");

-- CreateIndex
CREATE INDEX "TrackCredit_trackId_idx" ON "TrackCredit"("trackId");

-- CreateIndex
CREATE INDEX "TrackCredit_userId_idx" ON "TrackCredit"("userId");

-- CreateIndex
CREATE INDEX "Playlist_userId_idx" ON "Playlist"("userId");

-- CreateIndex
CREATE INDEX "Playlist_visibility_idx" ON "Playlist"("visibility");

-- CreateIndex
CREATE INDEX "PlaylistTrack_playlistId_idx" ON "PlaylistTrack"("playlistId");

-- CreateIndex
CREATE INDEX "PlaylistTrack_trackId_idx" ON "PlaylistTrack"("trackId");

-- CreateIndex
CREATE INDEX "PlaylistTrack_addedById_idx" ON "PlaylistTrack"("addedById");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_playlistId_trackId_key" ON "PlaylistTrack"("playlistId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "Library_userId_key" ON "Library"("userId");

-- CreateIndex
CREATE INDEX "Library_userId_idx" ON "Library"("userId");

-- CreateIndex
CREATE INDEX "LibraryItem_libraryId_idx" ON "LibraryItem"("libraryId");

-- CreateIndex
CREATE INDEX "LibraryItem_trackId_idx" ON "LibraryItem"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryItem_libraryId_trackId_key" ON "LibraryItem"("libraryId", "trackId");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_targetId_idx" ON "Favorite"("targetId");

-- CreateIndex
CREATE INDEX "FavoriteTarget_refId_idx" ON "FavoriteTarget"("refId");

-- CreateIndex
CREATE INDEX "FavoriteTarget_type_idx" ON "FavoriteTarget"("type");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_trackId_idx" ON "Post"("trackId");

-- CreateIndex
CREATE INDEX "Post_visibility_idx" ON "Post"("visibility");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_engagementWeight_idx" ON "Post"("engagementWeight");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

-- CreateIndex
CREATE INDEX "Like_targetId_idx" ON "Like"("targetId");

-- CreateIndex
CREATE INDEX "LikeTarget_postId_idx" ON "LikeTarget"("postId");

-- CreateIndex
CREATE INDEX "LikeTarget_commentId_idx" ON "LikeTarget"("commentId");

-- CreateIndex
CREATE INDEX "LikeTarget_trackId_idx" ON "LikeTarget"("trackId");

-- CreateIndex
CREATE INDEX "Repost_userId_idx" ON "Repost"("userId");

-- CreateIndex
CREATE INDEX "Repost_postId_idx" ON "Repost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Repost_userId_postId_key" ON "Repost"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "PostTag_tagId_idx" ON "PostTag"("tagId");

-- CreateIndex
CREATE INDEX "PostTag_postId_idx" ON "PostTag"("postId");

-- CreateIndex
CREATE INDEX "Chat_lastMessageId_idx" ON "Chat"("lastMessageId");

-- CreateIndex
CREATE INDEX "ChatParticipant_chatId_idx" ON "ChatParticipant"("chatId");

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_idx" ON "ChatParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_chatId_userId_key" ON "ChatParticipant"("chatId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_clientRequestId_key" ON "Message"("clientRequestId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "MessageRead_messageId_idx" ON "MessageRead"("messageId");

-- CreateIndex
CREATE INDEX "MessageRead_userId_idx" ON "MessageRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");

-- CreateIndex
CREATE INDEX "Product_ownerId_idx" ON "Product"("ownerId");

-- CreateIndex
CREATE INDEX "Product_currency_idx" ON "Product"("currency");

-- CreateIndex
CREATE INDEX "Review_productId_idx" ON "Review"("productId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");

-- CreateIndex
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_currency_idx" ON "Order"("currency");

-- CreateIndex
CREATE INDEX "Payout_userId_idx" ON "Payout"("userId");

-- CreateIndex
CREATE INDEX "Payout_currency_idx" ON "Payout"("currency");

-- CreateIndex
CREATE INDEX "ExternalArtistRoyalty_status_idx" ON "ExternalArtistRoyalty"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalArtistRoyalty_source_sourceId_key" ON "ExternalArtistRoyalty"("source", "sourceId");

-- CreateIndex
CREATE INDEX "ExternalRoyaltyLedger_artistRoyaltyId_idx" ON "ExternalRoyaltyLedger"("artistRoyaltyId");

-- CreateIndex
CREATE INDEX "ExternalRoyaltyLedger_buyerUserId_idx" ON "ExternalRoyaltyLedger"("buyerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_provider_idx" ON "Wallet"("provider");

-- CreateIndex
CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

-- CreateIndex
CREATE INDEX "Transaction_buyerId_idx" ON "Transaction"("buyerId");

-- CreateIndex
CREATE INDEX "Transaction_productId_idx" ON "Transaction"("productId");

-- CreateIndex
CREATE INDEX "Transaction_currency_idx" ON "Transaction"("currency");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE INDEX "Proposal_type_idx" ON "Proposal"("type");

-- CreateIndex
CREATE INDEX "Proposal_votingEndsAt_idx" ON "Proposal"("votingEndsAt");

-- CreateIndex
CREATE INDEX "ProposalVote_proposalId_idx" ON "ProposalVote"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalVote_voterId_idx" ON "ProposalVote"("voterId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalVote_proposalId_voterId_key" ON "ProposalVote"("proposalId", "voterId");

-- CreateIndex
CREATE INDEX "VoteDelegation_delegateId_idx" ON "VoteDelegation"("delegateId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteDelegation_delegatorId_delegateId_key" ON "VoteDelegation"("delegatorId", "delegateId");

-- CreateIndex
CREATE INDEX "StakingPool_poolType_idx" ON "StakingPool"("poolType");

-- CreateIndex
CREATE INDEX "StakingPool_isActive_idx" ON "StakingPool"("isActive");

-- CreateIndex
CREATE INDEX "Stake_userId_idx" ON "Stake"("userId");

-- CreateIndex
CREATE INDEX "Stake_poolId_idx" ON "Stake"("poolId");

-- CreateIndex
CREATE INDEX "Stake_status_idx" ON "Stake"("status");

-- CreateIndex
CREATE INDEX "Stake_lockEndsAt_idx" ON "Stake"("lockEndsAt");

-- CreateIndex
CREATE INDEX "StakingReward_userId_idx" ON "StakingReward"("userId");

-- CreateIndex
CREATE INDEX "StakingReward_stakeId_idx" ON "StakingReward"("stakeId");

-- CreateIndex
CREATE INDEX "StakingReward_claimedAt_idx" ON "StakingReward"("claimedAt");

-- CreateIndex
CREATE INDEX "VestingSchedule_beneficiaryId_idx" ON "VestingSchedule"("beneficiaryId");

-- CreateIndex
CREATE INDEX "VestingSchedule_vestingType_idx" ON "VestingSchedule"("vestingType");

-- CreateIndex
CREATE INDEX "VestingSchedule_startDate_idx" ON "VestingSchedule"("startDate");

-- CreateIndex
CREATE INDEX "VestingSchedule_endDate_idx" ON "VestingSchedule"("endDate");

-- CreateIndex
CREATE INDEX "VestingRelease_scheduleId_idx" ON "VestingRelease"("scheduleId");

-- CreateIndex
CREATE INDEX "VestingRelease_releaseDate_idx" ON "VestingRelease"("releaseDate");

-- CreateIndex
CREATE INDEX "VestingRelease_claimedAt_idx" ON "VestingRelease"("claimedAt");

-- CreateIndex
CREATE INDEX "VestingMilestone_scheduleId_idx" ON "VestingMilestone"("scheduleId");

-- CreateIndex
CREATE INDEX "VestingMilestone_isCompleted_idx" ON "VestingMilestone"("isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPool_poolAddress_key" ON "LiquidityPool"("poolAddress");

-- CreateIndex
CREATE INDEX "LiquidityPool_poolAddress_idx" ON "LiquidityPool"("poolAddress");

-- CreateIndex
CREATE INDEX "LiquidityPool_isActive_idx" ON "LiquidityPool"("isActive");

-- CreateIndex
CREATE INDEX "LiquidityPool_periodFinish_idx" ON "LiquidityPool"("periodFinish");

-- CreateIndex
CREATE INDEX "LiquidityPosition_userId_idx" ON "LiquidityPosition"("userId");

-- CreateIndex
CREATE INDEX "LiquidityPosition_poolId_idx" ON "LiquidityPosition"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPosition_userId_poolId_key" ON "LiquidityPosition"("userId", "poolId");

-- CreateIndex
CREATE INDEX "LiquidityReward_userId_idx" ON "LiquidityReward"("userId");

-- CreateIndex
CREATE INDEX "LiquidityReward_poolId_idx" ON "LiquidityReward"("poolId");

-- CreateIndex
CREATE INDEX "LiquidityReward_claimedAt_idx" ON "LiquidityReward"("claimedAt");

-- CreateIndex
CREATE INDEX "AirdropCampaign_status_idx" ON "AirdropCampaign"("status");

-- CreateIndex
CREATE INDEX "AirdropCampaign_startDate_idx" ON "AirdropCampaign"("startDate");

-- CreateIndex
CREATE INDEX "AirdropCampaign_endDate_idx" ON "AirdropCampaign"("endDate");

-- CreateIndex
CREATE INDEX "AirdropCampaign_campaignType_idx" ON "AirdropCampaign"("campaignType");

-- CreateIndex
CREATE INDEX "AirdropEligibility_userId_idx" ON "AirdropEligibility"("userId");

-- CreateIndex
CREATE INDEX "AirdropEligibility_isEligible_idx" ON "AirdropEligibility"("isEligible");

-- CreateIndex
CREATE UNIQUE INDEX "AirdropEligibility_campaignId_userId_key" ON "AirdropEligibility"("campaignId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AirdropClaim_eligibilityId_key" ON "AirdropClaim"("eligibilityId");

-- CreateIndex
CREATE INDEX "AirdropClaim_userId_idx" ON "AirdropClaim"("userId");

-- CreateIndex
CREATE INDEX "AirdropClaim_claimedAt_idx" ON "AirdropClaim"("claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AirdropClaim_campaignId_userId_key" ON "AirdropClaim"("campaignId", "userId");

-- CreateIndex
CREATE INDEX "ReferralProgram_isActive_idx" ON "ReferralProgram"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referralCode_key" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_refereeId_idx" ON "Referral"("refereeId");

-- CreateIndex
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referrerId_refereeId_key" ON "Referral"("referrerId", "refereeId");

-- CreateIndex
CREATE INDEX "ReferralReward_userId_idx" ON "ReferralReward"("userId");

-- CreateIndex
CREATE INDEX "ReferralReward_referralId_idx" ON "ReferralReward"("referralId");

-- CreateIndex
CREATE INDEX "ReferralReward_claimedAt_idx" ON "ReferralReward"("claimedAt");

-- CreateIndex
CREATE INDEX "CrossChainBridge_isActive_idx" ON "CrossChainBridge"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CrossChainBridge_sourceChain_targetChain_key" ON "CrossChainBridge"("sourceChain", "targetChain");

-- CreateIndex
CREATE INDEX "CrossChainTransfer_userId_idx" ON "CrossChainTransfer"("userId");

-- CreateIndex
CREATE INDEX "CrossChainTransfer_status_idx" ON "CrossChainTransfer"("status");

-- CreateIndex
CREATE INDEX "CrossChainTransfer_sourceChain_idx" ON "CrossChainTransfer"("sourceChain");

-- CreateIndex
CREATE INDEX "CrossChainTransfer_targetChain_idx" ON "CrossChainTransfer"("targetChain");

-- CreateIndex
CREATE INDEX "CrossChainTransfer_sourceTxHash_idx" ON "CrossChainTransfer"("sourceTxHash");

-- CreateIndex
CREATE INDEX "NFTStakingPool_stakingType_idx" ON "NFTStakingPool"("stakingType");

-- CreateIndex
CREATE INDEX "NFTStakingPool_isActive_idx" ON "NFTStakingPool"("isActive");

-- CreateIndex
CREATE INDEX "NFTStake_userId_idx" ON "NFTStake"("userId");

-- CreateIndex
CREATE INDEX "NFTStake_poolId_idx" ON "NFTStake"("poolId");

-- CreateIndex
CREATE INDEX "NFTStake_status_idx" ON "NFTStake"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NFTStake_nftId_poolId_key" ON "NFTStake"("nftId", "poolId");

-- CreateIndex
CREATE INDEX "NFTStakingReward_userId_idx" ON "NFTStakingReward"("userId");

-- CreateIndex
CREATE INDEX "NFTStakingReward_stakeId_idx" ON "NFTStakingReward"("stakeId");

-- CreateIndex
CREATE INDEX "NFTStakingReward_claimedAt_idx" ON "NFTStakingReward"("claimedAt");

-- CreateIndex
CREATE INDEX "FeeStructure_feeType_idx" ON "FeeStructure"("feeType");

-- CreateIndex
CREATE INDEX "FeeStructure_isActive_idx" ON "FeeStructure"("isActive");

-- CreateIndex
CREATE INDEX "FeeApplication_userId_idx" ON "FeeApplication"("userId");

-- CreateIndex
CREATE INDEX "FeeApplication_transactionType_idx" ON "FeeApplication"("transactionType");

-- CreateIndex
CREATE INDEX "FeeApplication_appliedAt_idx" ON "FeeApplication"("appliedAt");

-- CreateIndex
CREATE INDEX "NetworkMetrics_timestamp_idx" ON "NetworkMetrics"("timestamp");

-- CreateIndex
CREATE INDEX "NetworkMetrics_congestionLevel_idx" ON "NetworkMetrics"("congestionLevel");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryWallet_walletAddress_key" ON "TreasuryWallet"("walletAddress");

-- CreateIndex
CREATE INDEX "TreasuryWallet_walletType_idx" ON "TreasuryWallet"("walletType");

-- CreateIndex
CREATE INDEX "TreasuryWallet_isActive_idx" ON "TreasuryWallet"("isActive");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_walletId_idx" ON "TreasuryTransaction"("walletId");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_status_idx" ON "TreasuryTransaction"("status");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_transactionType_idx" ON "TreasuryTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "TreasuryAllocation_walletId_idx" ON "TreasuryAllocation"("walletId");

-- CreateIndex
CREATE INDEX "TreasuryAllocation_category_idx" ON "TreasuryAllocation"("category");

-- CreateIndex
CREATE INDEX "TreasuryAllocation_isActive_idx" ON "TreasuryAllocation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BattleLeague_youtubeChannelId_key" ON "BattleLeague"("youtubeChannelId");

-- CreateIndex
CREATE INDEX "BattleLeague_youtubeChannelId_idx" ON "BattleLeague"("youtubeChannelId");

-- CreateIndex
CREATE INDEX "BattleLeague_tier_idx" ON "BattleLeague"("tier");

-- CreateIndex
CREATE INDEX "BattleLeague_isActive_idx" ON "BattleLeague"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BattleContent_youtubeVideoId_key" ON "BattleContent"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "BattleContent_leagueId_idx" ON "BattleContent"("leagueId");

-- CreateIndex
CREATE INDEX "BattleContent_publishedAt_idx" ON "BattleContent"("publishedAt");

-- CreateIndex
CREATE INDEX "BattleContent_isFeatured_idx" ON "BattleContent"("isFeatured");

-- CreateIndex
CREATE INDEX "BattleContent_status_idx" ON "BattleContent"("status");

-- CreateIndex
CREATE INDEX "WeeklyFeaturedBattle_status_idx" ON "WeeklyFeaturedBattle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyFeaturedBattle_weekStartDate_key" ON "WeeklyFeaturedBattle"("weekStartDate");

-- CreateIndex
CREATE INDEX "FeaturedBattleNomination_weeklyFeaturedId_idx" ON "FeaturedBattleNomination"("weeklyFeaturedId");

-- CreateIndex
CREATE INDEX "FeaturedBattleNomination_votes_idx" ON "FeaturedBattleNomination"("votes");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedBattleNomination_weeklyFeaturedId_battleContentId_key" ON "FeaturedBattleNomination"("weeklyFeaturedId", "battleContentId");

-- CreateIndex
CREATE INDEX "FeaturedBattleVote_weeklyFeaturedId_idx" ON "FeaturedBattleVote"("weeklyFeaturedId");

-- CreateIndex
CREATE INDEX "FeaturedBattleVote_userId_idx" ON "FeaturedBattleVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedBattleVote_weeklyFeaturedId_userId_key" ON "FeaturedBattleVote"("weeklyFeaturedId", "userId");

-- CreateIndex
CREATE INDEX "BattleReaction_battleContentId_idx" ON "BattleReaction"("battleContentId");

-- CreateIndex
CREATE INDEX "BattleReaction_userId_idx" ON "BattleReaction"("userId");

-- CreateIndex
CREATE INDEX "BattleReaction_timestamp_idx" ON "BattleReaction"("timestamp");

-- CreateIndex
CREATE INDEX "BattleReaction_reactionType_idx" ON "BattleReaction"("reactionType");

-- CreateIndex
CREATE INDEX "BattleAnalytics_battleContentId_idx" ON "BattleAnalytics"("battleContentId");

-- CreateIndex
CREATE INDEX "BattleAnalytics_timestamp_idx" ON "BattleAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "LeaguePartnership_leagueId_idx" ON "LeaguePartnership"("leagueId");

-- CreateIndex
CREATE INDEX "LeaguePartnership_partnershipType_idx" ON "LeaguePartnership"("partnershipType");

-- CreateIndex
CREATE INDEX "TapPass_userId_idx" ON "TapPass"("userId");

-- CreateIndex
CREATE INDEX "TapPass_level_idx" ON "TapPass"("level");

-- CreateIndex
CREATE INDEX "TapPass_isActive_idx" ON "TapPass"("isActive");

-- CreateIndex
CREATE INDEX "TapPass_expiresAt_idx" ON "TapPass"("expiresAt");

-- CreateIndex
CREATE INDEX "TapCoinTransaction_userId_idx" ON "TapCoinTransaction"("userId");

-- CreateIndex
CREATE INDEX "TapCoinTransaction_walletId_idx" ON "TapCoinTransaction"("walletId");

-- CreateIndex
CREATE INDEX "LiveStream_creatorId_idx" ON "LiveStream"("creatorId");

-- CreateIndex
CREATE INDEX "LiveStream_visibility_idx" ON "LiveStream"("visibility");

-- CreateIndex
CREATE INDEX "LiveChatMessage_streamId_idx" ON "LiveChatMessage"("streamId");

-- CreateIndex
CREATE INDEX "LiveChatMessage_userId_idx" ON "LiveChatMessage"("userId");

-- CreateIndex
CREATE INDEX "Battle_aUserId_idx" ON "Battle"("aUserId");

-- CreateIndex
CREATE INDEX "Battle_bUserId_idx" ON "Battle"("bUserId");

-- CreateIndex
CREATE INDEX "Battle_winnerId_idx" ON "Battle"("winnerId");

-- CreateIndex
CREATE INDEX "Vote_battleId_idx" ON "Vote"("battleId");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_battleId_userId_key" ON "Vote"("battleId", "userId");

-- CreateIndex
CREATE INDEX "BattleUnlock_battleId_idx" ON "BattleUnlock"("battleId");

-- CreateIndex
CREATE INDEX "BattleUnlock_userId_idx" ON "BattleUnlock"("userId");

-- CreateIndex
CREATE INDEX "BattleUnlock_treasureId_idx" ON "BattleUnlock"("treasureId");

-- CreateIndex
CREATE INDEX "Upload_userId_idx" ON "Upload"("userId");

-- CreateIndex
CREATE INDEX "UploadSession_userId_idx" ON "UploadSession"("userId");

-- CreateIndex
CREATE INDEX "UploadSession_trackId_idx" ON "UploadSession"("trackId");

-- CreateIndex
CREATE INDEX "PlayEvent_userId_idx" ON "PlayEvent"("userId");

-- CreateIndex
CREATE INDEX "PlayEvent_trackId_idx" ON "PlayEvent"("trackId");

-- CreateIndex
CREATE INDEX "PlayEvent_deviceId_idx" ON "PlayEvent"("deviceId");

-- CreateIndex
CREATE INDEX "PlayEvent_sessionId_idx" ON "PlayEvent"("sessionId");

-- CreateIndex
CREATE INDEX "PlayEvent_timestamp_idx" ON "PlayEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "EventLog_eventId_key" ON "EventLog"("eventId");

-- CreateIndex
CREATE INDEX "EventLog_userId_idx" ON "EventLog"("userId");

-- CreateIndex
CREATE INDEX "EventLog_eventType_idx" ON "EventLog"("eventType");

-- CreateIndex
CREATE INDEX "EventLog_sessionId_idx" ON "EventLog"("sessionId");

-- CreateIndex
CREATE INDEX "EventLog_serverTimestamp_idx" ON "EventLog"("serverTimestamp");

-- CreateIndex
CREATE INDEX "EventLog_clientTimestamp_idx" ON "EventLog"("clientTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "EventBatch_batchId_key" ON "EventBatch"("batchId");

-- CreateIndex
CREATE INDEX "EventBatch_userId_idx" ON "EventBatch"("userId");

-- CreateIndex
CREATE INDEX "EventBatch_serverTimestamp_idx" ON "EventBatch"("serverTimestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "ErrorLog_userId_idx" ON "ErrorLog"("userId");

-- CreateIndex
CREATE INDEX "ErrorLog_errorType_idx" ON "ErrorLog"("errorType");

-- CreateIndex
CREATE INDEX "ErrorLog_sessionId_idx" ON "ErrorLog"("sessionId");

-- CreateIndex
CREATE INDEX "ErrorLog_timestamp_idx" ON "ErrorLog"("timestamp");

-- CreateIndex
CREATE INDEX "AITask_dialogId_idx" ON "AITask"("dialogId");

-- CreateIndex
CREATE INDEX "AITask_userId_idx" ON "AITask"("userId");

-- CreateIndex
CREATE INDEX "Embedding_space_refId_idx" ON "Embedding"("space", "refId");

-- CreateIndex
CREATE INDEX "Embedding_userId_idx" ON "Embedding"("userId");

-- CreateIndex
CREATE INDEX "Recommendation_userId_idx" ON "Recommendation"("userId");

-- CreateIndex
CREATE INDEX "Recommendation_trackId_idx" ON "Recommendation"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_userId_trackId_key" ON "Recommendation"("userId", "trackId");

-- CreateIndex
CREATE INDEX "AIProfile_userId_idx" ON "AIProfile"("userId");

-- CreateIndex
CREATE INDEX "AIProfile_persona_idx" ON "AIProfile"("persona");

-- CreateIndex
CREATE INDEX "AIInteractionLog_userId_idx" ON "AIInteractionLog"("userId");

-- CreateIndex
CREATE INDEX "AIInteractionLog_profileId_idx" ON "AIInteractionLog"("profileId");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ModerationAction_moderatorId_idx" ON "ModerationAction"("moderatorId");

-- CreateIndex
CREATE INDEX "ModerationAction_targetType_targetId_idx" ON "ModerationAction"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "APIKey_keyHash_key" ON "APIKey"("keyHash");

-- CreateIndex
CREATE INDEX "APIKey_userId_idx" ON "APIKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BetaInvite_code_key" ON "BetaInvite"("code");

-- CreateIndex
CREATE INDEX "BetaInvite_claimedByUserId_idx" ON "BetaInvite"("claimedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_environment_idx" ON "FeatureFlag"("environment");

-- CreateIndex
CREATE INDEX "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");

-- CreateIndex
CREATE INDEX "FeatureFlag_expiresAt_idx" ON "FeatureFlag"("expiresAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Setting_userId_idx" ON "Setting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_userId_key_key" ON "Setting"("userId", "key");

-- CreateIndex
CREATE INDEX "SurfSession_userId_idx" ON "SurfSession"("userId");

-- CreateIndex
CREATE INDEX "SurfSession_youtubeVideoId_idx" ON "SurfSession"("youtubeVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "SurfAllowance_userId_key" ON "SurfAllowance"("userId");

-- CreateIndex
CREATE INDEX "SurfAllowance_userId_idx" ON "SurfAllowance"("userId");

-- CreateIndex
CREATE INDEX "History_userId_idx" ON "History"("userId");

-- CreateIndex
CREATE INDEX "History_targetType_targetId_idx" ON "History"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Treasure_creatorId_idx" ON "Treasure"("creatorId");

-- CreateIndex
CREATE INDEX "Treasure_currency_idx" ON "Treasure"("currency");

-- CreateIndex
CREATE INDEX "AIMission_treasureId_idx" ON "AIMission"("treasureId");

-- CreateIndex
CREATE INDEX "AIMission_isActive_idx" ON "AIMission"("isActive");

-- CreateIndex
CREATE INDEX "AIMissionProgress_missionId_idx" ON "AIMissionProgress"("missionId");

-- CreateIndex
CREATE INDEX "AIMissionProgress_userId_idx" ON "AIMissionProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AIMissionProgress_missionId_userId_key" ON "AIMissionProgress"("missionId", "userId");

-- CreateIndex
CREATE INDEX "MetricEvent_userId_idx" ON "MetricEvent"("userId");

-- CreateIndex
CREATE INDEX "MetricEvent_type_idx" ON "MetricEvent"("type");

-- CreateIndex
CREATE INDEX "MetricEvent_createdAt_idx" ON "MetricEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SearchIndex_refType_refId_idx" ON "SearchIndex"("refType", "refId");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_name_idx" ON "UserBadge"("name");

-- CreateIndex
CREATE INDEX "Tier_creatorId_idx" ON "Tier"("creatorId");

-- CreateIndex
CREATE INDEX "Subscription_creatorId_idx" ON "Subscription"("creatorId");

-- CreateIndex
CREATE INDEX "Subscription_subscriberId_idx" ON "Subscription"("subscriberId");

-- CreateIndex
CREATE INDEX "Subscription_tierId_idx" ON "Subscription"("tierId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_renewsAt_idx" ON "Subscription"("renewsAt");

-- CreateIndex
CREATE INDEX "Trade_initiatorId_idx" ON "Trade"("initiatorId");

-- CreateIndex
CREATE INDEX "Trade_receiverId_idx" ON "Trade"("receiverId");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- CreateIndex
CREATE INDEX "Trade_createdAt_idx" ON "Trade"("createdAt");

-- CreateIndex
CREATE INDEX "CreatorRequest_userId_idx" ON "CreatorRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_name_key" ON "Agent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTool_agentId_name_key" ON "AgentTool"("agentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentDataset_agentId_key_key" ON "AgentDataset"("agentId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPlaybook_agentId_name_key" ON "AgentPlaybook"("agentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentGuardrail_agentId_rule_key" ON "AgentGuardrail"("agentId", "rule");

-- CreateIndex
CREATE UNIQUE INDEX "AgentHandoff_agentId_toName_key" ON "AgentHandoff"("agentId", "toName");

-- CreateIndex
CREATE UNIQUE INDEX "AgentKPI_agentId_key_key" ON "AgentKPI"("agentId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AgentEval_agentId_name_key" ON "AgentEval"("agentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentCadence_agentId_key" ON "AgentCadence"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentABTest_agentId_key" ON "AgentABTest"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPrompt_agentId_key" ON "AgentPrompt"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_name_key" ON "Workflow"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_workflowId_order_key" ON "WorkflowStep"("workflowId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "BmiConnection_userId_key" ON "BmiConnection"("userId");

-- CreateIndex
CREATE INDEX "BmiConnection_userId_idx" ON "BmiConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BmiOAuthState_state_key" ON "BmiOAuthState"("state");

-- CreateIndex
CREATE INDEX "BmiOAuthState_userId_idx" ON "BmiOAuthState"("userId");

-- CreateIndex
CREATE INDEX "BmiTrackRegistration_userId_idx" ON "BmiTrackRegistration"("userId");

-- CreateIndex
CREATE INDEX "BmiTrackRegistration_trackId_idx" ON "BmiTrackRegistration"("trackId");

-- CreateIndex
CREATE INDEX "BmiPerformanceLog_userId_idx" ON "BmiPerformanceLog"("userId");
