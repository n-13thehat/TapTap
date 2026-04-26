import { NextRequest, NextResponse } from 'next/server';
import { BetaCommunityService } from '@/lib/services/betaCommunityService';
import { auth } from '@/auth.config';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'challenges', 'achievements', 'tiers', 'stats'
    const userId = searchParams.get('userId');

    if (type === 'challenges') {
      const challenges = BetaCommunityService.getCurrentChallenges();
      return NextResponse.json({
        challenges,
        totalChallenges: challenges.length,
        activeChallenges: challenges.filter(c => c.status === 'ACTIVE').length
      });
    }
    
    if (type === 'achievements') {
      const achievements = BetaCommunityService.getBetaAchievements();
      return NextResponse.json({
        achievements,
        totalAchievements: Object.keys(achievements).length,
        categories: {
          engagement: ['BETA_TESTER', 'EARLY_ADOPTER', 'MUSIC_LOVER'],
          social: ['SOCIAL_BUTTERFLY', 'REFERRAL_CHAMPION'],
          creative: ['PLAYLIST_CURATOR', 'AI_EXPLORER'],
          competitive: ['BATTLE_WARRIOR'],
          special: ['FEEDBACK_HERO', 'FOUNDER']
        }
      });
    }
    
    if (type === 'tiers') {
      const tiers = BetaCommunityService.getBetaTierBenefits();
      return NextResponse.json({
        tiers,
        tierOrder: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'FOUNDER']
      });
    }
    
    if (type === 'stats') {
      const stats = {
        totalBetaUsers: 247,
        activeBetaUsers: 189,
        feedbackItems: 1432,
        resolvedFeedback: 1276,
        satisfactionRate: 89,
        averagePoints: 1850,
        topTier: 'GOLD',
        challengesCompleted: 3421,
        totalRewardsDistributed: 125000
      };
      
      return NextResponse.json({
        stats,
        lastUpdated: new Date().toISOString()
      });
    }
    
    if (userId) {
      const mockUserData = {
        userId,
        betaStatus: 'ACTIVE',
        tier: 'BRONZE',
        points: 100,
        joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        achievements: ['BETA_TESTER', 'EARLY_ADOPTER'],
        challengesCompleted: 0,
        feedbackGiven: 0,
        referrals: 0,
        inviteCode: BetaCommunityService.generateInviteCode()
      };
      
      return NextResponse.json({
        user: mockUserData,
        nextTierRequirement: 1000 - mockUserData.points,
        availableChallenges: BetaCommunityService.getCurrentChallenges().length,
        earnedAchievements: mockUserData.achievements.length,
        totalAchievements: Object.keys(BetaCommunityService.getBetaAchievements()).length
      });
    }
    
    const challenges = BetaCommunityService.getCurrentChallenges();
    const achievements = BetaCommunityService.getBetaAchievements();
    const tiers = BetaCommunityService.getBetaTierBenefits();
    return NextResponse.json({
      overview: {
        totalChallenges: challenges.length,
        activeChallenges: challenges.filter(c => c.status === 'ACTIVE').length,
        totalAchievements: Object.keys(achievements).length,
        totalTiers: Object.keys(tiers).length,
        communitySize: 247
      },
      featured: {
        challenges: challenges.slice(0, 3),
        achievements: Object.entries(achievements).slice(0, 5).map(([key, achievement]) => ({
          id: key,
          ...achievement
        })),
        tiers: Object.entries(tiers).map(([key, tier]) => ({
          id: key,
          ...tier
        }))
      },
      stats: {
        totalBetaUsers: 247,
        activeBetaUsers: 189,
        feedbackItems: 1432,
        satisfactionRate: 89,
        challengesCompleted: 3421,
        totalRewards: 125000
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve beta community data', { metadata: { error: String(error) } });
    return NextResponse.json({ error: 'Failed to retrieve beta community data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for all point-awarding actions
    const session = await auth();
    const sessionUserId = (session as any)?.user?.id as string | undefined;
    if (!sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, challengeId, feedbackData } = body;
    // Always use the authenticated user's id — never trust client-supplied userId
    const userId = sessionUserId;

    if (action === 'join-challenge' && challengeId) {
      await BetaCommunityService.awardPoints(userId, 50, 'Joined beta challenge');
      
      return NextResponse.json({
        success: true,
        message: 'Successfully joined challenge',
        pointsAwarded: 50,
        challengeId
      });
    }
    
    if (action === 'submit-feedback' && feedbackData) {
      await BetaCommunityService.awardPoints(userId, 100, 'Submitted valuable feedback');
      
      return NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully',
        pointsAwarded: 100,
        feedbackId: `feedback-${Date.now()}`
      });
    }
    
    if (action === 'claim-achievement') {
      const { achievementId } = body;
      const achievements = BetaCommunityService.getBetaAchievements();
      const achievement = achievements[achievementId];
      if (achievement) {
        await BetaCommunityService.awardPoints(userId, achievement.points, `Earned achievement: ${achievement.name}`);
        return NextResponse.json({
          success: true,
          message: `Achievement "${achievement.name}" claimed!`,
          pointsAwarded: achievement.points,
          achievementId
        });
      }
    }
    
    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Failed to process beta action', { metadata: { error: String(error) } });
    return NextResponse.json({ error: 'Failed to process beta action' }, { status: 500 });
  }
}
