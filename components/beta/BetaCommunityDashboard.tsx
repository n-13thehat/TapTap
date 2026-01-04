"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Trophy,
  Star,
  Gift,
  MessageSquare,
  TrendingUp,
  Award,
  Zap,
  Crown,
  Target,
  Calendar,
  Share2,
  Heart,
  Sparkles
} from 'lucide-react';
import { BetaCommunityService, BetaChallenge, BetaTier } from '@/lib/services/betaCommunityService';

interface BetaCommunityDashboardProps {
  className?: string;
}

export default function BetaCommunityDashboard({ className = '' }: BetaCommunityDashboardProps) {
  const [currentChallenges, setCurrentChallenges] = useState<BetaChallenge[]>([]);
  const [userTier, setUserTier] = useState<BetaTier>('BRONZE');
  const [userPoints, setUserPoints] = useState(100);
  const [achievements, setAchievements] = useState<string[]>(['BETA_TESTER', 'EARLY_ADOPTER']);

  useEffect(() => {
    // Load beta community data
    const challenges = BetaCommunityService.getCurrentChallenges();
    setCurrentChallenges(challenges);
    
    // Calculate user tier based on points
    const tier = BetaCommunityService.calculateTier(userPoints);
    setUserTier(tier);
  }, [userPoints]);

  const betaAchievements = BetaCommunityService.getBetaAchievements();
  const tierBenefits = BetaCommunityService.getBetaTierBenefits();
  const currentTierInfo = tierBenefits[userTier];
  const nextTier = userTier === 'FOUNDER' ? null : 
    Object.entries(tierBenefits).find(([_, info]) => info.minPoints > userPoints)?.[0] as BetaTier;

  const getTierIcon = (tier: BetaTier) => {
    switch (tier) {
      case 'BRONZE': return '🥉';
      case 'SILVER': return '🥈';
      case 'GOLD': return '🥇';
      case 'PLATINUM': return '💎';
      case 'FOUNDER': return '👑';
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'LISTENING': return '🎵';
      case 'SOCIAL': return '📱';
      case 'FEEDBACK': return '💡';
      case 'CREATIVE': return '🎨';
      case 'REFERRAL': return '👥';
      default: return '🎯';
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Beta Program Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full px-6 py-3 mb-6">
          <Crown className="h-5 w-5 text-purple-300" />
          <span className="text-purple-300 font-medium">Beta Community</span>
          <Sparkles className="h-4 w-4 text-pink-300" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">Welcome, Beta Tester!</h2>
        <p className="text-white/70 max-w-2xl mx-auto">
          You're part of an exclusive community shaping the future of music. 
          Complete challenges, earn rewards, and help us build something amazing together.
        </p>
      </motion.div>

      {/* User Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${currentTierInfo.color} p-6 text-white`}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{getTierIcon(userTier)}</div>
              <div>
                <h3 className="text-xl font-bold">{currentTierInfo.name}</h3>
                <p className="text-white/80">Beta Tester</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{userPoints.toLocaleString()}</div>
              <div className="text-sm text-white/80">Points</div>
            </div>
          </div>

          {nextTier && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {tierBenefits[nextTier].name}</span>
                <span>{tierBenefits[nextTier].minPoints - userPoints} points needed</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (userPoints / tierBenefits[nextTier].minPoints) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">{achievements.length}</div>
              <div className="text-xs text-white/80">Achievements</div>
            </div>
            <div>
              <div className="text-lg font-semibold">5</div>
              <div className="text-xs text-white/80">Days Active</div>
            </div>
            <div>
              <div className="text-lg font-semibold">12</div>
              <div className="text-xs text-white/80">Feedback Given</div>
            </div>
            <div>
              <div className="text-lg font-semibold">3</div>
              <div className="text-xs text-white/80">Friends Invited</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Challenges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6">Active Challenges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentChallenges.slice(0, 4).map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">{getChallengeIcon(challenge.type)}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{challenge.title}</h4>
                  <p className="text-white/70 text-sm">{challenge.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {challenge.rewards.map((reward, idx) => (
                    <span key={idx} className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded">
                      {reward.type === 'TAPCOIN' ? `${reward.value} TC` : reward.value}
                    </span>
                  ))}
                </div>
                <button className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition-colors">
                  Join
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6">Your Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(betaAchievements).map(([key, achievement]) => {
            const earned = achievements.includes(key);
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center p-4 rounded-xl border transition-all ${
                  earned 
                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30' 
                    : 'bg-white/5 border-white/10 opacity-50'
                }`}
              >
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h4 className="font-medium text-white text-sm mb-1">{achievement.name}</h4>
                <p className="text-white/60 text-xs">{achievement.points} pts</p>
                {earned && (
                  <div className="mt-2">
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                      Earned
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white mb-1">247</div>
          <div className="text-white/60 text-sm">Beta Testers</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <MessageSquare className="h-8 w-8 text-green-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white mb-1">1,432</div>
          <div className="text-white/60 text-sm">Feedback Items</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white mb-1">89%</div>
          <div className="text-white/60 text-sm">Satisfaction Rate</div>
        </div>
      </motion.div>
    </div>
  );
}
