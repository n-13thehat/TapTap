"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  Music,
  Play,
  Heart,
  Share2,
  MessageCircle,
  Eye,
  Calendar,
  Globe,
  Smartphone,
  Award,
  Zap
} from 'lucide-react';
import { CreatorAnalyticsService, CreatorStats, TrackAnalytics } from '@/lib/services/creatorAnalyticsService';

interface CreatorDashboardProps {
  creatorId?: string;
  className?: string;
}

export default function CreatorDashboard({ creatorId = 'vx', className = '' }: CreatorDashboardProps) {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [topTracks, setTopTracks] = useState<TrackAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [creatorId, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [creatorStats, tracks] = await Promise.all([
        CreatorAnalyticsService.getCreatorStats(creatorId),
        CreatorAnalyticsService.getTopTracks(creatorId, 5)
      ]);
      
      setStats(creatorStats);
      setTopTracks(tracks);
    } catch (error) {
      console.error('Failed to load creator dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-white/60">Failed to load creator dashboard</div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Creator Dashboard</h1>
          <p className="text-white/70">Track your music performance and earnings</p>
        </div>
        
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-teal-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 border border-teal-400/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-teal-500/20 rounded-lg">
              <Play className="h-6 w-6 text-teal-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{formatNumber(stats.totalStreams)}</div>
              <div className="text-teal-400 text-sm">Total Streams</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-green-400 text-sm">+{stats.monthlyGrowth}% this month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-green-400 text-sm">Total Revenue</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">+$420 this week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{formatNumber(stats.totalFans)}</div>
              <div className="text-blue-400 text-sm">Total Fans</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-green-400 text-sm">+47 new fans</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Music className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{stats.totalTracks}</div>
              <div className="text-purple-400 text-sm">Total Tracks</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">{stats.averageRating}/5.0 rating</span>
          </div>
        </motion.div>
      </div>

      {/* Top Tracks Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Top Performing Tracks</h2>
        
        <div className="space-y-4">
          {topTracks.map((track, index) => (
            <motion.div
              key={track.trackId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{track.title}</h3>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    <span>{formatNumber(track.streams)} streams</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{formatNumber(track.likes)} likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    <span>{formatNumber(track.shares)} shares</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-white">{formatCurrency(track.revenue)}</div>
                <div className="text-sm text-white/60">Revenue</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
        
        <div className="space-y-3">
          {stats.recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className={`p-2 rounded-lg ${
                activity.type === 'stream' ? 'bg-teal-500/20 text-teal-400' :
                activity.type === 'purchase' ? 'bg-green-500/20 text-green-400' :
                activity.type === 'follow' ? 'bg-blue-500/20 text-blue-400' :
                activity.type === 'comment' ? 'bg-purple-500/20 text-purple-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {activity.type === 'stream' && <Play className="h-4 w-4" />}
                {activity.type === 'purchase' && <DollarSign className="h-4 w-4" />}
                {activity.type === 'follow' && <Users className="h-4 w-4" />}
                {activity.type === 'comment' && <MessageCircle className="h-4 w-4" />}
                {activity.type === 'share' && <Share2 className="h-4 w-4" />}
              </div>
              
              <div className="flex-1">
                <div className="text-white text-sm">{activity.description}</div>
                <div className="text-white/60 text-xs">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
              
              {activity.value && (
                <div className="text-green-400 font-medium">
                  +{activity.value} TC
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
