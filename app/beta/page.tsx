"use client";

import React from 'react';
import { motion } from 'framer-motion';
import BetaCommunityDashboard from '@/components/beta/BetaCommunityDashboard';
import AppLayout from '@/components/layout/AppLayout';
import { Crown, Users, Sparkles, Trophy, Gift, Zap } from 'lucide-react';

export default function BetaCommunityPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full px-6 py-3 mb-6">
              <Crown className="h-5 w-5 text-purple-300" />
              <span className="text-purple-300 font-medium">Exclusive Beta Program</span>
              <Sparkles className="h-4 w-4 text-pink-300" />
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-300 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-4">
              Beta Community
            </h1>
            
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
              Join an exclusive community of music pioneers shaping the future of TapTap Matrix. 
              Get early access to features, earn rewards, and help us build the ultimate music platform.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-400" />
                <span>Exclusive Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span>Achievements & Rewards</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span>Community Challenges</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-400" />
                <span>TapCoin Rewards</span>
              </div>
            </div>
          </motion.div>

          {/* Beta Community Dashboard */}
          <BetaCommunityDashboard />

          {/* How to Join */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">How to Maximize Your Beta Experience</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Engage Daily</h3>
                <p className="text-white/70 text-sm">
                  Use TapTap Matrix daily, explore features, listen to music, and interact with the community 
                  to earn points and unlock achievements.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Complete Challenges</h3>
                <p className="text-white/70 text-sm">
                  Participate in weekly challenges to earn TapCoins, badges, and tier upgrades. 
                  Each challenge offers unique rewards and recognition.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Provide Feedback</h3>
                <p className="text-white/70 text-sm">
                  Share your thoughts, report bugs, and suggest features. Your feedback directly 
                  shapes the platform and earns you valuable rewards.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Beta Tiers Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            <div className="bg-gradient-to-br from-amber-600/10 to-amber-700/10 border border-amber-400/20 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🥉</div>
              <h4 className="font-semibold text-amber-300 mb-2">Bronze</h4>
              <p className="text-white/70 text-sm">Starting tier with basic beta access and community features.</p>
              <div className="text-xs text-amber-400 mt-2">0+ points</div>
            </div>

            <div className="bg-gradient-to-br from-gray-400/10 to-gray-500/10 border border-gray-400/20 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🥈</div>
              <h4 className="font-semibold text-gray-300 mb-2">Silver</h4>
              <p className="text-white/70 text-sm">Priority support and early access to new features.</p>
              <div className="text-xs text-gray-400 mt-2">1,000+ points</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-500/10 border border-yellow-400/20 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🥇</div>
              <h4 className="font-semibold text-yellow-300 mb-2">Gold</h4>
              <p className="text-white/70 text-sm">Direct developer access and feature voting rights.</p>
              <div className="text-xs text-yellow-400 mt-2">2,500+ points</div>
            </div>

            <div className="bg-gradient-to-br from-slate-300/10 to-slate-400/10 border border-slate-400/20 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">💎</div>
              <h4 className="font-semibold text-slate-300 mb-2">Platinum</h4>
              <p className="text-white/70 text-sm">Beta feature testing and monthly video calls.</p>
              <div className="text-xs text-slate-400 mt-2">5,000+ points</div>
            </div>

            <div className="bg-gradient-to-br from-purple-400/10 to-purple-500/10 border border-purple-400/20 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">👑</div>
              <h4 className="font-semibold text-purple-300 mb-2">Founder</h4>
              <p className="text-white/70 text-sm">Lifetime premium access and founder recognition.</p>
              <div className="text-xs text-purple-400 mt-2">10,000+ points</div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
