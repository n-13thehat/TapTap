import { NextRequest, NextResponse } from 'next/server';
import { BetaCommunityService } from '@/lib/services/betaCommunityService';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 GET /api/beta called');
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'challenges', 'achievements', 'tiers', 'stats'
    const userId = searchParams.get('userId');

    if (type === 'challenges') {
      // Return current beta challenges
      const challenges = BetaCommunityService.getCurrentChallenges();
      
      console.log(`✅ Retrieved ${challenges.length} beta challenges`);
      
      return NextResponse.json({
        challenges,
        totalChallenges: challenges.length,
        activeChallenges: challenges.filter(c => c.status === 'ACTIVE').length
      });
    }
    
    if (type === 'achievements') {
      // Return all available achievements
      const achievements = BetaCommunityService.getBetaAchievements();
      
      console.log(`✅ Retrieved ${Object.keys(achievements).length} achievements`);
      
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
      // Return tier information
      const tiers = BetaCommunityService.getBetaTierBenefits();
      
      console.log(`✅ Retrieved ${Object.keys(tiers).length} beta tiers`);
      
      return NextResponse.json({
        tiers,
        tierOrder: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'FOUNDER']
      });
    }
    
    if (type === 'stats') {
      // Return community statistics
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
      
      console.log('✅ Retrieved beta community stats');
      
      return NextResponse.json({
        stats,
        lastUpdated: new Date().toISOString()
      });
    }
    
    if (userId) {
      // Return user-specific beta data
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
      
      console.log(`✅ Retrieved beta data for user: ${userId}`);
      
      return NextResponse.json({
        user: mockUserData,
        nextTierRequirement: 1000 - mockUserData.points,
        availableChallenges: BetaCommunityService.getCurrentChallenges().length,
        earnedAchievements: mockUserData.achievements.length,
        totalAchievements: Object.keys(BetaCommunityService.getBetaAchievements()).length
      });
    }
    
    // Default: return overview
    const challenges = BetaCommunityService.getCurrentChallenges();
    const achievements = BetaCommunityService.getBetaAchievements();
    const tiers = BetaCommunityService.getBetaTierBenefits();
    
    console.log('✅ Beta community overview generated');
    
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
    console.error('❌ Error in beta API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve beta community data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 POST /api/beta called');
    
    const body = await request.json();
    const { action, userId, challengeId, feedbackData } = body;

    if (action === 'join-challenge' && userId && challengeId) {
      // Join a beta challenge
      console.log(`✅ User ${userId} joined challenge ${challengeId}`);
      
      // Award points for joining
      await BetaCommunityService.awardPoints(userId, 50, 'Joined beta challenge');
      
      return NextResponse.json({
        success: true,
        message: 'Successfully joined challenge',
        pointsAwarded: 50,
        challengeId
      });
    }
    
    if (action === 'submit-feedback' && userId && feedbackData) {
      // Submit beta feedback
      console.log(`✅ User ${userId} submitted feedback`);
      
      // Award points for feedback
      await BetaCommunityService.awardPoints(userId, 100, 'Submitted valuable feedback');
      
      return NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully',
        pointsAwarded: 100,
        feedbackId: `feedback-${Date.now()}`
      });
    }
    
    if (action === 'claim-achievement' && userId) {
      // Claim an achievement
      const { achievementId } = body;
      const achievements = BetaCommunityService.getBetaAchievements();
      const achievement = achievements[achievementId];
      
      if (achievement) {
        await BetaCommunityService.awardPoints(userId, achievement.points, `Earned achievement: ${achievement.name}`);
        
        console.log(`✅ User ${userId} claimed achievement ${achievementId}`);
        
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
    console.error('❌ Error in beta POST API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process beta action',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
