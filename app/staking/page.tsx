"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Coins,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Shield,
  Star,
  Gift,
  Calendar,
  ArrowRight,
  Plus
} from 'lucide-react';

interface StakingPool {
  id: string;
  name: string;
  description: string;
  poolType: string;
  minStakeAmount: number;
  maxStakeAmount: number | null;
  lockPeriodDays: number;
  apy: number;
  totalStaked: number;
  totalActiveStakers: number;
  userStake?: {
    id: string;
    amount: number;
    stakedAt: string;
    lockEndsAt: string;
    rewardsClaimed: number;
  };
  estimatedDailyReward: number;
  estimatedYearlyReward: number;
}

export default function StakingPage() {
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    loadStakingPools();
    loadUserBalance();
  }, []);

  const loadStakingPools = async () => {
    try {
      const response = await fetch('/api/staking/pools');
      const data = await response.json();
      
      if (response.ok) {
        setPools(data.pools);
      }
    } catch (error) {
      console.error('Failed to load staking pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const response = await fetch('/api/treasure/balance');
      const data = await response.json();
      
      if (response.ok) {
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleStake = async (pool: StakingPool) => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;

    try {
      const response = await fetch('/api/staking/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: pool.id,
          amount: parseInt(stakeAmount)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStakeAmount('');
        setSelectedPool(null);
        loadStakingPools();
        loadUserBalance();
      } else {
        alert(data.error || 'Failed to stake tokens');
      }
    } catch (error) {
      console.error('Staking failed:', error);
      alert('Failed to stake tokens');
    }
  };

  const getPoolTypeIcon = (type: string) => {
    switch (type) {
      case 'BASIC': return <Coins className="h-5 w-5" />;
      case 'PREMIUM': return <Star className="h-5 w-5" />;
      case 'LIQUIDITY': return <TrendingUp className="h-5 w-5" />;
      case 'NFT_BOOST': return <Gift className="h-5 w-5" />;
      case 'GOVERNANCE': return <Shield className="h-5 w-5" />;
      default: return <Lock className="h-5 w-5" />;
    }
  };

  const getPoolTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'BASIC': 'text-blue-400 bg-blue-500/20',
      'PREMIUM': 'text-yellow-400 bg-yellow-500/20',
      'LIQUIDITY': 'text-green-400 bg-green-500/20',
      'NFT_BOOST': 'text-purple-400 bg-purple-500/20',
      'GOVERNANCE': 'text-red-400 bg-red-500/20',
    };
    return colors[type] || 'text-gray-400 bg-gray-500/20';
  };

  const formatTimeRemaining = (lockEndsAt: string) => {
    const now = new Date();
    const end = new Date(lockEndsAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Unlocked';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h locked`;
    return `${hours}h locked`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#031a1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">TAP Staking</h1>
              <p className="text-white/70">Earn rewards by staking your TAP tokens</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60">Available Balance</div>
              <div className="text-xl font-bold text-teal-300">{userBalance.toLocaleString()} TAP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-teal-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {pools.reduce((sum, pool) => sum + pool.totalStaked, 0).toLocaleString()}
                </div>
                <div className="text-sm text-white/60">Total Staked</div>
              </div>
            </div>
          </div>
        </div>

        {/* Staking Pools */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Available Staking Pools</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-white/60">Loading staking pools...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pools.map((pool) => (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPoolTypeColor(pool.poolType)}`}>
                        {getPoolTypeIcon(pool.poolType)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{pool.name}</h3>
                        <p className="text-white/60 text-sm">{pool.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-teal-300">{pool.apy}%</div>
                      <div className="text-sm text-white/60">APY</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-white/60">Lock Period</div>
                      <div className="text-white font-medium">{pool.lockPeriodDays} days</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/60">Min Stake</div>
                      <div className="text-white font-medium">{pool.minStakeAmount.toLocaleString()} TAP</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/60">Total Staked</div>
                      <div className="text-white font-medium">{pool.totalStaked.toLocaleString()} TAP</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/60">Stakers</div>
                      <div className="text-white font-medium">{pool.totalActiveStakers}</div>
                    </div>
                  </div>

                  {pool.userStake ? (
                    <div className="bg-teal-500/10 border border-teal-400/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-teal-300 font-medium">Your Stake</span>
                        <span className="text-white font-bold">{pool.userStake.amount.toLocaleString()} TAP</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Status</span>
                        <span className="text-yellow-400">{formatTimeRemaining(pool.userStake.lockEndsAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Rewards Claimed</span>
                        <span className="text-green-400">{pool.userStake.rewardsClaimed.toLocaleString()} TAP</span>
                      </div>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPool(pool)}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Stake Tokens
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Stake Modal */}
        {selectedPool && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0a0a0a] border border-white/20 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Stake in {selectedPool.name}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Amount to Stake</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder={`Min: ${selectedPool.minStakeAmount} TAP`}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40"
                  />
                  <div className="text-xs text-white/60 mt-1">
                    Available: {userBalance.toLocaleString()} TAP
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">APY</span>
                    <span className="text-teal-300">{selectedPool.apy}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Lock Period</span>
                    <span className="text-white">{selectedPool.lockPeriodDays} days</span>
                  </div>
                  {stakeAmount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Est. Daily Reward</span>
                      <span className="text-green-400">
                        {Math.floor(parseInt(stakeAmount) * selectedPool.apy / 365 / 100)} TAP
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPool(null)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStake(selectedPool)}
                    disabled={!stakeAmount || parseInt(stakeAmount) < selectedPool.minStakeAmount}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Stake Tokens
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
