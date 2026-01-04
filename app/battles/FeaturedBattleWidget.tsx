"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Vote, Clock, Trophy, Users, Flame } from "lucide-react";

interface FeaturedBattle {
  id: string;
  weekStartDate: string;
  status: 'NOMINATION' | 'VOTING' | 'FEATURED' | 'COMPLETED';
  nominations: Array<{
    id: string;
    votes: number;
    battleContent: {
      id: string;
      title: string;
      thumbnailUrl: string;
      viewCount: number;
      battlerA?: string;
      battlerB?: string;
      league: {
        name: string;
        tier: string;
      };
    };
  }>;
  currentPhase: string;
  timeRemaining: number;
  canNominate: boolean;
  canVote: boolean;
}

interface FeaturedBattleWidgetProps {
  onBattleSelect?: (battleId: string) => void;
}

export function FeaturedBattleWidget({ onBattleSelect }: FeaturedBattleWidgetProps) {
  const [featuredData, setFeaturedData] = useState<FeaturedBattle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchFeaturedBattle();
    const interval = setInterval(fetchFeaturedBattle, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchFeaturedBattle = async () => {
    try {
      const response = await fetch('/api/battles/featured');
      const data = await response.json();
      setFeaturedData(data.weeklyFeatured);
    } catch (error) {
      console.error('Failed to fetch featured battle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (nominationId: string) => {
    if (voting) return;
    
    setVoting(true);
    try {
      const response = await fetch('/api/battles/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          nominationId
        })
      });

      if (response.ok) {
        await fetchFeaturedBattle(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVoting(false);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-teal-900/20 to-black/40 rounded-xl p-6 border border-teal-500/20">
        <div className="animate-pulse">
          <div className="h-6 bg-teal-500/20 rounded mb-4"></div>
          <div className="h-32 bg-teal-500/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!featuredData) return null;

  const topNomination = featuredData.nominations[0];
  const isVotingPhase = featuredData.status === 'VOTING';
  const isFeaturedPhase = featuredData.status === 'FEATURED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-teal-900/20 to-black/40 rounded-xl p-6 border border-teal-500/20 relative overflow-hidden"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent opacity-50"></div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-bold text-white">
            {isFeaturedPhase ? 'Featured Battle' : 'Weekly Battle Vote'}
          </h3>
        </div>
        
        {featuredData.timeRemaining > 0 && (
          <div className="flex items-center gap-1 text-teal-400 text-sm">
            <Clock className="w-4 h-4" />
            {formatTimeRemaining(featuredData.timeRemaining)}
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="relative z-10 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            isVotingPhase ? 'bg-yellow-400 animate-pulse' : 
            isFeaturedPhase ? 'bg-green-400' : 'bg-teal-400'
          }`}></div>
          <span className="text-teal-100">
            {isVotingPhase ? 'Voting in Progress' : 
             isFeaturedPhase ? 'Now Featured' : 'Nominations Open'}
          </span>
        </div>
      </div>

      {/* Top nomination or featured battle */}
      {topNomination && (
        <motion.div
          className="relative z-10 bg-black/30 rounded-lg p-4 border border-teal-500/20 cursor-pointer hover:border-teal-400/40 transition-colors"
          onClick={() => onBattleSelect?.(topNomination.battleContent.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="relative">
              <img
                src={topNomination.battleContent.thumbnailUrl || '/placeholder-battle.jpg'}
                alt={topNomination.battleContent.title}
                className="w-20 h-14 object-cover rounded"
              />
              {isFeaturedPhase && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1 rounded-full">
                  <Crown className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">
                {topNomination.battleContent.title}
              </h4>
              
              <div className="flex items-center gap-3 text-xs text-teal-300">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {topNomination.battleContent.viewCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Vote className="w-3 h-3" />
                  {topNomination.votes} votes
                </span>
                <span className="px-2 py-0.5 bg-teal-500/20 rounded text-teal-300">
                  {topNomination.battleContent.league.name}
                </span>
              </div>

              {/* Battlers */}
              {topNomination.battleContent.battlerA && topNomination.battleContent.battlerB && (
                <div className="mt-2 text-xs text-white/80">
                  <span className="text-red-400">{topNomination.battleContent.battlerA}</span>
                  <span className="mx-2 text-teal-400">VS</span>
                  <span className="text-blue-400">{topNomination.battleContent.battlerB}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vote button */}
          {isVotingPhase && featuredData.canVote && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleVote(topNomination.id);
              }}
              disabled={voting}
              className="mt-3 w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-teal-400 hover:to-teal-500 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {voting ? 'Voting...' : 'Vote for This Battle'}
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Additional nominations preview */}
      {featuredData.nominations.length > 1 && (
        <div className="relative z-10 mt-4">
          <div className="text-xs text-teal-300 mb-2">
            +{featuredData.nominations.length - 1} more nominations
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {featuredData.nominations.slice(1, 4).map((nomination) => (
              <div
                key={nomination.id}
                className="flex-shrink-0 w-16 h-12 bg-black/30 rounded border border-teal-500/20 overflow-hidden cursor-pointer"
                onClick={() => onBattleSelect?.(nomination.battleContent.id)}
              >
                <img
                  src={nomination.battleContent.thumbnailUrl || '/placeholder-battle.jpg'}
                  alt={nomination.battleContent.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
