/**
 * TapTap Matrix Beta Community Service
 * Manages beta user program, community features, and engagement
 */

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface BetaUser {
  id: string;
  userId: string;
  joinedAt: Date;
  status: BetaStatus;
  tier: BetaTier;
  points: number;
  achievements: string[];
  feedback: BetaFeedback[];
  inviteCode: string;
  referredBy?: string;
  referralCount: number;
}

export type BetaStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
export type BetaTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'FOUNDER';

export interface BetaFeedback {
  id: string;
  userId: string;
  type: FeedbackType;
  category: string;
  title: string;
  description: string;
  rating: number;
  status: FeedbackStatus;
  createdAt: Date;
  upvotes: number;
  tags: string[];
}

export type FeedbackType = 'BUG' | 'FEATURE_REQUEST' | 'IMPROVEMENT' | 'PRAISE' | 'GENERAL';
export type FeedbackStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface BetaChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  startDate: Date;
  endDate: Date;
  rewards: ChallengeReward[];
  participants: string[];
  status: ChallengeStatus;
}

export type ChallengeType = 'LISTENING' | 'SOCIAL' | 'FEEDBACK' | 'CREATIVE' | 'REFERRAL';
export type ChallengeStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ChallengeReward {
  type: 'TAPCOIN' | 'BADGE' | 'TIER_UPGRADE' | 'EXCLUSIVE_ACCESS';
  value: number | string;
  description: string;
}

export class BetaCommunityService {
  /**
   * Generate beta invite code
   */
  static generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BETA-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create beta user profile
   */
  static async createBetaUser(userId: string, referredBy?: string): Promise<BetaUser> {
    const inviteCode = this.generateInviteCode();
    
    // Create beta user record (using raw SQL since BetaUser table might not exist in Prisma schema)
    const betaUser: BetaUser = {
      id: randomUUID(),
      userId,
      joinedAt: new Date(),
      status: 'ACTIVE',
      tier: 'BRONZE',
      points: 100, // Welcome bonus
      achievements: ['BETA_TESTER', 'EARLY_ADOPTER'],
      feedback: [],
      inviteCode,
      referredBy,
      referralCount: 0
    };

    // Award referral bonus
    if (referredBy) {
      await this.awardReferralBonus(referredBy);
    }

    return betaUser;
  }

  /**
   * Award points to beta user
   */
  static async awardPoints(userId: string, points: number, reason: string): Promise<void> {
    // Implementation would update beta user points
    console.log(`Awarded ${points} points to ${userId} for: ${reason}`);
  }

  /**
   * Award referral bonus
   */
  static async awardReferralBonus(referrerUserId: string): Promise<void> {
    await this.awardPoints(referrerUserId, 500, 'Successful referral');
    // Could also upgrade tier if enough referrals
  }

  /**
   * Get beta user achievements
   */
  static getBetaAchievements(): Record<string, { name: string; description: string; icon: string; points: number }> {
    return {
      'BETA_TESTER': {
        name: 'Beta Tester',
        description: 'Joined the TapTap Matrix beta program',
        icon: '🧪',
        points: 100
      },
      'EARLY_ADOPTER': {
        name: 'Early Adopter',
        description: 'One of the first users on the platform',
        icon: '🚀',
        points: 200
      },
      'MUSIC_LOVER': {
        name: 'Music Lover',
        description: 'Listened to 50+ tracks',
        icon: '🎵',
        points: 150
      },
      'SOCIAL_BUTTERFLY': {
        name: 'Social Butterfly',
        description: 'Made 10+ posts and comments',
        icon: '🦋',
        points: 200
      },
      'FEEDBACK_HERO': {
        name: 'Feedback Hero',
        description: 'Provided 5+ valuable feedback items',
        icon: '💡',
        points: 300
      },
      'REFERRAL_CHAMPION': {
        name: 'Referral Champion',
        description: 'Referred 5+ new beta users',
        icon: '👥',
        points: 500
      },
      'PLAYLIST_CURATOR': {
        name: 'Playlist Curator',
        description: 'Created 10+ playlists',
        icon: '📋',
        points: 250
      },
      'AI_EXPLORER': {
        name: 'AI Explorer',
        description: 'Used AI music generation 20+ times',
        icon: '🤖',
        points: 300
      },
      'BATTLE_WARRIOR': {
        name: 'Battle Warrior',
        description: 'Participated in 10+ music battles',
        icon: '⚔️',
        points: 400
      },
      'FOUNDER': {
        name: 'Founder',
        description: 'Founding member of TapTap Matrix',
        icon: '👑',
        points: 1000
      }
    };
  }

  /**
   * Get current beta challenges
   */
  static getCurrentChallenges(): BetaChallenge[] {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'music-discovery-week',
        title: 'Music Discovery Week',
        description: 'Discover and listen to all Music For The Future tracks. Share your favorite!',
        type: 'LISTENING',
        startDate: now,
        endDate: nextWeek,
        rewards: [
          { type: 'TAPCOIN', value: 1000, description: '1000 TapCoins' },
          { type: 'BADGE', value: 'MUSIC_EXPLORER', description: 'Music Explorer Badge' }
        ],
        participants: [],
        status: 'ACTIVE'
      },
      {
        id: 'feedback-friday',
        title: 'Feedback Friday',
        description: 'Provide detailed feedback on your TapTap Matrix experience',
        type: 'FEEDBACK',
        startDate: now,
        endDate: nextWeek,
        rewards: [
          { type: 'TAPCOIN', value: 500, description: '500 TapCoins per feedback' },
          { type: 'TIER_UPGRADE', value: 'SILVER', description: 'Upgrade to Silver tier' }
        ],
        participants: [],
        status: 'ACTIVE'
      },
      {
        id: 'social-media-share',
        title: 'Share the Future',
        description: 'Share your favorite Music For The Future track on social media',
        type: 'SOCIAL',
        startDate: now,
        endDate: nextMonth,
        rewards: [
          { type: 'TAPCOIN', value: 750, description: '750 TapCoins' },
          { type: 'BADGE', value: 'SOCIAL_AMBASSADOR', description: 'Social Ambassador Badge' }
        ],
        participants: [],
        status: 'ACTIVE'
      },
      {
        id: 'invite-friends',
        title: 'Invite Your Friends',
        description: 'Invite friends to join the TapTap Matrix beta program',
        type: 'REFERRAL',
        startDate: now,
        endDate: nextMonth,
        rewards: [
          { type: 'TAPCOIN', value: 500, description: '500 TapCoins per successful invite' },
          { type: 'TIER_UPGRADE', value: 'GOLD', description: 'Gold tier after 3 invites' }
        ],
        participants: [],
        status: 'ACTIVE'
      },
      {
        id: 'ai-music-creation',
        title: 'AI Music Creator',
        description: 'Create 5 tracks using AI music generation tools',
        type: 'CREATIVE',
        startDate: now,
        endDate: nextMonth,
        rewards: [
          { type: 'TAPCOIN', value: 1500, description: '1500 TapCoins' },
          { type: 'BADGE', value: 'AI_CREATOR', description: 'AI Creator Badge' },
          { type: 'EXCLUSIVE_ACCESS', value: 'PREMIUM_AI', description: 'Premium AI tools access' }
        ],
        participants: [],
        status: 'ACTIVE'
      }
    ];
  }

  /**
   * Get beta tier benefits
   */
  static getBetaTierBenefits(): Record<BetaTier, { name: string; benefits: string[]; color: string; minPoints: number }> {
    return {
      'BRONZE': {
        name: 'Bronze Beta',
        benefits: ['Beta access', 'Community forum', 'Basic feedback channel'],
        color: 'from-amber-600 to-amber-700',
        minPoints: 0
      },
      'SILVER': {
        name: 'Silver Beta',
        benefits: ['All Bronze benefits', 'Priority support', 'Early feature access', 'Silver badge'],
        color: 'from-gray-400 to-gray-500',
        minPoints: 1000
      },
      'GOLD': {
        name: 'Gold Beta',
        benefits: ['All Silver benefits', 'Direct developer access', 'Feature voting rights', 'Gold badge'],
        color: 'from-yellow-400 to-yellow-500',
        minPoints: 2500
      },
      'PLATINUM': {
        name: 'Platinum Beta',
        benefits: ['All Gold benefits', 'Beta feature testing', 'Monthly video calls', 'Platinum badge'],
        color: 'from-slate-300 to-slate-400',
        minPoints: 5000
      },
      'FOUNDER': {
        name: 'Founder',
        benefits: ['All Platinum benefits', 'Lifetime premium access', 'Founder recognition', 'Special founder badge'],
        color: 'from-purple-400 to-purple-500',
        minPoints: 10000
      }
    };
  }

  /**
   * Calculate user tier based on points
   */
  static calculateTier(points: number): BetaTier {
    const tiers = this.getBetaTierBenefits();
    
    if (points >= tiers.FOUNDER.minPoints) return 'FOUNDER';
    if (points >= tiers.PLATINUM.minPoints) return 'PLATINUM';
    if (points >= tiers.GOLD.minPoints) return 'GOLD';
    if (points >= tiers.SILVER.minPoints) return 'SILVER';
    return 'BRONZE';
  }
}
